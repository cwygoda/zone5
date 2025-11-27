// Augment mdast types for remark plugin
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
