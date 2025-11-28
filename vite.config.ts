import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { searchForWorkspaceRoot } from 'vite';
import { defineConfig } from 'vitest/config';

import { zone5 } from './src/lib/vite';

export default defineConfig({
	plugins: [zone5({ basePath: process.env.BASE_PATH || '' }), tailwindcss(), sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		environment: 'jsdom',
		setupFiles: ['./src/lib/test-setup.ts'],
	},
	resolve: {
		conditions: ['browser'],
	},
	server: {
		fs: {
			allow: [searchForWorkspaceRoot(process.cwd())],
		},
	},
});
