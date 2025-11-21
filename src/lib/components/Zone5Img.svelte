<script lang="ts">
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

	let loaded = $state(false);

	// Action to handle image load state - runs when element is mounted
	const useImageLoad: Action<HTMLImageElement> = (node) => {
		const handleLoad = () => {
			loaded = true;
		};

		// Check if already loaded (e.g., from cache)
		if (node.complete && node.naturalWidth > 0) {
			loaded = true;
			return;
		}

		// Not loaded yet - add listener first, then recheck to avoid race condition
		loaded = false;
		node.addEventListener('load', handleLoad);

		// Recheck complete after adding listener in case image loaded during setup
		if (node.complete && node.naturalWidth > 0) {
			loaded = true;
			node.removeEventListener('load', handleLoad);
			return;
		}

		return () => {
			node.removeEventListener('load', handleLoad);
		};
	};

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
			use:useImageLoad
		/>
	</picture>
</div>

<style lang="postcss">
	.aspect-ratio {
		aspect-ratio: var(--aspect-ratio) auto;
	}
</style>
