<script lang="ts">
	import type { Snippet } from 'svelte';

	import SiteHeader from './SiteHeader.svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600;1,700;1,800;1,900&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,500;0,8..60,600;1,8..60,400;1,8..60,500&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="min-h-screen bg-docs-bg font-body text-docs-text relative z-10">
	<SiteHeader />

	<main class="bg-docs-bg">
		{@render children()}
	</main>
</div>

<style lang="postcss">
	@import 'tailwindcss';

	@theme {
		--font-display: 'Playfair Display', serif;
		--font-body: 'Source Serif 4', serif;
		--font-serif: 'Instrument Serif', serif;
		--font-mono: 'JetBrains Mono', monospace;

		/* Zone System palette - matching landing page */
		--color-docs-bg: #faf8f5;
		--color-docs-surface: #f0ece6;
		--color-docs-elevated: #e6e0d8;
		--color-docs-border: #d4cdc3;
		--color-docs-text: #1a1a1a;
		--color-docs-muted: #6b6560;
		--color-docs-accent: #2d2926;
		--color-docs-accent-hover: #4a4541;

		--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
	}
</style>
