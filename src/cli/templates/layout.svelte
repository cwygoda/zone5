<script lang="ts">
	import { Zone5Provider, type MapUrlBuilder } from 'zone5/components';
	import { PUBLIC_ZONE5_MAP_URL_TEMPLATE } from '$env/static/public';

	import '../app.css';

	const { children } = $props();

	const mapUrl: MapUrlBuilder | undefined = PUBLIC_ZONE5_MAP_URL_TEMPLATE
		? (lat, lon) =>
				PUBLIC_ZONE5_MAP_URL_TEMPLATE.replace('{lat}', String(lat)).replace(
					'{lon}',
					String(lon),
				)
		: undefined;
</script>

<Zone5Provider {mapUrl}>
	<div class="min-h-screen bg-gray-50">
		<main class="container mx-auto px-4 py-8">
			{@render children()}
		</main>
	</div>
</Zone5Provider>
