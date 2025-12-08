<script lang="ts">
	import { Info } from '@lucide/svelte';

	import Button from './Button.svelte';

	interface Props {
		class?: string | string[];
		oninfo: () => void;
		tabindex?: number;
		[key: string]: unknown;
	}

	let { class: class_, oninfo, tabindex = 0, ...rest }: Props = $props();
</script>

<Button class={class_} onaction={oninfo} {tabindex} aria-label="image info" {...rest}>
	<Info />
</Button>
