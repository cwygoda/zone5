import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pc from 'picocolors';

import { createProject } from './create.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageJson = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf-8')) as {
	version: string;
};

const program = new Command();

program
	.name('zone5')
	.description('Image gallery system for SvelteKit')
	.version(packageJson.version);

program
	.command('create')
	.description('Create a new SvelteKit project with zone5 image processing')
	.argument('<input-folder>', 'Path to folder containing images')
	.argument('<output-folder>', 'Path where the new project will be created')
	.option('-m, --mode <type>', 'How to handle images: copy, link, or move', 'copy')
	.option(
		'-p, --package-manager <pm>',
		'Package manager to use: npm, pnpm, yarn, bun, or skip to not install',
		'npm',
	)
	.option('--no-interactive', 'Skip prompts and use defaults')
	.action(async (inputFolder: string, outputFolder: string, options) => {
		const { mode, packageManager, interactive } = options;

		if (!['copy', 'link', 'move'].includes(mode)) {
			console.error(pc.red(`Error: Invalid mode "${mode}". Must be one of: copy, link, move`));
			process.exit(1);
		}

		if (!['npm', 'pnpm', 'yarn', 'bun', 'skip'].includes(packageManager)) {
			console.error(
				pc.red(
					`Error: Invalid package manager "${packageManager}". Must be one of: npm, pnpm, yarn, bun, skip`,
				),
			);
			process.exit(1);
		}

		try {
			await createProject({
				inputFolder,
				outputFolder,
				mode: mode as 'copy' | 'link' | 'move',
				packageManager: packageManager as 'npm' | 'pnpm' | 'yarn' | 'bun' | 'skip',
				interactive,
			});
		} catch (error) {
			console.error(pc.red('Error:'), error instanceof Error ? error.message : String(error));
			process.exit(1);
		}
	});

program.parse();
