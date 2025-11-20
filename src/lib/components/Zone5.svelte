<script lang="ts">
	import { onMount, untrack } from 'svelte';

	import { useImageRegistry } from './Zone5Provider.svelte';
	import Zone5Single from './Zone5Single.svelte';
	import Zone5Wall from './Zone5Wall.svelte';
	import Zone5Waterfall from './Zone5Waterfall.svelte';
	import { DEFAULT_COLUMN_BREAKPOINTS } from './constants';
	import type { ImageData } from './types';

	interface Props {
		columnBreakpoints?: { [key: number]: number };
		images: ImageData[];
		mode?: 'wall' | 'waterfall';
		nocaption?: boolean;
	}

	let {
		columnBreakpoints = DEFAULT_COLUMN_BREAKPOINTS,
		images,
		mode = 'wall',
		nocaption = false,
	}: Props = $props();

	const imageStore = useImageRegistry();
	const componentId: symbol = Symbol('Zone5Component');

	// Register images with the global image registry
	$effect(() => {
		// Track images to re-run when they change
		const imagesToRegister = images;

		// Use untrack to prevent the store update from creating a circular dependency
		untrack(() => {
			if (imageStore) {
				imageStore.register(componentId, imagesToRegister);
			}
		});
	});

	// Cleanup on component unmount
	onMount(() => {
		return () => {
			if (imageStore) {
				imageStore.remove(componentId);
			}
		};
	});

	/**
	 * Opens the lightbox for the image at the specified index
	 */
	function handleImageClick(index: number): void {
		if (imageStore) {
			imageStore.setCurrent(componentId, index);
		}
	}
</script>

{#if mode === 'wall' && images.length === 1}
	<Zone5Single
		image={images[0]}
		{nocaption}
		onclick={imageStore ? () => handleImageClick(0) : undefined}
	/>
{:else if mode === 'wall'}
	<Zone5Wall {images} onImageClick={imageStore ? handleImageClick : undefined} />
{:else if mode === 'waterfall'}
	<Zone5Waterfall
		{columnBreakpoints}
		{images}
		onImageClick={imageStore ? handleImageClick : undefined}
	/>
{/if}
