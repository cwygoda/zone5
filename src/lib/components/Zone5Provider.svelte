<script lang="ts" module>
	import { getContext, setContext } from 'svelte';

	const key = 'Zone5 provider';
	export const useImageRegistry = () => getContext<Registry>(key);
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import { untrack } from 'svelte';

	import { browser } from '$app/environment';
	import { beforeNavigate, goto } from '$app/navigation';
	import { page } from '$app/state';

	import { type Registry, registry } from '../stores';
	import Zone5Lightbox from './Zone5Lightbox.svelte';

	let { children }: { children: Snippet } = $props();

	setContext<Registry>(key, registry);

	const getZ5FromUrl = () => (browser ? page.url.searchParams.get('z5') : null);
	const setZ5InUrl = (value: string | null) => {
		if (!browser) return;
		const url = new URL(page.url);
		if (value) {
			url.searchParams.set('z5', value);
		} else {
			url.searchParams.delete('z5');
		}

		// eslint-disable-next-line svelte/no-navigation-without-resolve -- staying on same page, just updating query params
		goto(`${url.pathname}${url.search}`, { replaceState: true, noScroll: true, keepFocus: true });
	};

	let optimisticForce = $state(getZ5FromUrl() !== null);

	// Single state machine for bidirectional URL-registry sync
	// Prevents race conditions by using one source of truth instead of two boolean flags
	type SyncState = 'idle' | 'url-to-registry' | 'registry-to-url';
	let syncState: SyncState = 'idle';
	let initialSyncComplete = false;

	beforeNavigate((navigation) => {
		if (navigation.from?.route.id === navigation.to?.route.id) return;
		registry.clear();
	});

	// registry → URL
	$effect(() => {
		const current = $registry.current;
		const images = $registry.images;

		// Skip if URL is currently updating the registry
		if (syncState === 'url-to-registry') return;

		const currentZ5 = untrack(() => getZ5FromUrl());
		const newZ5 = current?.id ?? null;

		if (currentZ5 !== newZ5) {
			// Don't clear the URL z5 param during initial load (waiting for all images to register)
			if (newZ5 === null && currentZ5 !== null && !initialSyncComplete) {
				const urlImageExists = images.some((img) => img.id === currentZ5);
				if (urlImageExists) {
					// Don't clear URL yet, let URL→registry sync handle it
					return;
				}
			}

			syncState = 'registry-to-url';
			setZ5InUrl(newZ5);
			queueMicrotask(() => {
				syncState = 'idle';
			});
		}
	});

	// URL → registry
	$effect(() => {
		const z5 = getZ5FromUrl();
		const images = $registry.images;

		// Skip if registry is currently updating URL, or no images yet
		if (syncState === 'registry-to-url' || images.length === 0) return;

		if (z5) {
			syncState = 'url-to-registry';
			const found = registry.findCurrent(z5);
			if (found) {
				optimisticForce = false;
			}
			initialSyncComplete = true;
			queueMicrotask(() => {
				syncState = 'idle';
			});
		} else {
			const currentId = untrack(() => $registry.current?.id);
			if (currentId) {
				syncState = 'url-to-registry';
				registry.clearCurrent();
				queueMicrotask(() => {
					syncState = 'idle';
				});
			}
			initialSyncComplete = true;
		}
	});
</script>

<Zone5Lightbox
	force={optimisticForce}
	image={$registry.current ?? undefined}
	onclose={() => {
		optimisticForce = false;
		registry.clearCurrent();
	}}
	onprevious={registry.prev}
	onnext={registry.next}
/>
{@render children()}
