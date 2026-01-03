/**
 * URL synchronization adapter for Zone5 lightbox state.
 *
 * This adapter handles bidirectional sync between the image registry
 * and the URL query parameter (?z5=imageId). Extracted as infrastructure
 * concern, separate from core component logic.
 *
 * Usage in Zone5Provider:
 * ```svelte
 * onMount(() => {
 *   if (syncWithUrl) {
 *     return createUrlSync(registry, { goto, page });
 *   }
 * });
 * ```
 */

import type { Registry } from '../stores/registry.svelte.js';

/**
 * Dependencies injected from SvelteKit.
 */
export interface UrlSyncDependencies {
	/** SvelteKit goto function */
	goto: (url: string, opts?: { replaceState?: boolean; noScroll?: boolean; keepFocus?: boolean }) => Promise<void>;
	/** SvelteKit page state (reactive) */
	getUrl: () => URL;
	/** Whether we're in browser environment */
	isBrowser: boolean;
}

/**
 * State machine for bidirectional sync.
 * Prevents infinite loops by tracking sync direction.
 */
type SyncState = 'idle' | 'url-to-registry' | 'registry-to-url';

/**
 * Create URL sync adapter for the registry.
 *
 * @param registry - The image registry to sync
 * @param deps - SvelteKit dependencies
 * @returns Object with sync functions and cleanup
 */
export function createUrlSync(registry: Registry, deps: UrlSyncDependencies) {
	const { goto, getUrl, isBrowser } = deps;

	let syncState: SyncState = 'idle';
	let initialSyncComplete = false;

	/**
	 * Get current z5 parameter from URL.
	 */
	function getZ5FromUrl(): string | null {
		if (!isBrowser) return null;
		return getUrl().searchParams.get('z5');
	}

	/**
	 * Update URL with new z5 parameter.
	 */
	function setZ5InUrl(value: string | null): void {
		if (!isBrowser) return;

		const url = new URL(getUrl());
		if (value) {
			url.searchParams.set('z5', value);
		} else {
			url.searchParams.delete('z5');
		}

		goto(`${url.pathname}${url.search}`, {
			replaceState: true,
			noScroll: true,
			keepFocus: true,
		});
	}

	/**
	 * Check if URL has z5 parameter on initial load.
	 */
	function hasInitialZ5(): boolean {
		return getZ5FromUrl() !== null;
	}

	/**
	 * Sync registry state to URL.
	 * Call this when registry.current changes.
	 *
	 * @param currentId - Current image ID from registry (or null)
	 * @param imageIds - All registered image IDs
	 */
	function syncRegistryToUrl(currentId: string | null, imageIds: string[]): void {
		if (syncState === 'url-to-registry') return;

		const urlZ5 = getZ5FromUrl();

		if (urlZ5 !== currentId) {
			// Don't clear URL during initial load if image exists
			if (currentId === null && urlZ5 !== null && !initialSyncComplete) {
				if (imageIds.includes(urlZ5)) {
					return; // Let URL→registry sync handle it
				}
			}

			syncState = 'registry-to-url';
			setZ5InUrl(currentId);
			queueMicrotask(() => {
				syncState = 'idle';
			});
		}
	}

	/**
	 * Sync URL state to registry.
	 * Call this when URL changes or images are registered.
	 *
	 * @param imageCount - Number of registered images
	 * @param findAndSetCurrent - Function to find and set current image by ID
	 * @param clearCurrent - Function to clear current image
	 * @param getCurrentId - Function to get current image ID
	 * @returns Whether an image was found and set
	 */
	function syncUrlToRegistry(
		imageCount: number,
		findAndSetCurrent: (id: string) => boolean,
		clearCurrent: () => void,
		getCurrentId: () => string | null,
	): { found: boolean } {
		if (syncState === 'registry-to-url' || imageCount === 0) {
			return { found: false };
		}

		const z5 = getZ5FromUrl();

		if (z5) {
			syncState = 'url-to-registry';
			const found = findAndSetCurrent(z5);
			initialSyncComplete = true;
			queueMicrotask(() => {
				syncState = 'idle';
			});
			return { found };
		} else {
			const currentId = getCurrentId();
			if (currentId) {
				syncState = 'url-to-registry';
				clearCurrent();
				queueMicrotask(() => {
					syncState = 'idle';
				});
			}
			initialSyncComplete = true;
			return { found: false };
		}
	}

	return {
		hasInitialZ5,
		syncRegistryToUrl,
		syncUrlToRegistry,
		getZ5FromUrl,
	};
}
