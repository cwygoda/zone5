import { copyFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
	build: {
		lib: {
			entry: resolve(__dirname, 'src/cli/index.ts'),
			formats: ['es'],
			fileName: 'index',
		},
		outDir: 'dist/cli',
		emptyOutDir: true,
		rollupOptions: {
			external: [
				// Node built-ins only - bundle all dependencies for npx compatibility
				/^node:/,
				'fs',
				'path',
				'child_process',
				'url',
				'util',
				'assert',
				'constants',
				'stream',
				'readline',
				'events',
				'tty',
				'os',
			],
			output: {
				banner: '#!/usr/bin/env node',
			},
		},
		target: 'node18',
	},
	plugins: [
		{
			name: 'copy-templates',
			closeBundle() {
				// Copy template files to dist
				const templatesDir = resolve(__dirname, 'dist/cli/templates');
				mkdirSync(templatesDir, { recursive: true });

				const templates = ['layout.svelte', 'app.css', 'layout.ts', '.zone5.toml'];
				for (const template of templates) {
					copyFileSync(
						resolve(__dirname, 'src/cli/templates', template),
						resolve(templatesDir, template),
					);
				}
			},
		},
	],
});
