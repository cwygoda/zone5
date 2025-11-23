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

test.describe('URL state synchronization', () => {
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

	test('should update URL when opening lightbox by clicking an image', async ({ page }) => {
		// Listen for console errors
		const consoleErrors: string[] = [];
		page.on('console', (msg) => {
			if (msg.type() === 'error') {
				consoleErrors.push(msg.text());
			}
		});

		// Listen for page errors
		const pageErrors: Error[] = [];
		page.on('pageerror', (error) => {
			pageErrors.push(error);
		});

		// Navigate to color page which has images
		await page.goto(`http://localhost:${port}/color`, { waitUntil: 'networkidle' });

		// Wait for images to load
		const images = page.locator('[data-zone5-img="true"]');
		await expect(images.first()).toBeVisible({ timeout: 10000 });

		// Get the initial URL (should not have z5 param)
		const initialUrl = new URL(page.url());
		expect(initialUrl.searchParams.has('z5')).toBe(false);

		// Click the first image to open lightbox
		await images.first().click();

		// Wait for lightbox to appear
		const lightbox = page.locator('[data-zone5-lightbox="true"]');
		await expect(lightbox).toBeVisible({ timeout: 5000 });

		// Check that URL now has z5 parameter
		await page.waitForTimeout(300); // Wait for URL update
		const lightboxUrl = new URL(page.url());
		expect(lightboxUrl.searchParams.has('z5')).toBe(true);
		const z5Value = lightboxUrl.searchParams.get('z5');
		expect(z5Value).toBeTruthy();
		console.log(`Lightbox opened with z5=${z5Value}`);

		// Check for errors
		const depthErrors = pageErrors.filter((e) =>
			e.message.includes('effect_update_depth_exceeded'),
		);
		expect(depthErrors).toHaveLength(0);
	});

	test('should clear z5 param when closing lightbox', async ({ page }) => {
		// Navigate to color page
		await page.goto(`http://localhost:${port}/color`, { waitUntil: 'networkidle' });

		// Wait for images
		const images = page.locator('[data-zone5-img="true"]');
		await expect(images.first()).toBeVisible({ timeout: 10000 });

		// Open lightbox
		await images.first().click();
		const lightbox = page.locator('[data-zone5-lightbox="true"]');
		await expect(lightbox).toBeVisible({ timeout: 5000 });

		// Verify z5 param is set
		await page.waitForTimeout(300);
		let currentUrl = new URL(page.url());
		expect(currentUrl.searchParams.has('z5')).toBe(true);

		// Close lightbox via close button
		const closeButton = page.locator('[data-zone5-close]');
		await closeButton.click();

		// Wait for lightbox to close
		await expect(lightbox).not.toBeVisible({ timeout: 5000 });

		// Check that z5 param is removed
		await page.waitForTimeout(300);
		currentUrl = new URL(page.url());
		expect(currentUrl.searchParams.has('z5')).toBe(false);
		console.log('z5 param cleared after closing lightbox');
	});

	test('should update z5 param when navigating to next/previous image', async ({ page }) => {
		// Navigate to color page
		await page.goto(`http://localhost:${port}/color`, { waitUntil: 'networkidle' });

		// Wait for images
		const images = page.locator('[data-zone5-img="true"]');
		await expect(images.first()).toBeVisible({ timeout: 10000 });

		// Open lightbox
		await images.first().click();
		const lightbox = page.locator('[data-zone5-lightbox="true"]');
		await expect(lightbox).toBeVisible({ timeout: 5000 });

		// Get initial z5 value
		await page.waitForTimeout(300);
		const initialZ5 = new URL(page.url()).searchParams.get('z5');
		console.log(`Initial z5=${initialZ5}`);

		// Click next button
		const nextButton = page.locator('[data-zone5-next]');
		if (await nextButton.isVisible()) {
			await nextButton.click();

			// Wait for transition and URL update
			await page.waitForTimeout(500);

			// Check that z5 value changed
			const nextZ5 = new URL(page.url()).searchParams.get('z5');
			console.log(`After next: z5=${nextZ5}`);
			expect(nextZ5).toBeTruthy();
			expect(nextZ5).not.toBe(initialZ5);

			// Click previous button
			const prevButton = page.locator('[data-zone5-prev]');
			await prevButton.click();

			// Wait for transition and URL update
			await page.waitForTimeout(500);

			// Check that z5 value changed back
			const prevZ5 = new URL(page.url()).searchParams.get('z5');
			console.log(`After prev: z5=${prevZ5}`);
			expect(prevZ5).toBe(initialZ5);
		} else {
			console.log('Skipping next/prev test - only one image');
		}
	});

	test('should open lightbox when navigating directly to URL with z5 param', async ({ page }) => {
		// Listen for page errors
		const pageErrors: Error[] = [];
		page.on('pageerror', (error) => {
			pageErrors.push(error);
		});

		// First, get a valid image ID by opening a lightbox
		await page.goto(`http://localhost:${port}/color`, { waitUntil: 'networkidle' });
		const images = page.locator('[data-zone5-img="true"]');
		await expect(images.first()).toBeVisible({ timeout: 10000 });

		// Open lightbox to get an image ID
		await images.first().click();
		const lightbox = page.locator('[data-zone5-lightbox="true"]');
		await expect(lightbox).toBeVisible({ timeout: 5000 });

		await page.waitForTimeout(300);
		const z5Value = new URL(page.url()).searchParams.get('z5');
		expect(z5Value).toBeTruthy();
		console.log(`Got z5 value: ${z5Value}`);

		// Now navigate directly to URL with z5 param (simulating direct link/refresh)
		await page.goto(`http://localhost:${port}/color?z5=${z5Value}`, { waitUntil: 'networkidle' });

		// Lightbox should open automatically
		await expect(lightbox).toBeVisible({ timeout: 5000 });
		console.log('Lightbox opened from direct URL');

		// Image should be rendered inside the lightbox
		const lightboxImage = lightbox.locator('img');
		await expect(lightboxImage).toBeVisible({ timeout: 5000 });
		console.log('Image rendered in lightbox');

		// URL should still have the z5 param (not reset)
		const finalZ5 = new URL(page.url()).searchParams.get('z5');
		expect(finalZ5).toBe(z5Value);
		console.log('URL z5 param preserved');

		// Check for errors
		const depthErrors = pageErrors.filter((e) =>
			e.message.includes('effect_update_depth_exceeded'),
		);
		expect(depthErrors).toHaveLength(0);
	});

	test('should not cause effect_update_depth_exceeded during repeated lightbox open/close', async ({
		page,
	}) => {
		// Listen for page errors
		const pageErrors: Error[] = [];
		page.on('pageerror', (error) => {
			pageErrors.push(error);
			console.log(`Page error: ${error.message}`);
		});

		// Navigate to color page
		await page.goto(`http://localhost:${port}/color`, { waitUntil: 'networkidle' });

		// Wait for images
		const images = page.locator('[data-zone5-img="true"]');
		await expect(images.first()).toBeVisible({ timeout: 10000 });

		const lightbox = page.locator('[data-zone5-lightbox="true"]');
		const closeButton = page.locator('[data-zone5-close]');

		// Open and close lightbox multiple times
		for (let i = 0; i < 5; i++) {
			console.log(`Iteration ${i + 1}: Opening lightbox...`);

			// Open lightbox
			await images.first().click();
			await expect(lightbox).toBeVisible({ timeout: 5000 });
			await page.waitForTimeout(200);

			// Close lightbox
			await closeButton.click();
			await expect(lightbox).not.toBeVisible({ timeout: 5000 });
			await page.waitForTimeout(200);
		}

		// Check for errors
		const depthErrors = pageErrors.filter((e) =>
			e.message.includes('effect_update_depth_exceeded'),
		);
		expect(depthErrors).toHaveLength(0);
		console.log('✓ No effect_update_depth_exceeded errors after repeated open/close');
	});

	test('should handle navigation between pages while lightbox is open', async ({ page }) => {
		// Listen for page errors
		const pageErrors: Error[] = [];
		page.on('pageerror', (error) => {
			pageErrors.push(error);
			console.log(`Page error: ${error.message}`);
		});

		// Navigate to color page
		await page.goto(`http://localhost:${port}/color`, { waitUntil: 'networkidle' });

		// Wait for images and open lightbox
		const images = page.locator('[data-zone5-img="true"]');
		await expect(images.first()).toBeVisible({ timeout: 10000 });
		await images.first().click();

		const lightbox = page.locator('[data-zone5-lightbox="true"]');
		await expect(lightbox).toBeVisible({ timeout: 5000 });

		// Navigate to home page while lightbox is open (via browser back or link)
		await page.goBack();
		await page.waitForLoadState('networkidle');

		// Lightbox should be closed and z5 param should be gone
		await page.waitForTimeout(500);
		const currentUrl = new URL(page.url());
		expect(currentUrl.pathname).not.toBe('/color');
		expect(currentUrl.searchParams.has('z5')).toBe(false);

		// Navigate back to color page
		const colorLink = page.locator('a[href*="/color"]').first();
		if (await colorLink.isVisible()) {
			await colorLink.click();
			await page.waitForURL('**/color');
			await page.waitForLoadState('networkidle');
		} else {
			await page.goto(`http://localhost:${port}/color`, { waitUntil: 'networkidle' });
		}

		// Wait for page to settle
		await page.waitForTimeout(500);

		// Check for errors
		const depthErrors = pageErrors.filter((e) =>
			e.message.includes('effect_update_depth_exceeded'),
		);
		expect(depthErrors).toHaveLength(0);
		console.log('✓ No errors during navigation with lightbox');
	});

	test('should sync URL with keyboard navigation (arrow keys)', async ({ page }) => {
		// Navigate to color page
		await page.goto(`http://localhost:${port}/color`, { waitUntil: 'networkidle' });

		// Wait for images
		const images = page.locator('[data-zone5-img="true"]');
		await expect(images.first()).toBeVisible({ timeout: 10000 });

		// Open lightbox
		await images.first().click();
		const lightbox = page.locator('[data-zone5-lightbox="true"]');
		await expect(lightbox).toBeVisible({ timeout: 5000 });

		// Get initial z5
		await page.waitForTimeout(300);
		const initialZ5 = new URL(page.url()).searchParams.get('z5');

		// Press right arrow to go to next
		await page.keyboard.press('ArrowRight');
		await page.waitForTimeout(500);

		const afterRightZ5 = new URL(page.url()).searchParams.get('z5');
		console.log(`After ArrowRight: z5 changed from ${initialZ5} to ${afterRightZ5}`);

		// If there are multiple images, z5 should change
		// (if only one image, it wraps around to the same one)
		const imageCount = await images.count();
		if (imageCount > 1) {
			expect(afterRightZ5).not.toBe(initialZ5);
		}

		// Press left arrow to go back
		await page.keyboard.press('ArrowLeft');
		await page.waitForTimeout(500);

		const afterLeftZ5 = new URL(page.url()).searchParams.get('z5');
		console.log(`After ArrowLeft: z5=${afterLeftZ5}`);

		if (imageCount > 1) {
			expect(afterLeftZ5).toBe(initialZ5);
		}

		// Press Escape to close
		await page.keyboard.press('Escape');
		await expect(lightbox).not.toBeVisible({ timeout: 5000 });

		// z5 should be cleared
		await page.waitForTimeout(300);
		const finalUrl = new URL(page.url());
		expect(finalUrl.searchParams.has('z5')).toBe(false);
	});
});
