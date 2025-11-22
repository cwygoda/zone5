import { SpanStatusCode, trace } from '@opentelemetry/api';
import { rm } from 'fs/promises';
import { join, parse } from 'path';
import sharp from 'sharp';

import type { ProcessorConfig } from './config.js';
import { ensureDirectoryExists, fileExists } from './file.js';

const tracer = trace.getTracer('zone5-processor-variants');

export interface GeneratedVariant {
	width: number;
	path: string;
}

const addDebugText = async (img: sharp.Sharp, width: number, height: number) => {
	const svg = `<svg height="100" width="300">
	  <text x="0" y="50" font-size="50" fill="#fff">${width}×${height}</text>
	</svg>`;
	return img.composite([{ input: Buffer.from(svg), gravity: sharp.gravity.center }]);
};

export async function generateImageVariants(options: {
	processor: ProcessorConfig;
	sourceFile: string;
	cacheDir: string;
	clear?: boolean;
	forceOverwrite?: boolean;
}): Promise<GeneratedVariant[]> {
	return tracer.startActiveSpan('zone5.generateImageVariants', async (span) => {
		try {
			const { processor, sourceFile, cacheDir, clear = false, forceOverwrite = false } = options;

			// Parse file path components
			const { name: fileBasename, ext: fileExtension } = parse(sourceFile);

			// Get source image metadata to check dimensions
			const sourceImage = sharp(sourceFile);
			const { width: sourceWidth } = await sourceImage.metadata();

			// Filter out widths that would be wider than the source image
			const validWidths = processor.variants.filter((width) => width <= sourceWidth);

			span.setAttributes({
				'zone5.sourceFile': sourceFile,
				'zone5.sourceWidth': sourceWidth,
				'zone5.validWidthsCount': validWidths.length,
				'zone5.cacheDir': cacheDir,
				'zone5.clear': clear,
				'zone5.forceOverwrite': forceOverwrite,
			});

			// Prepare cache directory
			if (clear) {
				await rm(cacheDir, { recursive: true, force: true });
			}
			await ensureDirectoryExists(cacheDir);

			// Generate variants for each valid width
			const variants: GeneratedVariant[] = [];
			let generatedCount = 0;
			for (const width of validWidths) {
				const variantFilename = `${fileBasename}-${width}${fileExtension}`;
				const variantPath = join(cacheDir, variantFilename);

				// Check if variant already exists and should be overwritten
				const variantExists = await fileExists(variantPath);
				if (!variantExists || forceOverwrite) {
					let img = sharp(sourceFile).gamma(processor.resize_gamma).resize(width, null, {
						fit: 'inside',
						kernel: processor.resize_kernel,
					});

					if (process.env.ZONE5_DEBUG) {
						const { width: w, height: h } = await img.metadata();
						const scale = w / width;
						img = await addDebugText(img, width, Math.ceil(h * scale));
					}

					await img.toFile(variantPath);
					generatedCount++;
				}

				variants.push({
					width,
					path: variantPath,
				});
			}

			span.setAttributes({
				'zone5.variantsGenerated': generatedCount,
				'zone5.variantsTotal': variants.length,
			});

			span.setStatus({ code: SpanStatusCode.OK });
			return variants;
		} catch (error) {
			span.setStatus({
				code: SpanStatusCode.ERROR,
				message: error instanceof Error ? error.message : String(error),
			});
			span.recordException(error instanceof Error ? error : new Error(String(error)));
			throw error;
		} finally {
			span.end();
		}
	});
}
