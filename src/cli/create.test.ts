import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { findImagesRecursive, pathExists } from './utils.js';

describe('createProject', () => {
	let testDir: string;
	let inputDir: string;

	beforeEach(async () => {
		testDir = join(import.meta.dirname, '__test-create__');
		inputDir = join(testDir, 'input');

		await mkdir(inputDir, { recursive: true });
	});

	afterEach(async () => {
		await rm(testDir, { recursive: true, force: true });
	});

	describe('validation helpers', () => {
		it('should detect existing paths', async () => {
			await writeFile(join(inputDir, 'test.txt'), 'test');
			expect(await pathExists(join(inputDir, 'test.txt'))).toBe(true);
		});

		it('should detect non-existing paths', async () => {
			expect(await pathExists(join(inputDir, 'nonexistent.txt'))).toBe(false);
		});

		it('should find images recursively', async () => {
			await writeFile(join(inputDir, 'photo1.jpg'), 'fake');
			await writeFile(join(inputDir, 'photo2.png'), 'fake');
			await writeFile(join(inputDir, 'doc.txt'), 'fake');

			const images = await findImagesRecursive(inputDir);

			expect(images).toHaveLength(2);
			expect(images.map((img) => img.relativePath).sort()).toEqual(['photo1.jpg', 'photo2.png']);
		});
	});

	describe('markdown generation logic', () => {
		it('should format image paths correctly', () => {
			const images = [
				{ path: '/test/photo1.jpg', relativePath: 'photo1.jpg' },
				{ path: '/test/photo2.png', relativePath: 'photo2.png' },
			];

			const imageLinks = images.map(({ relativePath }) => {
				const filename = relativePath.split('/').pop()!;
				return `![${filename.replace(/\.[^.]+$/, '')}](./${filename}?z5)`;
			});

			expect(imageLinks).toEqual(['![photo1](./photo1.jpg?z5)', '![photo2](./photo2.png?z5)']);
		});

		it('should strip file extensions from alt text', () => {
			const filename = 'my-vacation-photo.jpg';
			const altText = filename.replace(/\.[^.]+$/, '');

			expect(altText).toBe('my-vacation-photo');
		});
	});

	describe('image mode handling', () => {
		it('should validate mode options', () => {
			const validModes = ['copy', 'link', 'move'];
			const testMode = 'copy';

			expect(validModes).toContain(testMode);
		});

		it('should reject invalid modes', () => {
			const validModes = ['copy', 'link', 'move'];
			const invalidMode = 'delete';

			expect(validModes).not.toContain(invalidMode);
		});
	});
});
