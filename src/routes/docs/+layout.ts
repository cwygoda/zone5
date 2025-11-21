import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ route }) => {
	// Try to dynamically import the page module to get metadata
	if (route.id && route.id !== '/docs') {
		try {
			// Convert route ID to module path
			const modulePath = route.id.replace('/docs', '.');
			const modules = import.meta.glob('./**/*.md');
			const moduleKey = `${modulePath}/+page.md`;

			if (modules[moduleKey]) {
				const module = await modules[moduleKey]() as { metadata?: { title?: string } };
				return {
					title: module.metadata?.title,
				};
			}
		} catch {
			// Silently fail if module not found
		}
	}

	return {
		title: undefined,
	};
};
