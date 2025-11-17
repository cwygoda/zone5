import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';

import { remarkZ5Images } from './src/lib/remark.ts';

const config = {
	preprocess: [
		vitePreprocess(),
		mdsvex({
			extensions: ['.md'],
			remarkPlugins: [remarkZ5Images],
		}),
	],
	extensions: ['.svelte', '.md'],
	kit: {
		alias: {
			'zone5': './src/lib',
		},
	},
};

export default config;
