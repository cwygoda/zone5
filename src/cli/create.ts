import fse from 'fs-extra';
import { execSync } from 'node:child_process';
import { copyFile, mkdir, rename, symlink, writeFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ora from 'ora';
import pc from 'picocolors';
import prompts from 'prompts';

import { findImagesRecursive, isDirectory, pathExists } from './utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(__dirname, 'templates');

export interface CreateProjectOptions {
	inputFolder: string;
	outputFolder: string;
	mode: 'copy' | 'link' | 'move';
	packageManager: 'npm' | 'pnpm' | 'yarn' | 'bun' | 'skip';
	interactive: boolean;
}

export async function createProject(options: CreateProjectOptions): Promise<void> {
	const { inputFolder, outputFolder, mode, packageManager, interactive } = options;

	// Resolve paths
	const inputPath = resolve(inputFolder);
	const outputPath = resolve(outputFolder);

	console.log(pc.bold('\n🖼️  zone5\n'));

	// Validate input folder
	const spinner = ora('Validating input folder...').start();
	if (!(await pathExists(inputPath))) {
		spinner.fail(`Input folder does not exist: ${inputPath}`);
		throw new Error('Input folder not found');
	}

	if (!(await isDirectory(inputPath))) {
		spinner.fail(`Input path is not a directory: ${inputPath}`);
		throw new Error('Input path must be a directory');
	}

	// Find images
	spinner.text = 'Scanning for images...';
	const images = await findImagesRecursive(inputPath);

	if (images.length === 0) {
		spinner.fail('No images found in input folder');
		throw new Error('No images found');
	}

	spinner.succeed(`Found ${pc.cyan(images.length.toString())} images`);

	// Check if output folder exists
	if (await pathExists(outputPath)) {
		spinner.fail(`Output folder already exists: ${outputPath}`);
		throw new Error('Output folder must not exist');
	}

	// Confirm if interactive
	if (interactive) {
		const { confirmed } = await prompts({
			type: 'confirm',
			name: 'confirmed',
			message: `Create project at ${pc.cyan(outputPath)} with ${pc.cyan(images.length.toString())} images (mode: ${pc.yellow(mode)})?`,
			initial: true,
		});

		if (!confirmed) {
			console.log(pc.dim('Cancelled'));
			process.exit(0);
		}
	}

	// Create SvelteKit project
	spinner.start('Creating SvelteKit project...');
	await createSvelteKitBase(outputPath);
	spinner.succeed('Created SvelteKit project');

	// Add dependencies to package.json
	spinner.start('Adding dependencies to package.json...');
	await addDependenciesToPackageJson(outputPath);
	spinner.succeed('Added dependencies to package.json');

	// Install dependencies
	if (packageManager === 'skip') {
		spinner.info('Skipped dependency installation');
	} else {
		spinner.start('Installing dependencies...');
		await installDependencies(outputPath, packageManager);
		spinner.succeed('Installed dependencies');
	}

	// Handle images
	spinner.start(
		`${mode === 'copy' ? 'Copying' : mode === 'link' ? 'Linking' : 'Moving'} images...`,
	);
	const routesDir = join(outputPath, 'src', 'routes');
	await fse.ensureDir(routesDir);
	await handleImages(images, inputPath, routesDir, mode);
	spinner.succeed(
		`${mode === 'copy' ? 'Copied' : mode === 'link' ? 'Linked' : 'Moved'} ${images.length} images`,
	);

	// Generate markdown page
	spinner.start('Generating gallery page...');
	await generateGalleryPage(routesDir, images);
	spinner.succeed('Generated gallery page');

	// Add template files
	spinner.start('Adding template files...');
	await addTemplateFiles(outputPath);
	spinner.succeed('Added template files');

	// Configure project
	spinner.start('Configuring Vite...');
	await configureVite(outputPath);
	spinner.succeed('Configured Vite');

	spinner.start('Configuring Svelte...');
	await configureSvelte(outputPath);
	spinner.succeed('Configured Svelte');

	spinner.start('Configuring Tailwind...');
	await configureTailwind(outputPath);
	spinner.succeed('Configured Tailwind');

	// Create zone5 config
	spinner.start('Creating zone5 config...');
	await createZone5Config(outputPath);
	spinner.succeed('Created zone5 config');

	// Run svelte-kit sync to generate types
	if (packageManager !== 'skip') {
		spinner.start('Running svelte-kit sync...');
		await runSvelteKitSync(outputPath, packageManager);
		spinner.succeed('Ran svelte-kit sync');
	}

	// Success message
	console.log(pc.green('\n✓ Project created successfully!\n'));
	console.log('Next steps:');
	console.log(pc.cyan(`  cd ${basename(outputPath)}`));

	if (packageManager === 'skip') {
		console.log(pc.cyan('  npm install  # or your preferred package manager'));
		console.log(pc.cyan('  npm run dev'));
	} else {
		const devCommand = packageManager === 'npm' ? 'npm run dev' : `${packageManager} dev`;
		console.log(pc.cyan(`  ${devCommand}`));
	}
	console.log();
}

async function createSvelteKitBase(outputPath: string): Promise<void> {
	await mkdir(outputPath, { recursive: true });

	// Create package.json
	const packageJson = {
		name: basename(outputPath),
		version: '0.0.1',
		private: true,
		type: 'module',
		scripts: {
			dev: 'vite dev',
			build: 'vite build',
			preview: 'vite preview',
		},
		devDependencies: {},
		dependencies: {},
	};

	await writeFile(join(outputPath, 'package.json'), JSON.stringify(packageJson, null, '\t'));

	// Create directory structure
	await fse.ensureDir(join(outputPath, 'src', 'routes'));
	await fse.ensureDir(join(outputPath, 'static'));

	// Create app.html
	const appHtml = `<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		%sveltekit.head%
	</head>
	<body data-sveltekit-preload-data="hover">
		<div style="display: contents">%sveltekit.body%</div>
	</body>
</html>
`;
	await writeFile(join(outputPath, 'src', 'app.html'), appHtml);
}

async function addDependenciesToPackageJson(outputPath: string): Promise<void> {
	const packageJsonPath = join(outputPath, 'package.json');
	const packageJson = JSON.parse(await fse.readFile(packageJsonPath, 'utf-8'));

	// Add devDependencies
	packageJson.devDependencies = {
		'@lucide/svelte': '^0.553.0',
		'@sveltejs/adapter-static': '^3.0.0',
		'@sveltejs/kit': '^2.0.0',
		'@sveltejs/vite-plugin-svelte': '^6.0.0',
		'@tailwindcss/vite': '^4.0.0',
		'zone5': 'latest',
		mdsvex: '^0.12.0',
		svelte: '^5.0.0',
		tailwindcss: '^4.0.0',
		typescript: '^5.0.0',
		vite: '^7.0.0',
	};

	// If using local zone5 package, update the version specifier
	const zone5Path = process.env.ZONE5_LOCAL_PATH;
	if (zone5Path) {
		const resolvedZone5Path = resolve(zone5Path);
		packageJson.devDependencies['zone5'] = `file:${resolvedZone5Path}`;
	}

	await writeFile(packageJsonPath, JSON.stringify(packageJson, null, '\t'));
}

async function installDependencies(
	outputPath: string,
	packageManager: 'npm' | 'pnpm' | 'yarn' | 'bun',
): Promise<void> {
	// Determine install command based on package manager
	const getInstallCommand = () => {
		switch (packageManager) {
			case 'npm':
				return 'npm install';
			case 'pnpm':
				return 'pnpm install';
			case 'yarn':
				return 'yarn install';
			case 'bun':
				return 'bun install';
		}
	};

	// Install all dependencies from package.json
	try {
		execSync(getInstallCommand(), {
			cwd: outputPath,
			stdio: 'pipe',
		});
	} catch (error) {
		const execError = error as { stderr?: Buffer; message: string };
		const stderr = execError.stderr?.toString() || '';
		throw new Error(`Failed to install dependencies:\n${stderr || execError.message}`);
	}

	// Create svelte.config.js (basic version, will be configured later)
	const svelteConfig = `import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter()
	}
};

export default config;
`;

	await writeFile(join(outputPath, 'svelte.config.js'), svelteConfig);

	// Create vite.config.ts (basic version, will be configured later)
	const viteConfig = `import { sveltekit } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()]
});
`;

	await writeFile(join(outputPath, 'vite.config.ts'), viteConfig);

	// Create tsconfig.json
	const tsConfig = {
		extends: './.svelte-kit/tsconfig.json',
		compilerOptions: {
			allowJs: true,
			checkJs: true,
			esModuleInterop: true,
			forceConsistentCasingInFileNames: true,
			resolveJsonModule: true,
			skipLibCheck: true,
			sourceMap: true,
			strict: true,
			moduleResolution: 'bundler',
		},
	};

	await writeFile(join(outputPath, 'tsconfig.json'), JSON.stringify(tsConfig, null, '\t'));
}

async function runSvelteKitSync(
	outputPath: string,
	packageManager: 'npm' | 'pnpm' | 'yarn' | 'bun',
): Promise<void> {
	const getSyncCommand = () => {
		switch (packageManager) {
			case 'npm':
				return 'npx svelte-kit sync';
			case 'pnpm':
				return 'pnpm exec svelte-kit sync';
			case 'yarn':
				return 'yarn svelte-kit sync';
			case 'bun':
				return 'bunx svelte-kit sync';
		}
	};

	execSync(getSyncCommand(), {
		cwd: outputPath,
		stdio: 'pipe',
	});
}

async function handleImages(
	images: Array<{ path: string; relativePath: string }>,
	inputPath: string,
	targetDir: string,
	mode: 'copy' | 'link' | 'move',
): Promise<void> {
	// Process images in parallel batches to avoid overwhelming the filesystem
	const BATCH_SIZE = 10;

	for (let i = 0; i < images.length; i += BATCH_SIZE) {
		const batch = images.slice(i, i + BATCH_SIZE);
		await Promise.all(
			batch.map(async ({ path: imagePath, relativePath }) => {
				const targetPath = join(targetDir, basename(relativePath));

				if (mode === 'copy') {
					await copyFile(imagePath, targetPath);
				} else if (mode === 'link') {
					await symlink(imagePath, targetPath);
				} else if (mode === 'move') {
					await rename(imagePath, targetPath);
				}
			}),
		);
	}
}

async function generateGalleryPage(
	routesDir: string,
	images: Array<{ path: string; relativePath: string }>,
): Promise<void> {
	const imageLinks = images.map(({ relativePath }) => {
		const filename = basename(relativePath);
		return `![${filename.replace(/\.[^.]+$/, '')}](./${filename}?z5)`;
	});

	const markdown = `---
# Zone5 Gallery Configuration
# https://cwygoda.github.io/zone5/docs/reference/remark-plugin-api#frontmatter-options

# Gallery layout mode: "justified" (default) | "wall" | "waterfall"
# zone5mode: justified
---

# Photo Gallery

${imageLinks.join('\n')}
`;

	await writeFile(join(routesDir, '+page.md'), markdown);
}

async function addTemplateFiles(outputPath: string): Promise<void> {
	// Copy layout component
	const layoutSrc = join(TEMPLATES_DIR, 'layout.svelte');
	const layoutDest = join(outputPath, 'src', 'routes', '+layout.svelte');
	await fse.copy(layoutSrc, layoutDest);

	// Copy app.css
	const cssSrc = join(TEMPLATES_DIR, 'app.css');
	const cssDest = join(outputPath, 'src', 'app.css');
	await fse.copy(cssSrc, cssDest);

	// Copy layout.ts
	const layoutTsSrc = join(TEMPLATES_DIR, 'layout.ts');
	const layoutTsDest = join(outputPath, 'src', 'routes', '+layout.ts');
	await fse.copy(layoutTsSrc, layoutTsDest);
}

async function configureVite(outputPath: string): Promise<void> {
	const configPath = join(outputPath, 'vite.config.ts');

	// Rewrite the vite config from scratch for simplicity
	const viteConfig = `import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { zone5 } from 'zone5/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), zone5(), sveltekit()]
});
`;

	await writeFile(configPath, viteConfig);
}

async function configureSvelte(outputPath: string): Promise<void> {
	const configPath = join(outputPath, 'svelte.config.js');

	// Rewrite the svelte config from scratch for simplicity
	const svelteConfig = `import adapter from '@sveltejs/adapter-static';
import { mdsvex } from 'mdsvex';
import { remarkZ5Images } from 'zone5/remark';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte', '.md'],
	preprocess: [
		mdsvex({
			extensions: ['.md'],
			remarkPlugins: [remarkZ5Images]
		})
	],
	kit: {
		adapter: adapter()
	}
};

export default config;
`;

	await writeFile(configPath, svelteConfig);
}

async function configureTailwind(outputPath: string): Promise<void> {
	const tailwindConfig = `/** @type {import('tailwindcss').Config} */
export default {};
`;

	await writeFile(join(outputPath, 'tailwind.config.ts'), tailwindConfig);
}

async function createZone5Config(outputPath: string): Promise<void> {
	const zone5ConfigSrc = join(TEMPLATES_DIR, '.zone5.toml');
	const zone5ConfigDest = join(outputPath, '.zone5.toml');
	await fse.copy(zone5ConfigSrc, zone5ConfigDest);
}
