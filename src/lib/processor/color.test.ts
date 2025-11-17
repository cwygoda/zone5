import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';

import { type DominantColor, getDominantColors } from './color';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('getDominantColors', () => {
	it.for<[string, DominantColor]>([
		[
			'canon-m6-22mm.jpg',
			{
				hex: '#a18665',
				isDark: false,
			},
		],
	])('should extract average color from an image', async ([file, expected]) => {
		const color = await getDominantColors(join(__dirname, 'test-data', file));

		expect(color).toEqual(expected);
	});

	it('should handle invalid image paths', async () => {
		const invalidPath = '/invalid/path/to/image.jpg';

		await expect(getDominantColors(invalidPath)).rejects.toThrow(
			`Failed to extract dominant colors from ${invalidPath}`,
		);
	});
});
