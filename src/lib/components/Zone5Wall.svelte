<script lang="ts">
	import Img from './Zone5Img.svelte';
	import { WALL_IMAGE_HEIGHT_CLASS } from './constants';
	import type { ImageData } from './types';

	interface Props {
		images: ImageData[];
		onImageClick?: (index: number) => void;
	}

	let { images, onImageClick }: Props = $props();
</script>

<div class="flex gap-2 flex-col md:flex-row md:flex-wrap zone5-wall" role="list">
	{#each images as image, idx (idx)}
		<div class="grow {WALL_IMAGE_HEIGHT_CLASS} flex" role="listitem">
			<Img
				{image}
				cover
				class="grow"
				onclick={onImageClick ? () => onImageClick(idx) : undefined}
			/>
		</div>
	{/each}
</div>
