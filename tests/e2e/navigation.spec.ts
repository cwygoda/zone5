import { expect, test } from '@playwright/test';
import { type ChildProcess, spawn } from 'node:child_process';
import { request as httpRequest } from 'node:http';
import { createServer } from 'node:net';
import { join } from 'node:path';

/**
 * Find an available port by attempting to bind to it
 */
async function getAvailablePort(startPort = 5173): Promise<number> {
	return new Promise((resolve, reject) => {
		const server = createServer();
		server.listen(startPort, () => {
			const { port } = server.address() as { port: number };
			server.close(() => resolve(port));
		});
		server.on('error', (err: NodeJS.ErrnoException) => {
			if (err.code === 'EADDRINUSE') {
				resolve(getAvailablePort(startPort + 1));
			} else {
				reject(err);
			}
		});
	});
}

/**
 * Wait for HTTP server to be ready by making requests
 */
async function waitForPort(port: number, timeout = 30000): Promise<void> {
	const startTime = Date.now();
	while (Date.now() - startTime < timeout) {
		try {
			await new Promise<void>((resolve, reject) => {
				const req = httpRequest(
					{
						hostname: 'localhost',
						port,
						path: '/',
						method: 'GET',
					},
					() => {
						resolve();
					},
				);
				req.on('error', () => {
					reject(new Error('Server not ready'));
				});
				req.end();
			});
			return;
		} catch {
			await new Promise((resolve) => setTimeout(resolve, 100));
		}
	}
	throw new Error(`Timeout waiting for port ${port} to be ready`);
}

test.describe('Site navigation', () => {
	let serverProcess: ChildProcess | null = null;
	let port: number;

	test.beforeAll(async () => {
		port = await getAvailablePort();
		console.log(`Starting dev server on port ${port}...`);

		serverProcess = spawn('pnpm', ['dev', '--port', port.toString()], {
			cwd: join(import.meta.dirname, '..', '..'),
			stdio: 'pipe',
			detached: true,
		});

		// Log server output for debugging
		serverProcess.stdout?.on('data', (data) => {
			console.log(`[dev server]: ${data}`);
		});
		serverProcess.stderr?.on('data', (data) => {
			console.error(`[dev server error]: ${data}`);
		});

		await waitForPort(port);
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
		await page.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle' });

		// Step 2: Click the /color link
		console.log('Clicking /color link...');
		const colorLink = page.locator('a[href*="/color"]').first();
		await expect(colorLink).toBeVisible();
		await colorLink.click();

		// Wait for navigation and page to settle
		await page.waitForURL('**/color');
		await page.waitForLoadState('networkidle');
		await page.waitForTimeout(500); // Extra time for effects to settle

		// Check for errors after first visit
		const errorsAfterFirst = [...pageErrors];
		expect(
			errorsAfterFirst.filter((e) => e.message.includes('effect_update_depth_exceeded')),
		).toHaveLength(0);

		// Verify images loaded
		const images = page.locator('[data-zone5-img="true"]');
		await expect(images.first()).toBeVisible({ timeout: 10000 });

		// Step 3: Navigate back to landing page using client-side navigation (not page.goto)
		console.log('Navigating back to landing page via client-side link...');
		const homeLink = page.locator('a[href="/"]').first();
		await expect(homeLink).toBeVisible();
		await homeLink.click();
		await page.waitForURL(`http://localhost:${port}/`);
		await page.waitForLoadState('networkidle');

		// Step 4: Click the /color link again (this is where the bug occurs)
		console.log('Clicking /color link again (second visit)...');
		const colorLinkAgain = page.locator('a[href*="/color"]').first();
		await expect(colorLinkAgain).toBeVisible();
		await colorLinkAgain.click();

		// Wait for navigation and page to settle
		await page.waitForURL('**/color');
		await page.waitForLoadState('networkidle');
		await page.waitForTimeout(500); // Extra time for effects to settle

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

		// Verify images still loaded correctly
		await expect(images.first()).toBeVisible({ timeout: 10000 });

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
		await page.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle' });

		// Step 2: Click the /color link
		console.log('Clicking /color link...');
		const colorLink = page.locator('a[href*="/color"]').first();
		await expect(colorLink).toBeVisible();
		await colorLink.click();

		// Wait for navigation
		await page.waitForURL('**/color');
		await page.waitForLoadState('networkidle');

		// Get all images and wait for them to be visible
		const images = page.locator('[data-zone5-img="true"]');
		const imageCount = await images.count();
		console.log(`First visit: Found ${imageCount} images`);

		// Wait for all images to load on first visit
		await page.waitForTimeout(1000);

		// Count visible images (opacity-100) on first visit
		const visibleOnFirst = await images.locator('img.opacity-100').count();
		console.log(`First visit: ${visibleOnFirst}/${imageCount} images visible`);

		// Step 3: Navigate back to landing page
		console.log('Navigating back to landing page...');
		await page.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle' });

		// Step 4: Click the /color link again
		console.log('Clicking /color link again (second visit)...');
		await colorLink.click();

		// Wait for navigation
		await page.waitForURL('**/color');
		await page.waitForLoadState('networkidle');

		// Wait for images to load on second visit
		await page.waitForTimeout(1000);

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
