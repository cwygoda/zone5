import { expect, test } from '@playwright/test';
import { type ChildProcess, spawn } from 'node:child_process';
import { join } from 'node:path';

/**
 * Start dev server and wait for it to be ready, returning the actual port
 */
async function startDevServer(
	cwd: string,
	timeout = 30000,
): Promise<{ process: ChildProcess; port: number }> {
	return new Promise((resolve, reject) => {
		const serverProcess = spawn('pnpm', ['dev'], {
			cwd,
			stdio: 'pipe',
			detached: true,
		});

		const timeoutId = setTimeout(() => {
			serverProcess.kill();
			reject(new Error('Timeout waiting for dev server to start'));
		}, timeout);

		// Parse output to find the actual port Vite is using
		const onData = (data: Buffer) => {
			const output = data.toString();
			console.log(`[dev server]: ${output}`);

			// Strip ANSI escape codes and match Vite's output: "Local:   http://localhost:5173/"
			// eslint-disable-next-line no-control-regex
			const cleanOutput = output.replace(/\x1b\[[0-9;]*m/g, '');
			const match = cleanOutput.match(/Local:\s+http:\/\/localhost:(\d+)/);
			if (match) {
				clearTimeout(timeoutId);
				const port = parseInt(match[1], 10);
				console.log(`Dev server started on port ${port}`);
				resolve({ process: serverProcess, port });
			}
		};

		serverProcess.stdout?.on('data', onData);
		serverProcess.stderr?.on('data', (data) => {
			console.error(`[dev server error]: ${data}`);
		});

		serverProcess.on('error', (err) => {
			clearTimeout(timeoutId);
			reject(err);
		});

		serverProcess.on('exit', (code) => {
			clearTimeout(timeoutId);
			if (code !== 0) {
				reject(new Error(`Dev server exited with code ${code}`));
			}
		});
	});
}

test.describe('Site navigation', () => {
	let serverProcess: ChildProcess | null = null;
	let port: number;

	test.beforeAll(async () => {
		console.log('Starting dev server...');

		const server = await startDevServer(join(import.meta.dirname, '..', '..'));
		serverProcess = server.process;
		port = server.port;

		console.log('Dev server is ready');
	});

	test.afterAll(async () => {
		if (serverProcess) {
			try {
				if (serverProcess.pid) {
					process.kill(-serverProcess.pid);
				}
				serverProcess.kill();
			} catch {
				// Ignore errors if process doesn't exist
			}
		}
	});

	test('should navigate to /color and back without effect_update_depth_exceeded error', async ({
		page,
	}) => {
		// Listen for console errors
		const consoleErrors: string[] = [];
		page.on('console', (msg) => {
			if (msg.type() === 'error') {
				consoleErrors.push(msg.text());
			}
		});

		// Listen for page errors (uncaught exceptions)
		const pageErrors: Error[] = [];
		page.on('pageerror', (error) => {
			pageErrors.push(error);
			console.log(`Page error: ${error.message}`);
		});

		// Step 1: Go to landing page
		console.log('Navigating to landing page...');
		await page.goto(`http://localhost:${port}/`, { waitUntil: 'domcontentloaded' });
		// Wait for landing page content to be ready
		await expect(page.locator('a[href*="/color"]').first()).toBeVisible({ timeout: 10000 });

		// Step 2: Click the /color link
		console.log('Clicking /color link...');
		const colorLink = page.locator('a[href*="/color"]').first();
		await colorLink.click();

		// Wait for images to be present (client-side navigation doesn't need waitForURL)
		const images = page.locator('[data-zone5-img="true"]');
		await expect(images.first()).toBeVisible({ timeout: 10000 });
		await expect(page).toHaveURL(/\/color/);

		// Check for errors after first visit
		const errorsAfterFirst = [...pageErrors];
		expect(
			errorsAfterFirst.filter((e) => e.message.includes('effect_update_depth_exceeded')),
		).toHaveLength(0);

		// Step 3: Navigate back to landing page using client-side navigation (not page.goto)
		console.log('Navigating back to landing page via client-side link...');
		const homeLink = page.locator('a[href="/"]').first();
		await expect(homeLink).toBeVisible();
		await homeLink.click();
		// Wait for landing page to be ready again
		await expect(page.locator('a[href*="/color"]').first()).toBeVisible({ timeout: 10000 });

		// Step 4: Click the /color link again (this is where the bug occurs)
		console.log('Clicking /color link again (second visit)...');
		const colorLinkAgain = page.locator('a[href*="/color"]').first();
		await colorLinkAgain.click();

		// Wait for images to be present
		await expect(images.first()).toBeVisible({ timeout: 10000 });
		await expect(page).toHaveURL(/\/color/);

		// Check for errors after second visit
		const pageErrorsWithDepth = pageErrors.filter((e) =>
			e.message.includes('effect_update_depth_exceeded'),
		);
		const consoleErrorsWithDepth = consoleErrors.filter((e) =>
			e.includes('effect_update_depth_exceeded'),
		);

		if (pageErrorsWithDepth.length > 0) {
			console.error('Found effect_update_depth_exceeded page errors:', pageErrorsWithDepth);
		}
		if (consoleErrorsWithDepth.length > 0) {
			console.error('Found effect_update_depth_exceeded console errors:', consoleErrorsWithDepth);
		}

		expect(pageErrorsWithDepth).toHaveLength(0);
		expect(consoleErrorsWithDepth).toHaveLength(0);

		console.log('✓ Navigation test passed!');
	});

	test('should show all images as visible after navigation', async ({ page, context }) => {
		// Disable cache to simulate fresh loads
		await context.route('**/*', (route) => {
			route.continue({
				headers: {
					...route.request().headers(),
					'Cache-Control': 'no-cache, no-store, must-revalidate',
				},
			});
		});

		// Step 1: Go to landing page
		console.log('Navigating to landing page...');
		await page.goto(`http://localhost:${port}/`, { waitUntil: 'domcontentloaded' });
		// Wait for landing page content to be ready
		const colorLink = page.locator('a[href*="/color"]').first();
		await expect(colorLink).toBeVisible({ timeout: 10000 });

		// Step 2: Click the /color link
		console.log('Clicking /color link...');
		await colorLink.click();

		// Wait for images to be present (client-side navigation doesn't need waitForURL)
		const images = page.locator('[data-zone5-img="true"]');
		await expect(images.first()).toBeVisible({ timeout: 10000 });
		await expect(page).toHaveURL(/\/color/);

		// Get image count
		const imageCount = await images.count();
		console.log(`First visit: Found ${imageCount} images`);

		// Wait for images to load (check for opacity-100 class which indicates loaded)
		await expect(async () => {
			const visibleCount = await images.locator('img.opacity-100').count();
			expect(visibleCount).toBeGreaterThan(0);
		}).toPass({ timeout: 10000 });

		const visibleOnFirst = await images.locator('img.opacity-100').count();
		console.log(`First visit: ${visibleOnFirst}/${imageCount} images visible`);

		// Step 3: Navigate back to landing page
		console.log('Navigating back to landing page...');
		await page.goto(`http://localhost:${port}/`, { waitUntil: 'domcontentloaded' });
		await expect(colorLink).toBeVisible({ timeout: 10000 });

		// Step 4: Click the /color link again
		console.log('Clicking /color link again (second visit)...');
		await colorLink.click();

		// Wait for images to be present
		await expect(images.first()).toBeVisible({ timeout: 10000 });
		await expect(page).toHaveURL(/\/color/);

		// Wait for images to load on second visit
		await expect(async () => {
			const visibleCount = await images.locator('img.opacity-100').count();
			expect(visibleCount).toBeGreaterThan(0);
		}).toPass({ timeout: 10000 });

		// Count visible images on second visit
		const imagesAfterNav = page.locator('[data-zone5-img="true"]');
		const imageCountAfterNav = await imagesAfterNav.count();
		const visibleOnSecond = await imagesAfterNav.locator('img.opacity-100').count();
		console.log(`Second visit: ${visibleOnSecond}/${imageCountAfterNav} images visible`);

		// All images should be visible after second navigation
		expect(visibleOnSecond).toBe(imageCountAfterNav);
		expect(visibleOnSecond).toBeGreaterThan(0);

		console.log('✓ All images visible after navigation!');
	});
});
