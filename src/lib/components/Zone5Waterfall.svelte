<script lang="ts">
	import Img from './Zone5Img.svelte';
	import { DEFAULT_COLUMN_BREAKPOINTS } from './constants';
	import type { ImageData } from './types';
	import { calculateColumnCount, calculateWaterfallLayout } from '../layouts/waterfall.js';

	interface Props {
		columnBreakpoints?: { [key: number]: number };
		images: ImageData[];
		onImageClick?: (index: number) => void;
	}

	let { columnBreakpoints = DEFAULT_COLUMN_BREAKPOINTS, images, onImageClick }: Props = $props();

	let containerWidth = $state(0);

	// Calculate number of columns based on container width
	let nColumns = $derived(calculateColumnCount(containerWidth, columnBreakpoints));

	// Convert ImageData to layout input format
	let layoutItems = $derived(
		images.map((image, index) => ({
			aspectRatio: image.properties.aspectRatio,
			index,
		})),
	);

	// Calculate layout using pure function
	let columns = $derived(calculateWaterfallLayout(layoutItems, nColumns));
</script>

<div class="flex gap-2" bind:clientWidth={containerWidth} role="list">
	{#each columns as column, columnId (columnId)}
		<div class="flex flex-col gap-2" role="listitem">
			{#each column.items as item (item.index)}
				{@const image = images[item.index]}
				<div>
					<Img {image} onclick={onImageClick ? () => onImageClick(item.index) : undefined} />
				</div>
			{/each}
			{#if column.fillerHeight > 0}
				<div
					class="bg-slate-200 rounded"
					style:height={column.fillerHeight * 100 + '%'}
					aria-hidden="true"
				></div>
			{/if}
		</div>
	{/each}
</div>
