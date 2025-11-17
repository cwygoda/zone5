<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		'aria-label'?: string;
		children: Snippet;
		disabled?: boolean;
		class?: string | string[];
		onaction: () => void;
		tabindex?: number;
		[key: string]: unknown;
	}

	let {
		'aria-label': aria_label,
		children,
		class: class_,
		disabled = false,
		onaction,
		tabindex = 0,
		...rest
	}: Props = $props();
</script>

<button
	class={class_}
	{disabled}
	onclick={onaction}
	onkeydown={(evt) => {
		if (evt.key == ' ' || evt.key == 'Enter') {
			evt.preventDefault();
			onaction();
		}
	}}
	{tabindex}
	aria-label={aria_label}
	{...rest}
>
	{@render children()}
</button>
