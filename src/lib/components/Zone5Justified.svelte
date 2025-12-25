<script lang="ts">
	import Img from './Zone5Img.svelte';
	import { DEFAULT_TARGET_ROW_HEIGHT, DEFAULT_GAP, PANORAMA_THRESHOLD } from './constants';
	import type { ImageData } from './types';

	interface Props {
		images: ImageData[];
		onImageClick?: (index: number) => void;
		targetRowHeight?: number;
		gap?: number;
	}

	let {
		images,
		onImageClick,
		targetRowHeight = DEFAULT_TARGET_ROW_HEIGHT,
		gap = DEFAULT_GAP,
	}: Props = $props();

	let containerWidth = $state(0);

	interface JustifiedRow {
		images: { image: ImageData; idx: number }[];
		height: number;
	}

	/**
	 * Calculate the row height that makes all images fit the container width exactly.
	 * Formula: h = (containerWidth - totalGaps) / sum(aspectRatios)
	 */
	function calculateRowHeight(
		row: { image: ImageData; idx: number }[],
		width: number,
		gapSize: number,
	): number {
		const aspectRatioSum = row.reduce((sum, item) => sum + item.image.properties.aspectRatio, 0);
		const totalGapWidth = (row.length - 1) * gapSize;
		const availableWidth = width - totalGapWidth;
		return availableWidth / aspectRatioSum;
	}

	/**
	 * Calculate justified rows using a greedy algorithm.
	 * Images are added to rows until the row height drops to or below the target height.
	 */
	let rows = $derived.by((): JustifiedRow[] => {
		if (images.length === 0) {
			return [];
		}

		// Use containerWidth if available, otherwise fall back to a default for SSR/testing
		const effectiveWidth = containerWidth > 0 ? containerWidth : 1200;

		const result: JustifiedRow[] = [];
		let currentRow: { image: ImageData; idx: number }[] = [];

		for (let i = 0; i < images.length; i++) {
			const image = images[i];
			const aspectRatio = image.properties.aspectRatio;

			// Handle panoramas: if we have images in the current row, finalize it first
			if (aspectRatio > PANORAMA_THRESHOLD && currentRow.length > 0) {
				result.push({
					images: [...currentRow],
					height: calculateRowHeight(currentRow, effectiveWidth, gap),
				});
				currentRow = [];
			}

			currentRow.push({ image, idx: i });

			// Panorama gets its own row with height capped at target
			if (aspectRatio > PANORAMA_THRESHOLD) {
				const panoramaHeight = Math.min(effectiveWidth / aspectRatio, targetRowHeight);
				result.push({
					images: [...currentRow],
					height: panoramaHeight,
				});
				currentRow = [];
				continue;
			}

			const rowHeight = calculateRowHeight(currentRow, effectiveWidth, gap);

			// If row height is at or below target, finalize this row
			if (rowHeight <= targetRowHeight) {
				result.push({
					images: [...currentRow],
					height: rowHeight,
				});
				currentRow = [];
			}
		}

		// Handle last row: left-align by capping height at target
		if (currentRow.length > 0) {
			const calculatedHeight = calculateRowHeight(currentRow, effectiveWidth, gap);
			result.push({
				images: currentRow,
				height: Math.min(calculatedHeight, targetRowHeight),
			});
		}

		return result;
	});
</script>

<div
	class="zone5-justified flex flex-col"
	bind:clientWidth={containerWidth}
	role="list"
	style:gap="{gap}px"
>
	{#each rows as row, rowIdx (rowIdx)}
		<div class="zone5-justified-row flex" style:height="{row.height}px" style:gap="{gap}px">
			{#each row.images as { image, idx } (idx)}
				<div
					class="zone5-justified-item shrink-0"
					role="listitem"
					style:width="{row.height * image.properties.aspectRatio}px"
					style:height="{row.height}px"
				>
					<Img {image} cover class="w-full h-full" onclick={onImageClick ? () => onImageClick(idx) : undefined} />
				</div>
			{/each}
		</div>
	{/each}
</div>
