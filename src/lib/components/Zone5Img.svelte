<script lang="ts">
	import { untrack } from 'svelte';
	import type { Action } from 'svelte/action';

	import type { ImageData } from './types';

	interface Props {
		image: ImageData;
		class?: string;
		cover?: boolean;
		onclick?: () => void;
	}

	let { image, class: _class, cover, onclick }: Props = $props();

	const sizes = $derived.by(() => {
		const widths = image.assets.map((a) => a.width).sort((a, b) => a - b);
		const maxWidth = Math.max(...widths);

		// Generate breakpoints based on actual asset widths
		const breakpoints = [];
		if (maxWidth >= 1200) breakpoints.push('(min-width: 1200px) 1200px');
		if (maxWidth >= 768) breakpoints.push('(min-width: 768px) 768px');
		breakpoints.push(`${Math.min(maxWidth, 640)}px`);

		return breakpoints.join(', ');
	});

	let img: HTMLImageElement;
	let loaded = $state(true);

	$effect(() => {
		// Track `sizes` to rerun on change of `image` prop
		void sizes;
		// Track `img` element, in case effect runs before img is set
		const imgEl = img;

		if (!imgEl) return;
		if (imgEl.complete) {
			untrack(() => {
				loaded = true;
			});
			return;
		}

		untrack(() => {
			loaded = false;
		});
		const handleLoad = () => (loaded = true);
		imgEl.addEventListener('load', handleLoad);

		return () => {
			imgEl.removeEventListener('load', handleLoad);
		};
	});

	const useOnclick: Action<HTMLDivElement, (() => void) | undefined> = (node, handler) => {
		const setHandler = (handler?: () => void | undefined) => {
			const keyHandler = (event: KeyboardEvent) => {
				if (!handler) return;
				if (event.key === ' ' || event.key === 'Enter') {
					event.preventDefault();
					handler();
				}
			};
			if (handler) {
				node.onclick = handler;
				node.onkeydown = keyHandler;
				node.role = 'button';
				node.tabIndex = 0;
				node.classList.add('cursor-pointer');
			} else {
				node.onclick = null;
				node.onkeydown = null;
				node.role = null;
				node.tabIndex = -1;
				node.classList.remove('cursor-pointer');
			}
		};
		setHandler(handler);
		return {
			update: (handler) => setHandler(handler),
			destroy: () => setHandler(),
		};
	};
</script>

<div
	use:useOnclick={onclick}
	style="background-color:{image.properties.averageColor.hex}; --aspect-ratio: {image.properties
		.aspectRatio}"
	class={['aspect-ratio', 'relative', _class]}
	data-zone5-img="true"
>
	<picture class="w-full h-full flex justify-center relative mb-0 mt-0">
		<img
			src={image.assets[0].href}
			alt={image.properties.alt}
			title={image.properties.title}
			srcset={image.assets.map((asset) => `${asset.href} ${asset.width}w`).join(', ')}
			{sizes}
			loading="lazy"
			decoding="async"
			class={[
				'transition-opacity duration-100',
				{
					'object-cover h-full w-full': cover,
					'opacity-0': !loaded,
					'opacity-100': loaded,
				},
			]}
			bind:this={img}
		/>
	</picture>
</div>

<style lang="postcss">
	.aspect-ratio {
		aspect-ratio: var(--aspect-ratio) auto;
	}
</style>
