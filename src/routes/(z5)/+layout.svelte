<script lang="ts">
	import type { Snippet } from 'svelte';
	import Zone5Provider from 'zone5/components/Zone5Provider.svelte';

	import '../app.css';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<Zone5Provider>
	{@render children()}
</Zone5Provider>

<div class="flex mt-2">
	<div
		class="grow"
		style="background: linear-gradient(to right,
			hsl(0 0% 0%) 0% 20%,
			hsl(0 0% 10%) 20% 40%,
			hsl(0 0% 20%) 40% 60%,
			hsl(0 0% 30%) 60% 80%,
			hsl(0 0% 40%) 80% 100%)"
	></div>
	<div
		class="shrink text-xs font-semibold px-2 py-1 text-neutral-600 bg-[hsl(0_0%_50%)] flex items-center justify-center min-w-[9.09%]"
	>
		built with <a href="https://zone5.wygoda.net">Zone5</a>
	</div>
	<div
		class="grow"
		style="background: linear-gradient(to right,
			hsl(0 0% 60%) 0% 20%,
			hsl(0 0% 70%) 20% 40%,
			hsl(0 0% 80%) 40% 60%,
			hsl(0 0% 90%) 60% 80%,
			hsl(0 0% 100%) 80% 100%)"
	></div>
</div>
