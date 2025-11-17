import { join, resolve } from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';

import { type ExifItem, exifFromFilePath } from './exif';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('extractExifFromFile', () => {
	it.for<[string, ExifItem]>([
		[
			'canon-m6-22mm.jpg',
			{
				type: 'Feature',
				geometry: null,
				properties: {
					artist: 'Christian Wygoda',
					copyright: undefined,
					dateTime: '2023-10-08T12:15:07+02:00',
					exposureTime: [1, 800],
					fNumber: [2, 1],
					focalLength: [22, 1],
					iso: 100,
					make: 'Canon',
					model: 'Canon EOS M6 MkII',
					lens: 'Canon EF-M 22mm f/2 STM',
				},
			},
		],
		[
			'iphone-15pro.jpg',
			{
				type: 'Feature',
				geometry: {
					type: 'Point',
					coordinates: [17.317977777777777, 50.921752805555556, 133.4],
				},
				properties: {
					artist: undefined,
					copyright: 'Christian Wygoda (c) 2024',
					dateTime: '2024-09-20T19:25:33+02:00',
					exposureTime: [1, 15],
					fNumber: [1.8, 1],
					focalLength: [6.8, 1],
					iso: 3200,
					make: 'Apple',
					model: 'Apple iPhone 15 Pro Max',
					lens: 'iPhone 15 Pro Max 6.765mm f/1.78',
				},
			},
		],
		[
			'nikon-z6iii-40mm.jpg',
			{
				type: 'Feature',
				geometry: null,
				properties: {
					artist: 'Christian Wygoda',
					copyright: undefined,
					dateTime: '2024-12-15T16:11:33+01:00',
					exposureTime: [1, 100],
					fNumber: [7.1, 1],
					focalLength: [40, 1],
					iso: 100,
					make: 'Nikon',
					model: 'Nikon Z6 III',
					lens: 'Nikkor Z 40mm f/2',
				},
			},
		],
		[
			'ricoh-gr-iiix.jpg',
			{
				type: 'Feature',
				geometry: null,
				properties: {
					artist: undefined,
					copyright: undefined,
					dateTime: '2025-04-03T14:57:57+02:00', // X
					exposureTime: [1, 250],
					fNumber: [8, 1],
					focalLength: [26, 1],
					iso: 200,
					make: 'Ricoh',
					model: 'Ricoh GR IIIx',
					lens: undefined,
				},
			},
		],
	])('should extract EXIF data from %s test image', async ([file, expected]) => {
		const testImagePath = resolve(__dirname, join('../test-data/', file));
		const result = await exifFromFilePath(testImagePath);

		if (expected === null) {
			expect(result).toBeNull();
		} else {
			expect(result).toEqual(expected);
		}
	});

	it('should return null for non-existent file', async () => {
		await expect(exifFromFilePath('/path/to/nonexistent.jpg')).rejects.toThrow();
	});
});
