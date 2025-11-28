<script lang="ts">
	import type { Snippet } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';

	import { base, resolve } from '$app/paths';
	import { page } from '$app/state';

	import SiteHeader from '$components/SiteHeader.svelte';

	import '../app.css';

	interface Props {
		children?: Snippet;
	}

	let { children }: Props = $props();

	let mobileMenuOpen = $state(false);
	let expandedSections = $state<Set<string>>(
		new Set(['tutorials', 'how-to', 'reference', 'explanation']),
	);

	function toggleSection(section: string) {
		if (expandedSections.has(section)) {
			expandedSections.delete(section);
		} else {
			expandedSections.add(section);
		}
		expandedSections = new SvelteSet(expandedSections);
	}

	function isActive(path: string): boolean {
		const fullPath = base + path;
		return page.url.pathname === fullPath || page.url.pathname === fullPath + '/';
	}

	function isSectionActive(section: string): boolean {
		return page.url.pathname.includes(`${base}/docs/${section}`);
	}

	const navigation = [
		{
			id: 'tutorials',
			title: 'Tutorials',
			items: [
				{ title: 'Getting Started', href: '/docs/tutorials/getting-started' },
				{ title: 'Add to Existing Project', href: '/docs/tutorials/add-to-existing-project' },
			],
		},
		{
			id: 'how-to',
			title: 'How-to Guides',
			items: [
				{ title: 'Customize Image Variants', href: '/docs/how-to/customize-image-variants' },
				{
					title: 'Use Different Package Managers',
					href: '/docs/how-to/use-different-package-managers',
				},
				{ title: 'Configure Caching', href: '/docs/how-to/configure-caching' },
			],
		},
		{
			id: 'reference',
			title: 'Reference',
			items: [
				{ title: 'Configuration', href: '/docs/reference/configuration' },
				{ title: 'Component Props', href: '/docs/reference/component-props' },
				{ title: 'CLI Commands', href: '/docs/reference/cli-commands' },
				{ title: 'Vite Plugin API', href: '/docs/reference/vite-plugin-api' },
				{ title: 'Remark Plugin API', href: '/docs/reference/remark-plugin-api' },
				{ title: 'ItemFeature Schema', href: '/docs/reference/itemfeature-schema' },
				{ title: 'Package Exports', href: '/docs/reference/package-exports' },
				{ title: 'Keyboard Shortcuts', href: '/docs/reference/keyboard-shortcuts' },
			],
		},
		{
			id: 'explanation',
			title: 'Explanation',
			items: [
				{ title: 'Architecture Overview', href: '/docs/explanation/architecture-overview' },
				{ title: 'Image Processing Pipeline', href: '/docs/explanation/image-processing-pipeline' },
				{ title: 'Registry State Management', href: '/docs/explanation/registry-state-management' },
				{ title: 'Caching Strategy', href: '/docs/explanation/caching-strategy' },
				{ title: 'GeoJSON Format Choice', href: '/docs/explanation/geojson-format-choice' },
				{ title: 'Vite Module Resolution', href: '/docs/explanation/vite-module-resolution' },
			],
		},
	];
</script>

<svelte:head>
	{#if page.data.title}
		<title>{page.data.title} | Zone5</title>
	{:else}
		<title>Documentation | Zone5</title>
	{/if}
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600;1,700;1,800;1,900&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,500;0,8..60,600;1,8..60,400;1,8..60,500&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="min-h-screen bg-docs-bg font-body text-docs-text">
	<SiteHeader {mobileMenuOpen} onMobileMenuToggle={() => (mobileMenuOpen = !mobileMenuOpen)} />

	<div
		class="mx-auto grid min-h-[calc(100vh-73px)] max-w-[1600px] grid-cols-[280px_1fr] max-md:grid-cols-1"
	>
		<!-- Sidebar navigation -->
		<aside
			class="sticky top-[73px] h-[calc(100vh-73px)] overflow-y-auto border-r border-docs-border bg-docs-bg scrollbar-thin scrollbar-track-transparent scrollbar-thumb-docs-border hover:scrollbar-thumb-docs-muted max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-95 max-md:w-[280px] max-md:border-r max-md:border-docs-border max-md:pt-[73px] max-md:transition-transform max-md:duration-300 max-md:ease-out-expo {mobileMenuOpen
				? 'max-md:translate-x-0'
				: 'max-md:-translate-x-full'}"
		>
			<div class="py-8">
				<nav class="flex flex-col gap-2">
					{#each navigation as section (section.id)}
						<div
							class="border-b border-transparent {isSectionActive(section.id)
								? 'border-docs-border'
								: ''}"
						>
							<button
								class="flex w-full cursor-pointer items-center justify-between border-none bg-transparent px-6 py-3 text-left transition-colors duration-200 hover:bg-docs-surface"
								onclick={() => toggleSection(section.id)}
								aria-expanded={expandedSections.has(section.id)}
							>
								<div class="flex flex-col gap-0.5">
									<span
										class="font-display text-sm font-semibold -tracking-[0.01em] text-docs-text"
									>
										{section.title}
									</span>
								</div>
								<svg
									class="shrink-0 text-docs-muted transition-transform duration-200 {expandedSections.has(
										section.id,
									)
										? 'rotate-180'
										: ''}"
									width="16"
									height="16"
									viewBox="0 0 16 16"
									fill="none"
								>
									<path
										d="M4 6l4 4 4-4"
										stroke="currentColor"
										stroke-width="1.5"
										stroke-linecap="round"
									/>
								</svg>
							</button>

							{#if expandedSections.has(section.id)}
								<ul class="m-0 list-none pb-3">
									{#each section.items as item (item.href)}
										<li>
											<a
												href={resolve(item.href as '/docs')}
												class="block border-l-2 border-transparent px-6 py-2 pl-8 text-[0.85rem] text-docs-muted no-underline transition-all duration-150 hover:bg-docs-surface hover:text-docs-text {isActive(
													item.href,
												)
													? 'border-docs-accent bg-docs-surface font-medium text-docs-accent'
													: ''}"
												onclick={() => (mobileMenuOpen = false)}
											>
												{item.title}
											</a>
										</li>
									{/each}
								</ul>
							{/if}
						</div>
					{/each}
				</nav>
			</div>
		</aside>

		<!-- Main content area -->
		<main class="bg-docs-bg px-16 py-12 max-lg:px-8 max-md:px-6">
			<article class="prose-docs mx-auto max-w-[800px]">
				{@render children?.()}
			</article>
		</main>
	</div>
</div>

<!-- Mobile overlay -->
{#if mobileMenuOpen}
	<button
		class="fixed inset-0 z-90 cursor-pointer border-none bg-black/30 md:hidden"
		onclick={() => (mobileMenuOpen = false)}
		aria-label="Close navigation"
	></button>
{/if}

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

	/* Prose styles for documentation content */
	.prose-docs :global(h1) {
		font-family: var(--font-display);
		font-size: 2.5rem;
		font-weight: 700;
		letter-spacing: -0.03em;
		line-height: 1.1;
		margin: 0 0 1.5rem;
		color: var(--color-docs-text);
	}

	.prose-docs :global(h2) {
		font-family: var(--font-display);
		font-size: 1.75rem;
		font-weight: 600;
		letter-spacing: -0.02em;
		line-height: 1.2;
		margin: 3rem 0 1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--color-docs-border);
		color: var(--color-docs-text);
	}

	.prose-docs :global(h3) {
		font-family: var(--font-display);
		font-size: 1.25rem;
		font-weight: 600;
		letter-spacing: -0.01em;
		line-height: 1.3;
		margin: 2rem 0 0.75rem;
		color: var(--color-docs-text);
	}

	.prose-docs :global(h4) {
		font-family: var(--font-body);
		font-size: 1rem;
		font-weight: 600;
		line-height: 1.4;
		margin: 1.5rem 0 0.5rem;
		color: var(--color-docs-text);
	}

	.prose-docs :global(p) {
		font-size: 1rem;
		line-height: 1.7;
		margin: 0 0 1.25rem;
		color: var(--color-docs-text);
	}

	.prose-docs :global(ul),
	.prose-docs :global(ol) {
		margin: 0 0 1.25rem;
		padding-left: 1.5rem;
		@apply list-disc;
	}

	.prose-docs :global(li) {
		font-size: 1rem;
		line-height: 1.7;
		margin-bottom: 0.5rem;
	}

	.prose-docs :global(a) {
		color: var(--color-docs-accent);
		text-decoration: underline;
		text-decoration-thickness: 1px;
		text-underline-offset: 2px;
		transition: color 0.15s ease;
	}

	.prose-docs :global(a:hover) {
		color: var(--color-docs-accent-hover);
	}

	.prose-docs :global(code) {
		font-family: var(--font-mono);
		font-size: 0.875em;
		background: var(--color-docs-surface);
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		color: var(--color-docs-accent);
	}

	.prose-docs :global(pre) {
		font-family: var(--font-mono);
		font-size: 0.875rem;
		line-height: 1.6;
		background: var(--color-docs-surface);
		border: 1px solid var(--color-docs-border);
		border-radius: 0.5rem;
		padding: 1.25rem 1.5rem;
		margin: 0 0 1.5rem;
		overflow-x: auto;
	}

	.prose-docs :global(pre code) {
		background: none;
		padding: 0;
		color: var(--color-docs-text);
	}

	.prose-docs :global(blockquote) {
		margin: 0 0 1.5rem;
		padding: 1rem 1.5rem;
		border-left: 3px solid var(--color-docs-accent);
		background: var(--color-docs-surface);
		font-style: italic;
	}

	.prose-docs :global(blockquote p:last-child) {
		margin-bottom: 0;
	}

	.prose-docs :global(table) {
		width: 100%;
		border-collapse: collapse;
		margin: 0 0 1.5rem;
		font-size: 0.9rem;
	}

	.prose-docs :global(th),
	.prose-docs :global(td) {
		padding: 0.75rem 1rem;
		border: 1px solid var(--color-docs-border);
		text-align: left;
	}

	.prose-docs :global(th) {
		background: var(--color-docs-surface);
		font-weight: 600;
	}

	.prose-docs :global(hr) {
		border: none;
		border-top: 1px solid var(--color-docs-border);
		margin: 2rem 0;
	}

	/* Responsive prose adjustments */
	@media (max-width: 768px) {
		.prose-docs :global(h1) {
			font-size: 2rem;
		}

		.prose-docs :global(h2) {
			font-size: 1.5rem;
		}

		.prose-docs :global(pre) {
			padding: 1rem;
			font-size: 0.8rem;
		}
	}
</style>
