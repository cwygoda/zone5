<script lang="ts">
	import type { Snippet } from 'svelte';
	import Zone5Provider from 'zone5/components/Zone5Provider.svelte';

	import SiteLayout from '$components/SiteLayout.svelte';

	import '../app.css';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<SiteLayout>
	<Zone5Provider>
		{@render children()}
	</Zone5Provider>
</SiteLayout>
