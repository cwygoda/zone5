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
				// Node built-ins
				/^node:/,
				'fs',
				'path',
				'child_process',
				'url',
				// Dependencies that should not be bundled
				'commander',
				'picocolors',
				'ora',
				'prompts',
				'fs-extra',
			],
			output: {
				banner(chunk) {
					// Only add shebang to the main entry file
					return chunk.isEntry && chunk.facadeModuleId?.includes('cli/index.ts')
						? '#!/usr/bin/env node'
						: '';
				},
				preserveModules: true,
				preserveModulesRoot: 'src/cli',
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
