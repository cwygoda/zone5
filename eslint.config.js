import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';

import svelteConfig from './svelte.config.ts';

export default ts.config(
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs.recommended,
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
			},
		},
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		// See more details at: https://typescript-eslint.io/packages/parser/
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'], // Add support for additional file extensions, such as .svelte
				parser: ts.parser,
				svelteConfig,
			},
		},
	},
	prettier,
	{
		rules: {
			// Override or add rule settings here, such as:
			// 'svelte/rule-name': 'error'
			'comma-dangle': 'off',
		},
	},
	{
		ignores: ['**/build/', '**/.svelte-kit/', '**/dist/', 'node_modules/', "dist-site/"],
	},
);
