<script lang="ts" module>
	import { getContext, setContext } from 'svelte';

	const key = Symbol('Zone5 provider');
	export const useImageRegistry = () => getContext<Registry>(key);
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import { queryParameters } from 'sveltekit-search-params';

	import { beforeNavigate } from '$app/navigation';

	import { type Registry, registry } from '../stores';
	import Zone5Lightbox from './Zone5Lightbox.svelte';

	let { children }: { children: Snippet } = $props();

	setContext<Registry>(key, registry);

	// URL state store
	const params = queryParameters({
		z5: true,
	});
	let optimisticForce = $state($params.z5 !== null);

	// clear registry when navigating away
	beforeNavigate((navigation) => {
		if (navigation.from?.route.id == navigation.to?.route.id) return;
		registry.clear();
	});

	// update URL state, once Svelte's router has settled
	let routerSettled = false;
	$effect(function updateZ5UrlState() {
		const current = $registry.current?.id ?? null;
		if (routerSettled || current) {
			routerSettled = true;
			if (current !== $params.z5) {
				$params.z5 = current;
			}
		}
	});

	// update from URL state
	$effect(function updateZ5fromUrl() {
		const z5 = $params.z5;
		const current = $registry.current?.id ?? null;
		if (z5 && z5 !== current) {
			if (!registry.findCurrent(z5)) {
				optimisticForce = false;
				$params.z5 = null;
			}
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
