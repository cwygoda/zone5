import { describe, expect, it } from 'vitest';

import { generateBlurhash } from './blurhash.js';

describe('blurhash', () => {
	const testImagePath = 'src/lib/processor/test-data/canon-m6-22mm.jpg';

	it('should generate a blurhash from an image file', async () => {
		const blurhash = await generateBlurhash(testImagePath);

		expect(blurhash).toBeDefined();
		expect(typeof blurhash).toBe('string');
		expect(blurhash.length).toBeGreaterThan(0);
	});

	it('should accept custom component options', async () => {
		const blurhash = await generateBlurhash(testImagePath, {
			componentX: 6,
			componentY: 6,
		});

		expect(blurhash).toBeDefined();
		expect(typeof blurhash).toBe('string');
	});

	it('should accept custom size options', async () => {
		const blurhash = await generateBlurhash(testImagePath, {
			width: 50,
			height: 50,
		});

		expect(blurhash).toBeDefined();
		expect(typeof blurhash).toBe('string');
	});

	it('should throw error for non-existent image', async () => {
		await expect(generateBlurhash('non-existent-image.jpg')).rejects.toThrow();
	});
});
