<script lang="ts">
	import { Zone5Provider } from 'zone5/components';

	import '../app.css';

	const { children } = $props();
</script>

<Zone5Provider>
	<div class="min-h-screen bg-gray-50">
		<main class="container mx-auto px-4 py-8">
			{@render children()}
		</main>
	</div>
</Zone5Provider>
