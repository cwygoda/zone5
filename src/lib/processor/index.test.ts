import { readFile, rm } from 'fs/promises';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { fileExists } from './file.js';
import processor from './index.js';

describe('zone5 processor', () => {
	const testImage = 'src/lib/processor/test-data/canon-m6-22mm.jpg';
	const testCacheDir = 'test-cache';
	const testSourceBaseDir = 'src/lib/processor/test-data';

	beforeEach(async () => {
		try {
			await rm(testCacheDir, { recursive: true, force: true });
		} catch {
			// Ignore if directory doesn't exist
		}
	});

	afterEach(async () => {
		try {
			await rm(testCacheDir, { recursive: true, force: true });
		} catch {
			// Ignore if directory doesn't exist
		}
	});

	it('should process an image and generate feature file', async () => {
		const options = {
			base: {
				root: testSourceBaseDir,
				cache: testCacheDir,
				namespace: '@zone5',
			},
			processor: {
				resize_kernel: 'linear',
				resize_gamma: 2.2,
				variants: [400, 800],
			},
			sourceFile: testImage,
		};

		const featureFilePath = await processor(options);

		expect(await fileExists(featureFilePath)).toBe(true);

		const featureContent = await readFile(featureFilePath, 'utf-8');
		const feature = JSON.parse(featureContent);

		expect(feature.type).toBe('Feature');
		expect(feature.geometry).toBeDefined();
		expect(feature.properties).toBeDefined();
		expect(feature.properties.blurhash).toBeDefined();
		expect(feature.properties.averageColor).toBeDefined();
		expect(feature.assets).toHaveLength(2);
	});

	it('should not regenerate if feature file already exists', async () => {
		const options = {
			base: {
				root: testSourceBaseDir,
				cache: testCacheDir,
				namespace: '@zone5',
			},
			processor: {
				resize_kernel: 'linear',
				resize_gamma: 2.2,
				variants: [400],
			},
			sourceFile: testImage,
		};

		const featureFilePath1 = await processor(options);
		const featureFilePath2 = await processor(options);

		expect(featureFilePath1).toBe(featureFilePath2);
	});

	it('should respect clear option', async () => {
		const options = {
			base: {
				root: testSourceBaseDir,
				cache: testCacheDir,
				namespace: '@zone5',
			},
			processor: {
				resize_kernel: 'linear',
				resize_gamma: 2.2,
				variants: [400, 800],
			},
			sourceFile: testImage,
			clear: true,
		};

		const featureFilePath = await processor(options);
		expect(await fileExists(featureFilePath)).toBe(true);
	});
});
