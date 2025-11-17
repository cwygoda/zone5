// Augment mdast types
import type { SvelteComponent } from 'svast';

declare module 'mdast' {
	interface RootContentMap {
		raw: {
			type: 'raw';
			value: string;
		};
		svelteComponent: SvelteComponent;
	}
}

declare module '*?z5' {
	import type { ItemFeature } from './processor';

	const data: ItemFeature;
	export default data;
}
