import { access, mkdir, rm, stat } from 'fs/promises';
import { tmpdir } from 'os';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { configHash, ProcessorConfigSchema, type ProcessorConfigInput } from './config';
import { sourceFileHash } from './file';
import { generateImageVariants } from './variants';

const createCacheDir = (
	cache: string,
	root: string,
	sourceFile: string,
	processor: ProcessorConfigInput,
) => {
	const parsedProcessor = ProcessorConfigSchema.parse(processor);
	const fileBasename = sourceFile.split('/').pop()!.replace(/\.[^.]+$/, '');
	const sourceHash = sourceFileHash(root, sourceFile);
	const procConfigHash = configHash(parsedProcessor);
	return join(cache, `${procConfigHash}-${fileBasename}-${sourceHash}`);
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('generateImageVariants', () => {
	let tempDir: string;
	let root: string;
	let cache: string;
	let testImagePath: string;

	beforeEach(async () => {
		// Create temporary directories for testing
		tempDir = join(tmpdir(), `variants-test-${Date.now()}`);
		root = join(tempDir, 'source');
		cache = join(tempDir, 'cache');

		await mkdir(root, { recursive: true });
		await mkdir(cache, { recursive: true });

		// Use existing test image
		testImagePath = join(__dirname, 'test-data', 'canon-m6-22mm.jpg');
	});

	afterEach(async () => {
		// Clean up temporary directory
		await rm(tempDir, { recursive: true, force: true });
	});

	it('should generate variants with correct naming and structure', async () => {
		const processor = {
			resize_kernel: 'linear',
			resize_gamma: 2.2,
			variants: [100, 200, 400],
		};
		const cacheDir = createCacheDir(cache, root, testImagePath, processor);
		const options = {
			processor,
			sourceFile: testImagePath,
			cacheDir,
		};

		const result = await generateImageVariants(options);

		expect(result.variants).toHaveLength(3);
		expect(result.variants[0].width).toBe(100);
		expect(result.variants[1].width).toBe(200);
		expect(result.variants[2].width).toBe(400);
		expect(result.sourceWidth).toBeGreaterThan(0);
		expect(result.sourceHeight).toBeGreaterThan(0);

		// Check that all files exist
		for (const variant of result.variants) {
			await expect(access(variant.path)).resolves.not.toThrow();
			expect(variant.path).toMatch(/[a-f0-9]{8}-canon-m6-22mm-[a-f0-9]{16}\/canon-m6-22mm-\d+\.jpg$/);
		}
	});

	it('should create cache subdirectory with hash', async () => {
		const processor = {
			resize_kernel: 'linear',
			resize_gamma: 2.2,
			variants: [200],
		};
		const cacheDir = createCacheDir(cache, root, testImagePath, processor);
		const options = {
			processor,
			sourceFile: testImagePath,
			cacheDir,
		};

		await generateImageVariants(options);

		// Check that subdirectory was created with expected pattern
		const entries = await import('fs').then((fs) => fs.promises.readdir(cache));
		expect(entries).toHaveLength(1);
		expect(entries[0]).toMatch(/^[a-f0-9]{8}-canon-m6-22mm-[a-f0-9]{16}$/);
	});

	it('should not overwrite existing files by default', async () => {
		const processor = {
			resize_kernel: 'linear',
			resize_gamma: 2.2,
			variants: [200],
		};
		const cacheDir = createCacheDir(cache, root, testImagePath, processor);
		const options = {
			processor,
			sourceFile: testImagePath,
			cacheDir,
		};

		// Generate variants first time
		const firstRun = await generateImageVariants(options);
		const { mtime: firstMtime } = await stat(firstRun.variants[0].path);

		// Wait a bit to ensure different timestamps
		await new Promise((resolve) => setTimeout(resolve, 10));

		// Generate variants second time
		await generateImageVariants(options);
		const { mtime: secondMtime } = await stat(firstRun.variants[0].path);

		expect(firstMtime).toEqual(secondMtime);
	});

	it('should overwrite existing files when forceOverwrite is true', async () => {
		const processor = {
			resize_kernel: 'linear',
			resize_gamma: 2.2,
			variants: [200],
		};
		const cacheDir = createCacheDir(cache, root, testImagePath, processor);
		const options = {
			processor,
			sourceFile: testImagePath,
			cacheDir,
		};

		// Generate variants first time
		const firstRun = await generateImageVariants(options);
		const { mtime: firstMtime } = await stat(firstRun.variants[0].path);

		// Wait a bit to ensure different timestamps
		await new Promise((resolve) => setTimeout(resolve, 10));

		// Generate variants second time with forceOverwrite
		await generateImageVariants({ ...options, forceOverwrite: true });
		const { mtime: secondMtime } = await stat(firstRun.variants[0].path);

		expect(secondMtime.getTime()).toBeGreaterThan(firstMtime.getTime());
	});

	it('should clear directory when clear option is true', async () => {
		const processor = {
			resize_kernel: 'linear',
			resize_gamma: 2.2,
			variants: [200, 400],
		};
		const cacheDir = createCacheDir(cache, root, testImagePath, processor);
		const options = {
			processor,
			sourceFile: testImagePath,
			cacheDir,
		};

		// Generate variants first time
		await generateImageVariants(options);

		// Verify files exist
		const files = await import('fs').then((fs) => fs.promises.readdir(cacheDir));
		expect(files).toHaveLength(2);

		// Generate with clear option and fewer widths
		const newProcessor = { ...processor, variants: [300] };
		const newCacheDir = createCacheDir(cache, root, testImagePath, newProcessor);
		await generateImageVariants({
			processor: newProcessor,
			sourceFile: testImagePath,
			cacheDir: newCacheDir,
			clear: true,
		});

		// Verify only new file exists
		const newFiles = await import('fs').then((fs) => fs.promises.readdir(newCacheDir));
		expect(newFiles).toHaveLength(1);
		expect(newFiles[0]).toMatch(/canon-m6-22mm-300\.jpg$/);
	});

	it('should handle invalid source file', async () => {
		const processor = {
			resize_kernel: 'linear',
			resize_gamma: 2.2,
			variants: [100, 200],
		};
		const sourceFile = '/invalid/path/to/image.jpg';
		const cacheDir = createCacheDir(cache, root, sourceFile, processor);
		const options = {
			processor,
			sourceFile,
			cacheDir,
		};

		await expect(generateImageVariants(options)).rejects.toThrow();
	});

	it.for(['lanczos3', 'linear', 'cubic'])(
		'should use %s resize kernel without errors',
		async (kernel) => {
			const processor = {
				resize_kernel: kernel,
				resize_gamma: 2.2,
				variants: [150],
			};
			const cacheDir = createCacheDir(cache, root, testImagePath, processor);
			const options = {
				processor,
				sourceFile: testImagePath,
				cacheDir,
				forceOverwrite: true,
			};

			// Should not throw an error when using different kernels
			const result = await generateImageVariants(options);
			expect(result.variants).toHaveLength(1);
			expect(result.variants[0].width).toBe(150);

			// Verify the file was created
			await expect(access(result.variants[0].path)).resolves.not.toThrow();
		},
	);
});
