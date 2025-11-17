<script lang="ts">
	import { ChevronLeft } from '@lucide/svelte';

	import Button from './Button.svelte';

	interface Props {
		class?: string | string[];
		disabled?: boolean;
		onprevious: () => void;
		tabindex?: number;
		[key: string]: unknown;
	}

	let { class: class_, disabled, onprevious, tabindex = 0, ...rest }: Props = $props();
</script>

<Button class={class_} {disabled} onaction={onprevious} {tabindex} aria-label="previous" {...rest}>
	<ChevronLeft />
</Button>
