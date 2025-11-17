<script lang="ts">
	import { fade } from 'svelte/transition';

	import Img from './Zone5Img.svelte';
	import CloseButton from './atoms/CloseButton.svelte';
	import NextButton from './atoms/NextButton.svelte';
	import PrevButton from './atoms/PrevButton.svelte';
	import portal from './portal';
	import type { ImageData } from './types';

	interface Props {
		force?: boolean;
		image?: ImageData;
		onclose: () => void;
		onnext?: () => void;
		onprevious?: () => void;
		transitionDuration?: number;
	}

	let { force, image, onclose, onnext, onprevious, transitionDuration = 300 }: Props = $props();

	let transitioning = $state(false);
	let visible = $derived(image && !transitioning);
	let onFigureOutroEnd: (() => void) | undefined = undefined;
	const nextHandler = () => {
		transitioning = true;
		onFigureOutroEnd = onnext;
	};
	const prevHandler = () => {
		transitioning = true;
		onFigureOutroEnd = onprevious;
	};

	const keyHandler = (evt: KeyboardEvent) => {
		if (!image) return;
		switch (evt.key) {
			case 'Escape':
				evt.preventDefault();
				onclose();
				break;
			case ' ':
				// Only prevent default for spacebar when dialog is active
				evt.preventDefault();
				if (visible) {
					nextHandler();
				}
				break;
			case 'ArrowRight':
				if (visible) {
					evt.preventDefault();
					nextHandler();
				}
				break;
			case 'ArrowLeft':
				if (visible) {
					evt.preventDefault();
					prevHandler();
				}
				break;
		}
	};
</script>

<svelte:window onkeydown={keyHandler} />
{#if image || force}
	<section
		use:portal
		role="dialog"
		transition:fade={{ duration: force ? 0 : transitionDuration }}
		class="fixed z-50 inset-0 bg-zinc-50 text-zinc-950"
		data-zone5-lightbox="true"
	>
		<nav>
			<CloseButton
				class={[
					'absolute right-0 top-0 z-30 cursor-pointer p-4',
					'transition delay-150 duration-300 hover:bg-zinc-100/10',
				]}
				{onclose}
				data-zone5-close
			/>
			{#if onprevious}
				<PrevButton
					class={[
						'absolute left-0 top-1/2 z-30 -translate-y-1/2 cursor-pointer p-2',
						'transition delay-150 duration-300 hover:bg-zinc-100/10',
					]}
					disabled={!visible}
					onprevious={prevHandler}
					data-zone5-prev
				/>
			{/if}
			{#if onnext}
				<NextButton
					class={[
						'absolute right-0 top-1/2 z-30 -translate-y-1/2 cursor-pointer p-2',
						'transition delay-150 duration-300 hover:bg-zinc-100/10',
					]}
					disabled={!visible}
					onnext={nextHandler}
					data-zone5-next
				/>
			{/if}
		</nav>
		{#if image && visible}
			<figure
				transition:fade={{ duration: transitionDuration }}
				onoutroend={() => {
					onFigureOutroEnd?.();
					transitioning = false;
				}}
				class="h-full w-full flex flex-col justify-between items-center p-8"
			>
				<div class="flex-1 flex items-center justify-center min-h-0">
					<Img {image} class="min-h-0 max-h-full" />
				</div>
				{#if image.properties.title}
					<figcaption class="pt-2 text-center">
						{image.properties.title}
					</figcaption>
				{/if}
			</figure>
		{/if}
	</section>
{/if}

<style lang="postcss">
	:global(html:has([role='dialog'])) {
		overflow: hidden;
	}
</style>
