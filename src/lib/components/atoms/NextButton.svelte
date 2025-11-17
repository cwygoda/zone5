<script lang="ts">
	import { ChevronRight } from '@lucide/svelte';

	import Button from './Button.svelte';

	interface Props {
		class?: string | string[];
		disabled?: boolean;
		onnext: () => void;
		tabindex?: number;
		[key: string]: unknown;
	}

	let { class: class_, disabled, onnext, tabindex = 0, ...rest }: Props = $props();
</script>

<Button class={class_} {disabled} onaction={onnext} {tabindex} aria-label="next" {...rest}>
	<ChevronRight />
</Button>
