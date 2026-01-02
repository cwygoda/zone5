<script lang="ts">
	import Img from './Zone5Img.svelte';
	import { DEFAULT_COLUMN_BREAKPOINTS } from './constants';
	import type { ImageData } from './types';

	interface Props {
		columnBreakpoints?: { [key: number]: number };
		images: ImageData[];
		onImageClick?: (index: number) => void;
	}

	let { columnBreakpoints = DEFAULT_COLUMN_BREAKPOINTS, images, onImageClick }: Props = $props();

	let containerWidth = $state(0);

	/**
	 * Calculate number of columns based on container width and breakpoints
	 */
	let nColumns = $derived.by(() => {
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
		// Calculate heights and find max in a single pass to avoid array spread overhead
		const totalHeights: number[] = [];
		let maxHeight = 0;

		for (const col of colPhotos) {
			const height = col.reduce((sum, img) => sum + 1 / img.image.properties.aspectRatio, 0);
			totalHeights.push(height);
			if (height > maxHeight) {
				maxHeight = height;
			}
		}

		return totalHeights.map((height) => maxHeight - height);
	});
</script>

<div class="flex gap-2" bind:clientWidth={containerWidth} role="list">
	{#each Array.from({ length: nColumns }, (_, i) => i) as columnId (columnId)}
		<div class="flex flex-col gap-2" role="listitem">
			{#each colPhotos[columnId] as { image, idx } (idx)}
				<div>
					<Img {image} onclick={onImageClick ? () => onImageClick(idx) : undefined} />
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
