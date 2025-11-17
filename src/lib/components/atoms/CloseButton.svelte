<script lang="ts">
	import { X } from '@lucide/svelte';

	import Button from './Button.svelte';

	interface Props {
		class?: string | string[];
		onclose: () => void;
		tabindex?: number;
		[key: string]: unknown;
	}

	let { class: class_, onclose, tabindex = 0, ...rest }: Props = $props();
</script>

<Button class={class_} onaction={onclose} {tabindex} aria-label="close" {...rest}>
	<X />
</Button>
