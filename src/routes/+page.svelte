<script>
	import { onMount } from 'svelte';
	import Zone5 from 'zone5/components/Zone5.svelte';

	import { resolve } from '$app/paths';

	import lighttable from './docs/lighttable.jpg?z5';
	import screenshot from './docs/zone5.jpg?z5';

	let mounted = $state(false);

	onMount(() => {
		mounted = true;
	});
</script>

<svelte:head>
	<title>Zone5</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="min-h-screen overflow-x-hidden bg-landing-bg font-display text-landing-text">
	<section
		class="relative grid min-h-screen grid-cols-1 items-center gap-16 px-8 py-16 lg:grid-cols-2 lg:px-16 lg:py-24"
	>
		<div class="max-w-none lg:max-w-[600px]">
			<h1 class="mb-8 text-[clamp(4rem,10vw,8rem)] font-extrabold leading-[0.9] -tracking-[0.03em]">
				<span
					class="block opacity-0 translate-y-10 transition-all duration-800 ease-out-expo {mounted
						? 'opacity-100 translate-y-0 delay-200'
						: ''}">Static</span
				>
				<span
					class="block text-landing-accent opacity-0 translate-y-10 transition-all duration-800 ease-out-expo {mounted
						? 'opacity-100 translate-y-0 delay-400'
						: ''}">Photo</span
				>
				<span
					class="block opacity-0 translate-y-10 transition-all duration-800 ease-out-expo {mounted
						? 'opacity-100 translate-y-0 delay-600'
						: ''}">Galleries</span
				>
			</h1>
			<p
				class="mb-10 max-w-none text-xl leading-relaxed text-landing-muted opacity-0 translate-y-5 transition-all duration-800 ease-out-expo lg:max-w-[480px] {mounted
					? 'opacity-100 translate-y-0 delay-800'
					: ''}"
			>
				Turn your photos into fast, beautiful static websites with a single command. No database. No
				backend. Just images that load instantly.
			</p>
			<div
				class="inline-flex w-full flex-col items-center gap-4 rounded-lg border border-landing-border bg-landing-surface p-4 font-mono text-sm opacity-0 translate-y-5 transition-all duration-800 ease-out-expo sm:w-auto sm:flex-row sm:px-6 {mounted
					? 'opacity-100 translate-y-0 delay-1000'
					: ''}"
			>
				<code class="text-landing-accent">npx zone5 create ./photos ./gallery</code>
				<button
					class="w-full cursor-pointer rounded border border-landing-border bg-landing-elevated px-4 py-2 font-display text-xs font-semibold uppercase tracking-wider text-landing-muted transition-all duration-200 hover:border-landing-accent hover:bg-landing-accent hover:text-landing-bg sm:w-auto"
					onclick={() => navigator.clipboard.writeText('npx zone5 create ./photos ./gallery')}
				>
					Copy
				</button>
			</div>
		</div>
		<div
			class="order-first flex items-center justify-center opacity-0 translate-x-10 transition-all duration-1000 ease-out-expo lg:order-0 {mounted
				? 'opacity-100 translate-x-0 delay-300'
				: ''}"
		>
			<div
				class="overflow-hidden rounded-2xl border-2 border-dashed border-landing-border bg-landing-surface text-base font-medium text-landing-muted"
			>
				<a
					href={resolve('/color')}
					class="flex aspect-4/3 w-full max-w-[500px] items-center justify-center"
				>
					<Zone5 images={[{ ...screenshot, properties: { ...screenshot.properties, alt: 'Zone5 gallery screenshot' } }]} />
				</a>
			</div>
		</div>
		<div
			class="absolute bottom-12 left-1/2 flex duration-1000 transition-opacity -translate-x-1/2 flex-col items-center gap-2 text-xs uppercase tracking-[0.2em] text-landing-muted {mounted
				? 'animate-bounce opacity-100'
				: 'opacity-0'}"
		>
			<span>Scroll</span>
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
				<path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" stroke-width="2" />
			</svg>
		</div>
	</section>

	<!-- Features Grid -->
	<section class="bg-landing-surface px-8 py-16 lg:px-16 lg:py-32">
		<div class="mb-16 flex items-baseline gap-6">
			<span class="font-mono text-sm text-landing-accent">01</span>
			<h2 class="m-0 text-[clamp(2.5rem,5vw,4rem)] font-bold -tracking-[0.02em]">Why Zone5?</h2>
		</div>

		<div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
			<div
				class="col-span-1 grid grid-cols-1 items-start gap-8 rounded-2xl border border-landing-border bg-landing-bg p-10 transition-all duration-300 ease-out-expo hover:-translate-y-1 hover:border-landing-accent lg:col-span-2 lg:grid-cols-[auto_1fr]"
			>
				<div class="row-span-1 mb-0 text-landing-accent lg:row-span-2">
					<svg width="48" height="48" viewBox="0 0 48 48" fill="none">
						<circle cx="24" cy="24" r="20" stroke="currentColor" stroke-width="2" />
						<path d="M16 24l6 6 10-10" stroke="currentColor" stroke-width="2" />
					</svg>
				</div>
				<h3 class="col-span-1 m-0 mb-4 text-2xl font-bold lg:col-start-2">Zero Runtime</h3>
				<p class="col-span-1 m-0 leading-relaxed text-landing-muted lg:col-start-2">
					Pure static HTML, CSS, and optimized images. Host anywhere—GitHub Pages, Netlify, Vercel,
					S3, or your own server. No database, no backend, no CDN configuration.
				</p>
			</div>

			<div
				class="rounded-2xl border border-landing-border bg-landing-bg p-10 transition-all duration-300 ease-out-expo hover:-translate-y-1 hover:border-landing-accent"
			>
				<div class="mb-6 text-landing-accent">
					<svg width="48" height="48" viewBox="0 0 48 48" fill="none">
						<rect
							x="8"
							y="8"
							width="32"
							height="32"
							rx="4"
							stroke="currentColor"
							stroke-width="2"
						/>
						<path d="M8 28l10-10 8 8 14-14" stroke="currentColor" stroke-width="2" />
					</svg>
				</div>
				<h3 class="m-0 mb-4 text-2xl font-bold">Build-time Processing</h3>
				<p class="m-0 leading-relaxed text-landing-muted">
					Sharp-based pipeline generates responsive variants, extracts colors, creates blurhash
					previews. Cached for instant rebuilds.
				</p>
			</div>

			<div
				class="rounded-2xl border border-landing-border bg-landing-bg p-10 transition-all duration-300 ease-out-expo hover:-translate-y-1 hover:border-landing-accent"
			>
				<div class="mb-6 text-landing-accent">
					<svg width="48" height="48" viewBox="0 0 48 48" fill="none">
						<path d="M8 12h32M8 24h24M8 36h28" stroke="currentColor" stroke-width="2" />
					</svg>
				</div>
				<h3 class="m-0 mb-4 text-2xl font-bold">Markdown-first</h3>
				<p class="m-0 leading-relaxed text-landing-muted">
					Write galleries in MDX or plain markdown. The <code
						class="rounded bg-landing-accent/10 px-1.5 py-0.5 font-mono text-[0.875em] text-landing-accent"
						>?z5</code
					> suffix triggers automatic processing and lightbox support.
				</p>
			</div>

			<div
				class="rounded-2xl border border-landing-border bg-landing-bg p-10 transition-all duration-300 ease-out-expo hover:-translate-y-1 hover:border-landing-accent"
			>
				<div class="mb-6 text-landing-accent">
					<svg width="48" height="48" viewBox="0 0 48 48" fill="none">
						<path d="M24 8v32M8 24h32" stroke="currentColor" stroke-width="2" />
						<circle cx="24" cy="24" r="8" stroke="currentColor" stroke-width="2" />
					</svg>
				</div>
				<h3 class="m-0 mb-4 text-2xl font-bold">Vite Integration</h3>
				<p class="m-0 leading-relaxed text-landing-muted">
					Import images directly in Svelte with full TypeScript support. Get variants, blurhash,
					EXIF, colors, and GPS coords.
				</p>
			</div>

			<div
				class="rounded-2xl border border-landing-border bg-landing-bg p-10 transition-all duration-300 ease-out-expo hover:-translate-y-1 hover:border-landing-accent"
			>
				<div class="mb-6 text-landing-accent">
					<svg width="48" height="48" viewBox="0 0 48 48" fill="none">
						<rect
							x="10"
							y="16"
							width="12"
							height="20"
							rx="2"
							stroke="currentColor"
							stroke-width="2"
						/>
						<rect
							x="26"
							y="8"
							width="16"
							height="28"
							rx="2"
							stroke="currentColor"
							stroke-width="2"
						/>
						<path d="M13 20h6M29 12h10" stroke="currentColor" stroke-width="2" />
					</svg>
				</div>
				<h3 class="m-0 mb-4 text-2xl font-bold">Responsive & Mobile-first</h3>
				<p class="m-0 leading-relaxed text-landing-muted">
					Galleries adapt seamlessly from phone to desktop. Touch-friendly navigation, optimized
					image loading, and fluid layouts that look great everywhere.
				</p>
			</div>
		</div>
	</section>

	<!-- Code Demo Section -->
	<section class="px-8 py-16 lg:px-16 lg:py-32">
		<div class="mb-16 flex items-baseline gap-6">
			<span class="font-mono text-sm text-landing-accent">02</span>
			<h2 class="m-0 text-[clamp(2.5rem,5vw,4rem)] font-bold -tracking-[0.02em]">How It Works</h2>
		</div>

		<div class="grid grid-cols-1 gap-12 lg:grid-cols-2">
			<div class="relative">
				<span
					class="absolute -left-4 -top-4 flex h-10 w-10 items-center justify-center rounded-full bg-landing-accent text-base font-bold text-landing-bg"
					>1</span
				>
				<h3 class="m-0 mb-6 pl-8 text-xl font-semibold">Write Markdown</h3>
				<div class="overflow-x-auto rounded-xl border border-landing-border bg-landing-surface p-6">
					<pre class="m-0"><code
							class="font-mono text-sm leading-relaxed text-landing-text whitespace-pre"
							>'![Mountain sunrise](./mountains.jpg?z5)\n![Valley at dusk](./valley.jpg?z5)'</code
						></pre>
				</div>
			</div>

			<div class="relative">
				<span
					class="absolute -left-4 -top-4 flex h-10 w-10 items-center justify-center rounded-full bg-landing-accent text-base font-bold text-landing-bg"
					>2</span
				>
				<h3 class="m-0 mb-6 pl-8 text-xl font-semibold">Or Import Directly</h3>
				<div class="overflow-x-auto rounded-xl border border-landing-border bg-landing-surface p-6">
					<pre class="m-0"><code
							class="font-mono text-sm leading-relaxed text-landing-text whitespace-pre"
							>"import photo from './photo.jpg?z5';\n\n// Returns:\n// - Responsive variants (400-2400px)\n// - Blurhash placeholder\n// - EXIF metadata\n// - Dominant color\n// - GPS coordinates"</code
						></pre>
				</div>
			</div>

			<div class="relative col-span-1 lg:col-span-2">
				<span
					class="absolute -left-4 -top-4 flex h-10 w-10 items-center justify-center rounded-full bg-landing-accent text-base font-bold text-landing-bg"
					>3</span
				>
				<h3 class="m-0 mb-6 pl-8 text-xl font-semibold">Get a Gallery</h3>
				<div class="flex justify-center">
					<div
						class="overflow-hidden rounded-2xl border-2 border-dashed border-landing-border bg-landing-surface text-base font-medium text-landing-muted"
					>
						<a
							href="{resolve('/color')}?z5=7535ba57c64ddb85"
							class="flex aspect-4/3 w-full max-w-[500px] items-center justify-center"
						>
							<Zone5 images={[{ ...lighttable, properties: { ...lighttable.properties, alt: 'Photo lighttable view' } }]} />
						</a>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Tech Specs -->
	<section class="bg-landing-surface px-8 py-16 lg:px-16 lg:py-32">
		<div class="mb-16 flex items-baseline gap-6">
			<span class="font-mono text-sm text-landing-accent">03</span>
			<h2 class="m-0 text-[clamp(2.5rem,5vw,4rem)] font-bold -tracking-[0.02em]">
				Technical Details
			</h2>
		</div>

		<div
			class="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-landing-border bg-landing-border sm:grid-cols-2 lg:grid-cols-3"
		>
			<div class="flex flex-col gap-3 bg-landing-bg p-8">
				<span class="text-xs font-semibold uppercase tracking-widest text-landing-accent"
					>Caching</span
				>
				<span class="text-base text-landing-muted"
					>Content-addressed in <code class="font-mono text-[0.875em] text-landing-text"
						>.zone5/</code
					></span
				>
			</div>
			<div class="flex flex-col gap-3 bg-landing-bg p-8">
				<span class="text-xs font-semibold uppercase tracking-widest text-landing-accent"
					>Output</span
				>
				<span class="text-base text-landing-muted">GeoJSON-compatible features</span>
			</div>
			<div class="flex flex-col gap-3 bg-landing-bg p-8">
				<span class="text-xs font-semibold uppercase tracking-widest text-landing-accent"
					>Variants</span
				>
				<span class="text-base text-landing-muted">Optimized JPEG scaled in linear light</span>
			</div>
			<div class="flex flex-col gap-3 bg-landing-bg p-8">
				<span class="text-xs font-semibold uppercase tracking-widest text-landing-accent"
					>Blurhash</span
				>
				<span class="text-base text-landing-muted"
					>low-res placeholders when the internet is slow</span
				>
			</div>
			<div class="flex flex-col gap-3 bg-landing-bg p-8">
				<span class="text-xs font-semibold uppercase tracking-widest text-landing-accent">EXIF</span
				>
				<span class="text-base text-landing-muted">Camera, lens, exposure + GPS, customisable</span>
			</div>
			<div class="flex flex-col gap-3 bg-landing-bg p-8">
				<span class="text-xs font-semibold uppercase tracking-widest text-landing-accent"
					>Stack</span
				>
				<span class="text-base text-landing-muted">SvelteKit 2 + Svelte 5 + Tailwind 4</span>
			</div>
		</div>
	</section>

	<!-- CTA Section -->
	<section class="px-8 py-16 text-center lg:px-16 lg:py-32">
		<div class="mx-auto max-w-[700px]">
			<h2
				class="m-0 mb-4 text-[clamp(2.5rem,6vw,4.5rem)] font-bold leading-tight -tracking-[0.02em]"
			>
				Your photos deserve<br />
				<em class="font-serif italic text-landing-accent">better than a plugin.</em>
			</h2>
			<p class="m-0 mb-16 text-2xl text-landing-muted">Ship them as static sites.</p>

			<div class="mb-16 flex flex-col flex-wrap items-center justify-center gap-8 lg:flex-row">
				<div class="text-left">
					<span
						class="mb-3 block text-xs font-semibold uppercase tracking-widest text-landing-muted"
						>Create new gallery</span
					>
					<div class="rounded-xl border border-landing-border bg-landing-surface px-6 py-4">
						<code class="font-mono text-sm text-landing-accent"
							>npx zone5 create ./photos ./gallery</code
						>
					</div>
				</div>
				<div class="self-end pb-5 text-sm text-landing-muted">or</div>
				<div class="text-left">
					<span
						class="mb-3 block text-xs font-semibold uppercase tracking-widest text-landing-muted"
						>Add to existing project</span
					>
					<div class="rounded-xl border border-landing-border bg-landing-surface px-6 py-4">
						<code class="font-mono text-sm text-landing-accent">npm install zone5</code>
					</div>
				</div>
			</div>

			<div class="flex flex-wrap justify-center gap-4">
				<a
					href="https://github.com/cwygoda/zone5"
					class="inline-flex items-center gap-3 rounded-lg bg-landing-accent px-8 py-4 text-base font-semibold text-landing-bg no-underline transition-all duration-200 ease-out-expo hover:-translate-y-0.5 hover:bg-[#ff8555]"
				>
					<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
						<path
							d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
						/>
					</svg>
					View on GitHub
				</a>
				<a
					href={resolve('/docs')}
					class="inline-flex items-center gap-3 rounded-lg border-2 border-landing-border bg-transparent px-8 py-4 text-base font-semibold text-landing-text no-underline transition-all duration-200 ease-out-expo hover:-translate-y-0.5 hover:border-landing-accent hover:text-landing-accent"
				>
					Documentation
				</a>
			</div>
		</div>
	</section>

	<!-- Footer -->
	<footer class="border-t border-landing-border px-8 py-12 lg:px-16">
		<div
			class="flex flex-col items-center justify-between gap-4 text-center lg:flex-row lg:text-left"
		>
			<span class="text-xl font-bold -tracking-[0.02em]">Zone5</span>
			<span class="text-sm text-landing-muted">MIT License · Made for photographers.</span>
		</div>
	</footer>
</div>

<style lang="postcss">
	@import 'tailwindcss';

	@theme {
		--font-display: 'Playfair Display', serif;
		--font-serif: 'Instrument Serif', serif;
		--font-mono: 'JetBrains Mono', monospace;

		/* Ansel Adams Zone System inspired palette
		   Zone 0: Pure black - Zone X: Pure white
		   Using warm paper tones reminiscent of fiber prints */
		--color-landing-bg: #faf8f5; /* Zone IX - near white, warm paper */
		--color-landing-surface: #f0ece6; /* Zone VIII - textured white */
		--color-landing-elevated: #e6e0d8; /* Zone VII - light gray */
		--color-landing-border: #d4cdc3; /* Zone VI - middle gray light */
		--color-landing-text: #1a1a1a; /* Zone I - near black */
		--color-landing-muted: #6b6560; /* Zone IV - dark middle gray */
		--color-landing-accent: #2d2926; /* Zone II - rich black, selenium tone */

		--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
	}
</style>
