import { SpanStatusCode, trace } from '@opentelemetry/api';
import { rm } from 'fs/promises';
import { join, parse } from 'path';
import sharp from 'sharp';

import { ProcessorConfigSchema, type ProcessorConfigInput } from './config.js';
import { ensureDirectoryExists, fileExists } from './file.js';

const tracer = trace.getTracer('zone5-processor-variants');

export interface GeneratedVariant {
	width: number;
	path: string;
}

export interface VariantsResult {
	variants: GeneratedVariant[];
	sourceWidth: number;
	sourceHeight: number;
}

const addDebugText = async (img: sharp.Sharp, width: number, height: number) => {
	const svg = `<svg height="100" width="300">
	  <text x="0" y="50" font-size="50" fill="#fff">${width}×${height}</text>
	</svg>`;
	return img.composite([{ input: Buffer.from(svg), gravity: sharp.gravity.center }]);
};

export async function generateImageVariants(options: {
	processor: ProcessorConfigInput;
	sourceFile: string;
	cacheDir: string;
	clear?: boolean;
	forceOverwrite?: boolean;
}): Promise<VariantsResult> {
	return tracer.startActiveSpan('zone5.generateImageVariants', async (span) => {
		try {
			const { processor: processorInput, sourceFile, cacheDir, clear = false, forceOverwrite = false } = options;
			const processor = ProcessorConfigSchema.parse(processorInput);

			// Parse file path components
			const { name: fileBasename, ext: fileExtension } = parse(sourceFile);

			// Get source image metadata to check dimensions (returned to caller to avoid redundant reads)
			const sourceImage = sharp(sourceFile);
			const { width: sourceWidth, height: sourceHeight } = await sourceImage.metadata();

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

			// Generate variants for each valid width in parallel
			const variantResults = await Promise.all(
				validWidths.map(async (width) => {
					const variantFilename = `${fileBasename}-${width}${fileExtension}`;
					const variantPath = join(cacheDir, variantFilename);

					// Check if variant already exists and should be overwritten
					const variantExists = await fileExists(variantPath);
					let wasGenerated = false;
					if (!variantExists || forceOverwrite) {
						let img = sharp(sourceFile);
						if (processor.resize_gamma) {
							img = img.gamma(processor.resize_gamma);
						}
						img = img.resize(width, null, {
							fit: 'inside',
							kernel: processor.resize_kernel,
						});

						if (process.env.ZONE5_DEBUG) {
							const { width: w, height: h } = await img.metadata();
							const scale = w / width;
							img = await addDebugText(img, width, Math.ceil(h * scale));
						}

						await img.toFile(variantPath);
						wasGenerated = true;
					}

					return {
						variant: { width, path: variantPath },
						wasGenerated,
					};
				}),
			);

			const variants = variantResults.map((r) => r.variant);
			const generatedCount = variantResults.filter((r) => r.wasGenerated).length;

			span.setAttributes({
				'zone5.variantsGenerated': generatedCount,
				'zone5.variantsTotal': variants.length,
			});

			span.setStatus({ code: SpanStatusCode.OK });
			return { variants, sourceWidth, sourceHeight };
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
