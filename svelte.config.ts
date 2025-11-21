import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';

import { remarkZ5Images } from './src/lib/remark.ts';
import { remarkExtractTitle } from './src/remark-extract-title.ts';

const config = {
	preprocess: [
		vitePreprocess(),
		mdsvex({
			extensions: ['.md'],
			remarkPlugins: [remarkExtractTitle, remarkZ5Images],
		}),
	],
	extensions: ['.svelte', '.md'],
	kit: {
		adapter: adapter({
			pages: 'dist-site',
			assets: 'dist-site',
			fallback: undefined,
			precompress: false,
			strict: true,
		}),
		alias: {
			'zone5': './src/lib',
			'$components': './src/components',
		},
	},
};

export default config;
