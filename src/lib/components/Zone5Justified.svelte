<script lang="ts">
	import Img from './Zone5Img.svelte';
	import { DEFAULT_TARGET_ROW_HEIGHT, DEFAULT_GAP, PANORAMA_THRESHOLD } from './constants';
	import type { ImageData } from './types';
	import { calculateJustifiedLayout, calculateItemWidth } from '../layouts/justified.js';

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

	// Convert ImageData to layout input format
	let layoutItems = $derived(
		images.map((image, index) => ({
			aspectRatio: image.properties.aspectRatio,
			index,
		})),
	);

	// Calculate layout using pure function
	let rows = $derived.by(() => {
		// Use containerWidth if available, otherwise fall back to a default for SSR/testing
		const effectiveWidth = containerWidth > 0 ? containerWidth : 1200;

		return calculateJustifiedLayout(layoutItems, {
			containerWidth: effectiveWidth,
			targetRowHeight,
			gap,
			panoramaThreshold: PANORAMA_THRESHOLD,
		});
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
			{#each row.items as item (item.index)}
				{@const image = images[item.index]}
				{@const width = calculateItemWidth(item.aspectRatio, row.height)}
				<div
					class="zone5-justified-item shrink-0"
					role="listitem"
					style:width="{width}px"
					style:height="{row.height}px"
				>
					<Img {image} cover class="w-full h-full" onclick={onImageClick ? () => onImageClick(item.index) : undefined} />
				</div>
			{/each}
		</div>
	{/each}
</div>
