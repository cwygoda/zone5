import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: './tests/e2e',
	outputDir: './.playwright-results',
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: 1,
	reporter: [
		['list'],
		[
			'html',
			{
				open: 'never',
				outputFolder: '.playwright-reports',
			},
		],
	],
	use: {
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
		headless: true,
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
	],
	timeout: 120000, // 2 minutes for E2E tests
});
