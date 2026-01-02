import { rm } from 'fs/promises';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { fileExists } from './file.js';
import processor from './index.js';

describe('zone5 processor', () => {
	const testImage = 'src/lib/processor/test-data/canon-m6-22mm.jpg';
	const testImageWithGps = 'src/lib/processor/test-data/iphone-15pro.jpg';
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

		const { featureFile, feature } = await processor(options);

		expect(await fileExists(featureFile)).toBe(true);
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

		const result1 = await processor(options);
		const result2 = await processor(options);

		expect(result1.featureFile).toBe(result2.featureFile);
		expect(result1.feature).toEqual(result2.feature);
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

		const { featureFile } = await processor(options);
		expect(await fileExists(featureFile)).toBe(true);
	});

	it('should include GPS data by default', async () => {
		const options = {
			base: {
				root: testSourceBaseDir,
				cache: testCacheDir,
				namespace: '@zone5',
			},
			processor: {
				resize_kernel: 'linear',
				variants: [400],
			},
			sourceFile: testImageWithGps,
		};

		const { feature } = await processor(options);

		// The iPhone test image has GPS data
		expect(feature.geometry).not.toBeNull();
		expect(feature.geometry!.type).toBe('Point');
		expect(feature.geometry!.coordinates).toBeDefined();
	});

	it('should strip GPS data when strip_gps is true', async () => {
		const options = {
			base: {
				root: testSourceBaseDir,
				cache: testCacheDir,
				namespace: '@zone5',
			},
			processor: {
				resize_kernel: 'linear',
				variants: [400],
				strip_gps: true,
			},
			sourceFile: testImageWithGps,
		};

		const { feature } = await processor(options);

		// GPS data should be stripped
		expect(feature.geometry).toBeNull();
		// Other EXIF properties should still be present
		expect(feature.properties.make).toBeDefined();
	});
});
