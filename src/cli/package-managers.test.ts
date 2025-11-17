import { execSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

// Paths relative to the package root
const PACKAGE_ROOT = resolve(import.meta.dirname, '../..');
const FIXTURES_DIR = join(PACKAGE_ROOT, 'src', 'routes', '(z5)', 'color', 'images');
const CLI_PATH = join(PACKAGE_ROOT, 'dist', 'cli', 'index.js');

/**
 * Check if a package manager is installed
 */
function isPackageManagerInstalled(pm: string): boolean {
	try {
		execSync(`${pm} --version`, { stdio: 'ignore' });
		return true;
	} catch {
		return false;
	}
}

/**
 * Get the build command for a package manager
 */
function getBuildCommand(pm: string): string {
	switch (pm) {
		case 'npm':
			return 'npm run build';
		case 'pnpm':
			return 'pnpm build';
		case 'yarn':
			return 'yarn build';
		case 'bun':
			return 'bun run build';
		default:
			throw new Error(`Unknown package manager: ${pm}`);
	}
}

describe('zone5 CLI Package Managers', () => {
	const packageManagers = ['npm', 'pnpm', 'yarn', 'bun'] as const;

	for (const pm of packageManagers) {
		test(
			`should create and build project with ${pm}`,
			{ skip: !isPackageManagerInstalled(pm), timeout: 180000 },
			async () => {
				// Create a temporary directory
				const tmpBase = await mkdtemp(join(tmpdir(), `zone5-${pm}-`));
				const testOutputDir = join(tmpBase, 'test-project');

				try {
					// Step 1: Build the CLI
					execSync('pnpm build:cli', {
						cwd: PACKAGE_ROOT,
						stdio: 'pipe',
					});

					// Step 2: Run zone5 create with the specific package manager
					execSync(
						`node "${CLI_PATH}" create "${FIXTURES_DIR}" "${testOutputDir}" --no-interactive --package-manager ${pm}`,
						{
							stdio: 'pipe',
							timeout: 120000,
							env: {
								...process.env,
								ZONE5_LOCAL_PATH: PACKAGE_ROOT,
							},
						},
					);

					// Step 3: Verify dependencies were installed (node_modules should exist)
					const nodeModulesExists = await import('node:fs/promises')
						.then((fs) => fs.access(join(testOutputDir, 'node_modules')))
						.then(() => true)
						.catch(() => false);

					expect(nodeModulesExists).toBe(true);

					// Step 4: Build the project - this is the key test, exit code should be 0
					execSync(getBuildCommand(pm), {
						cwd: testOutputDir,
						stdio: 'pipe',
						timeout: 120000,
					});

					// If we got here, build succeeded (exit code 0)
					// Step 5: Verify build output exists
					const buildDirExists = await import('node:fs/promises')
						.then((fs) => fs.access(join(testOutputDir, 'build')))
						.then(() => true)
						.catch(() => false);

					expect(buildDirExists).toBe(true);
				} finally {
					// Cleanup
					await rm(tmpBase, { recursive: true, force: true });
				}
			},
		);
	}

	test(
		'should create project with skip and allow manual installation',
		{ timeout: 180000 },
		async () => {
			// Create a temporary directory
			const tmpBase = await mkdtemp(join(tmpdir(), 'zone5-skip-'));
			const testOutputDir = join(tmpBase, 'test-project');

			try {
				// Step 1: Build the CLI
				execSync('pnpm build:cli', {
					cwd: PACKAGE_ROOT,
					stdio: 'pipe',
				});

				// Step 2: Run zone5 create with skip
				execSync(
					`node "${CLI_PATH}" create "${FIXTURES_DIR}" "${testOutputDir}" --no-interactive --package-manager skip`,
					{
						stdio: 'pipe',
						timeout: 60000,
						env: {
							...process.env,
							ZONE5_LOCAL_PATH: PACKAGE_ROOT,
						},
					},
				);

				// Step 3: Verify dependencies were NOT installed (node_modules should not exist)
				const nodeModulesExists = await import('node:fs/promises')
					.then((fs) => fs.access(join(testOutputDir, 'node_modules')))
					.then(() => true)
					.catch(() => false);

				expect(nodeModulesExists).toBe(false);

				// Step 4: Verify package.json has dependencies
				const packageJson = JSON.parse(
					await import('node:fs/promises').then((fs) =>
						fs.readFile(join(testOutputDir, 'package.json'), 'utf-8'),
					),
				);

				expect(packageJson.devDependencies).toBeDefined();
				expect(packageJson.devDependencies['zone5']).toBeDefined();
				expect(packageJson.devDependencies['@sveltejs/kit']).toBeDefined();

				// Step 5: Manually install with pnpm (since we know it's available in this repo)
				execSync('pnpm install', {
					cwd: testOutputDir,
					stdio: 'pipe',
					timeout: 120000,
				});

				// Step 6: Verify node_modules now exists
				const nodeModulesExistsAfter = await import('node:fs/promises')
					.then((fs) => fs.access(join(testOutputDir, 'node_modules')))
					.then(() => true)
					.catch(() => false);

				expect(nodeModulesExistsAfter).toBe(true);

				// Step 7: Build the project - exit code should be 0
				execSync('pnpm build', {
					cwd: testOutputDir,
					stdio: 'pipe',
					timeout: 120000,
				});

				// If we got here, build succeeded (exit code 0)
				// Step 8: Verify build output exists
				const buildDirExists = await import('node:fs/promises')
					.then((fs) => fs.access(join(testOutputDir, 'build')))
					.then(() => true)
					.catch(() => false);

				expect(buildDirExists).toBe(true);
			} finally {
				// Cleanup
				await rm(tmpBase, { recursive: true, force: true });
			}
		},
	);
});
