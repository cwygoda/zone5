import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { findImages, findImagesRecursive, isImage, pathExists } from './utils.js';

describe('utils', () => {
	let testDir: string;

	beforeEach(async () => {
		testDir = await mkdtemp(join(tmpdir(), 'zone5-utils-test-'));
	});

	afterEach(async () => {
		await rm(testDir, { recursive: true, force: true });
	});

	describe('pathExists', () => {
		it('should return true for existing paths', async () => {
			const file = join(testDir, 'test.txt');
			await writeFile(file, 'test');

			expect(await pathExists(file)).toBe(true);
		});

		it('should return false for non-existing paths', async () => {
			expect(await pathExists(join(testDir, 'nonexistent.txt'))).toBe(false);
		});
	});

	describe('isImage', () => {
		it.each([
			['test.jpg', true],
			['test.jpeg', true],
			['test.JPG', true],
			['test.png', true],
			['test.PNG', true],
			['test.webp', true],
			['test.avif', true],
			['test.gif', true],
			['test.tiff', true],
			['test.tif', true],
			['test.heic', true],
			['test.heif', true],
			['test.txt', false],
			['test.md', false],
			['test.js', false],
			['test', false],
			['image.jpg.txt', false],
		])('should return %s for "%s"', (filename, expected) => {
			expect(isImage(filename)).toBe(expected);
		});
	});

	describe('findImages', () => {
		it('should find all images in a directory', async () => {
			await writeFile(join(testDir, 'image1.jpg'), 'test');
			await writeFile(join(testDir, 'image2.png'), 'test');
			await writeFile(join(testDir, 'document.txt'), 'test');
			await writeFile(join(testDir, 'image3.webp'), 'test');

			const images = await findImages(testDir);

			expect(images).toEqual(['image1.jpg', 'image2.png', 'image3.webp']);
		});

		it('should return empty array if no images exist', async () => {
			await writeFile(join(testDir, 'test.txt'), 'test');

			const images = await findImages(testDir);

			expect(images).toEqual([]);
		});

		it('should sort images alphabetically', async () => {
			await writeFile(join(testDir, 'zebra.jpg'), 'test');
			await writeFile(join(testDir, 'alpha.jpg'), 'test');
			await writeFile(join(testDir, 'beta.jpg'), 'test');

			const images = await findImages(testDir);

			expect(images).toEqual(['alpha.jpg', 'beta.jpg', 'zebra.jpg']);
		});

		it('should not include subdirectory images', async () => {
			const subDir = join(testDir, 'subdir');
			await mkdir(subDir);
			await writeFile(join(testDir, 'root.jpg'), 'test');
			await writeFile(join(subDir, 'nested.jpg'), 'test');

			const images = await findImages(testDir);

			expect(images).toEqual(['root.jpg']);
		});
	});

	describe('findImagesRecursive', () => {
		it('should find images recursively', async () => {
			const subDir1 = join(testDir, 'sub1');
			const subDir2 = join(testDir, 'sub1', 'sub2');
			await mkdir(subDir1, { recursive: true });
			await mkdir(subDir2, { recursive: true });

			await writeFile(join(testDir, 'root.jpg'), 'test');
			await writeFile(join(subDir1, 'nested1.png'), 'test');
			await writeFile(join(subDir2, 'nested2.webp'), 'test');

			const images = await findImagesRecursive(testDir);

			expect(images).toHaveLength(3);
			expect(images.map((img) => img.relativePath)).toEqual([
				'root.jpg',
				'sub1/nested1.png',
				'sub1/sub2/nested2.webp',
			]);
		});

		it('should include full paths', async () => {
			await writeFile(join(testDir, 'test.jpg'), 'test');

			const images = await findImagesRecursive(testDir);

			expect(images[0].path).toBe(join(testDir, 'test.jpg'));
			expect(images[0].relativePath).toBe('test.jpg');
		});

		it('should return empty array if no images exist', async () => {
			const images = await findImagesRecursive(testDir);

			expect(images).toEqual([]);
		});

		it('should ignore non-image files', async () => {
			await writeFile(join(testDir, 'image.jpg'), 'test');
			await writeFile(join(testDir, 'document.txt'), 'test');
			await writeFile(join(testDir, 'script.js'), 'test');

			const images = await findImagesRecursive(testDir);

			expect(images).toHaveLength(1);
			expect(images[0].relativePath).toBe('image.jpg');
		});

		it('should sort images by relative path', async () => {
			const subDir = join(testDir, 'sub');
			await mkdir(subDir);

			await writeFile(join(testDir, 'z.jpg'), 'test');
			await writeFile(join(subDir, 'a.jpg'), 'test');
			await writeFile(join(testDir, 'b.jpg'), 'test');

			const images = await findImagesRecursive(testDir);

			expect(images.map((img) => img.relativePath)).toEqual(['b.jpg', 'sub/a.jpg', 'z.jpg']);
		});
	});
});
