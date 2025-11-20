<script lang="ts">
	import Img from './Zone5Img.svelte';
	import { SINGLE_IMAGE_HEIGHT_CLASS } from './constants';
	import type { ImageData } from './types';

	interface Props {
		image: ImageData;
		nocaption?: boolean;
		onclick?: () => void;
	}

	let { image, nocaption = false, onclick }: Props = $props();
</script>

<figure class="flex justify-center" aria-label={image.properties.title || 'Image'}>
	<Img {image} class={SINGLE_IMAGE_HEIGHT_CLASS} {onclick} />
	{#if image.properties.title && !nocaption}
		<figcaption class="mt-2 text-sm text-gray-600">
			{image.properties.title}
		</figcaption>
	{/if}
</figure>
