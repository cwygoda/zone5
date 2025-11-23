<script lang="ts">
	import { onMount, untrack } from 'svelte';

	import Img from './Zone5Img.svelte';
	import { useImageRegistry } from './Zone5Provider.svelte';
	import {
		DEFAULT_COLUMN_BREAKPOINTS,
		SINGLE_IMAGE_HEIGHT_CLASS,
		WALL_IMAGE_HEIGHT_CLASS,
	} from './constants';
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

	// WATERFALL MODE CALCULATIONS
	let containerWidth = $state(0);

	/**
	 * Calculate number of columns based on container width and breakpoints
	 */
	let nColumns = $derived.by(() => {
		if (mode !== 'waterfall') return 1;

		let columns = 1;
		const sortedBreakpoints = Object.entries(columnBreakpoints).sort(
			([a], [b]) => Number(a) - Number(b),
		);

		for (const [breakpoint, cols] of sortedBreakpoints) {
			if (containerWidth >= Number(breakpoint)) {
				columns = cols;
			}
		}

		return columns;
	});

	/**
	 * Distribute images across columns in round-robin fashion
	 */
	let colPhotos = $derived.by(() => {
		if (mode !== 'waterfall') return [];

		const cols: { image: ImageData; idx: number }[][] = Array.from({ length: nColumns }, () => []);
		images.forEach((image, idx) => {
			cols[idx % nColumns].push({ image, idx });
		});

		return cols;
	});

	/**
	 * Calculate filler heights to equalize column heights in waterfall mode
	 */
	let colFillers = $derived.by(() => {
		if (mode !== 'waterfall') return [];

		const totalHeights = colPhotos.map((col) =>
			col.reduce((sum, img) => sum + 1 / img.image.properties.aspectRatio, 0),
		);
		const maxHeight = Math.max(...totalHeights);

		return totalHeights.map((height) => maxHeight - height);
	});
</script>

{#if mode === 'wall' && images.length === 1}
	{@const image = images[0]}
	<figure class="flex justify-center" aria-label={image.properties.title || 'Image'}>
		<Img
			{image}
			class={SINGLE_IMAGE_HEIGHT_CLASS}
			onclick={imageStore ? () => handleImageClick(0) : undefined}
		/>
		{#if image.properties.title && !nocaption}
			<figcaption class="mt-2 text-sm text-gray-600">
				{image.properties.title}
			</figcaption>
		{/if}
	</figure>
{:else if mode === 'wall'}
	<div class="flex gap-2 flex-col md:flex-row md:flex-wrap zone5-wall" role="list">
		{#each images as image, idx (idx)}
			<div class="grow {WALL_IMAGE_HEIGHT_CLASS} flex" role="listitem">
				<Img
					{image}
					cover
					class="grow"
					onclick={imageStore ? () => handleImageClick(idx) : undefined}
				/>
			</div>
		{/each}
	</div>
{:else if mode === 'waterfall'}
	<div class="flex gap-2" bind:clientWidth={containerWidth} role="list">
		{#each Array.from({ length: nColumns }, (_, i) => i) as columnId (columnId)}
			<div class="flex flex-col gap-2" role="listitem">
				{#each colPhotos[columnId] as { image, idx } (idx)}
					<div>
						<Img {image} onclick={imageStore ? () => handleImageClick(idx) : undefined} />
					</div>
				{/each}
				{#if colFillers[columnId] > 0}
					<div
						class="bg-slate-200 rounded"
						style:height={colFillers[columnId] * 100 + '%'}
						aria-hidden="true"
					></div>
				{/if}
			</div>
		{/each}
	</div>
{/if}
