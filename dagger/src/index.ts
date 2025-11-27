/**
 * Zone5 Dagger CI/CD Pipelines
 *
 * Provides fully isolated, reproducible test pipelines for:
 * - Unit tests (vitest)
 * - CLI integration tests
 * - E2E tests (playwright)
 */

import { dag, Container, Directory, object, func } from '@dagger.io/dagger';

/**
 * Base configuration for all pipelines
 */
const NODE_VERSION = '22';
const PNPM_VERSION = '10.18.2';

/**
 * Zone5 CI/CD Pipelines
 */
@object()
export class Zone5 {
	/**
	 * Creates a base container with Node.js and pnpm installed
	 */
	private baseContainer(): Container {
		return dag
			.container()
			.from(`node:${NODE_VERSION}-alpine`)
			.withExec(['corepack', 'enable'])
			.withExec(['corepack', 'prepare', `pnpm@${PNPM_VERSION}`, '--activate'])
			.withExec(['apk', 'add', '--no-cache', 'git', 'tzdata'])
			.withEnvVariable('TZ', 'Europe/Berlin'); // Set timezone to match local system
	}

	/**
	 * Sets up the source directory and installs dependencies
	 */
	private async setupProject(source: Directory): Promise<Container> {
		const cacheVolume = dag.cacheVolume('pnpm-store');

		return this.baseContainer()
			.withDirectory('/workspace', source, {
				exclude: [
					'node_modules',
					'.svelte-kit',
					'dist',
					'.zone5',
					'.playwright-results',
					'.playwright-reports',
					'coverage',
				],
			})
			.withWorkdir('/workspace')
			.withMountedCache('/root/.local/share/pnpm/store', cacheVolume)
			.withExec(['pnpm', 'install', '--frozen-lockfile']);
	}

	/**
	 * Run unit tests (fast vitest tests excluding CLI)
	 *
	 * @param source Project source directory
	 */
	@func()
	async test(source: Directory): Promise<string> {
		const container = await this.setupProject(source);

		return await container
			.withExec(['pnpm', 'test', '--run', '--reporter=verbose'])
			.stdout();
	}

	/**
	 * Run CLI integration tests
	 *
	 * @param source Project source directory
	 */
	@func()
	async testCli(source: Directory): Promise<string> {
		const container = await this.setupProject(source);

		// CLI tests need the full package to be built (not just the CLI)
		// because they create projects that import from @zone5/zone5
		return await container
			.withExec(['pnpm', 'build'])
			.withExec(['pnpm', 'test:cli', '--run', '--reporter=verbose'])
			.stdout();
	}

	/**
	 * Run E2E tests with Playwright
	 *
	 * @param source Project source directory
	 */
	@func()
	async testE2e(source: Directory): Promise<string> {
		// E2E tests need a more complete setup with Playwright browsers
		const cacheVolume = dag.cacheVolume('pnpm-store');

		const container = this.baseContainer()
			.from(`mcr.microsoft.com/playwright:v1.56.1-noble`)
			.withExec(['corepack', 'enable'])
			.withExec(['corepack', 'prepare', `pnpm@${PNPM_VERSION}`, '--activate'])
			.withEnvVariable('TZ', 'Europe/Berlin') // Set timezone for E2E tests
			.withDirectory('/workspace', source, {
				exclude: [
					'node_modules',
					'.svelte-kit',
					'dist',
					'.zone5',
					'.playwright-results',
					'.playwright-reports',
					'coverage',
				],
			})
			.withWorkdir('/workspace')
			.withMountedCache('/root/.local/share/pnpm/store', cacheVolume)
			.withExec(['pnpm', 'install', '--frozen-lockfile'])
			.withExec(['pnpm', 'build']) // Build the full package before E2E tests
			.withEnvVariable('CI', '1');

		return await container.withExec(['pnpm', 'test:e2e']).stdout();
	}

	/**
	 * Run all test suites in parallel
	 *
	 * @param source Project source directory
	 */
	@func()
	async testAll(source: Directory): Promise<string> {
		// Run all tests in parallel using Promise.all
		const [unitResult, cliResult, e2eResult] = await Promise.all([
			this.test(source),
			this.testCli(source),
			this.testE2e(source),
		]);

		return [
			'=== Unit Tests ===',
			unitResult,
			'\n=== CLI Tests ===',
			cliResult,
			'\n=== E2E Tests ===',
			e2eResult,
		].join('\n');
	}

	/**
	 * Run type checking
	 *
	 * @param source Project source directory
	 */
	@func()
	async check(source: Directory): Promise<string> {
		const container = await this.setupProject(source);

		return await container.withExec(['pnpm', 'check']).stdout();
	}

	/**
	 * Run linting
	 *
	 * @param source Project source directory
	 */
	@func()
	async lint(source: Directory): Promise<string> {
		const container = await this.setupProject(source);

		return await container.withExec(['pnpm', 'lint']).stdout();
	}

	/**
	 * Build the documentation site
	 *
	 * @param source Project source directory
	 * @returns The built site as a directory
	 */
	@func()
	async buildSite(source: Directory): Promise<Directory> {
		const container = await this.setupProject(source);

		// Build the package first (required for site), then build the site
		return container
			.withExec(['pnpm', 'build'])
			.withExec(['pnpm', 'build:site'])
			.directory('/workspace/dist-site');
	}

	/**
	 * Full CI pipeline: lint, check, test all, and build
	 *
	 * @param source Project source directory
	 */
	@func()
	async ci(source: Directory): Promise<string> {
		const container = await this.setupProject(source);

		// Run checks sequentially to get clear error messages
		await container.withExec(['pnpm', 'lint']).sync();
		await container.withExec(['pnpm', 'check']).sync();

		// Run all tests
		const testResult = await this.testAll(source);

		// Build
		await container.withExec(['pnpm', 'build']).sync();

		return [
			'✓ Lint passed',
			'✓ Type check passed',
			'✓ Tests passed:',
			testResult,
			'✓ Build passed',
			'\n🎉 All CI checks passed!',
		].join('\n');
	}
}
