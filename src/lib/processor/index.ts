import { SpanStatusCode, trace } from '@opentelemetry/api';
import { readFile, writeFile } from 'fs/promises';
import { join, parse, relative } from 'path';
import sharp from 'sharp';

import type { BaseConfigType } from '../config.js';
import { generateBlurhash } from './blurhash.js';
import { type DominantColor, getDominantColors } from './color.js';
import { configHash, ProcessorConfigSchema, type ProcessorConfigInput } from './config.js';
import type { ExifItem } from './exif/exif.js';
import exifFromFilePath from './exif/index.js';
import type { GeojsonPoint } from './exif/types.js';
import { fileExists, sourceFileHash } from './file.js';
import { generateImageVariants } from './variants.js';

const tracer = trace.getTracer('zone5-processor');

export interface ItemFeature {
	type: 'Feature';
	id: string;
	geometry: GeojsonPoint | null;
	properties: ExifItem['properties'] & {
		aspectRatio: number;
		blurhash: string;
		averageColor: DominantColor;
	};
	assets: { href: string; width: number }[];
}

export interface ProcessorResult {
	featureFile: string;
	feature: ItemFeature;
}

const processor = async (options: {
	base: BaseConfigType;
	processor: ProcessorConfigInput;
	sourceFile: string;
	clear?: boolean;
	forceOverwrite?: boolean;
}): Promise<ProcessorResult> => {
	return tracer.startActiveSpan('zone5.processor', async (span) => {
		try {
			const { base, processor: processorInput, sourceFile, clear = false, forceOverwrite = false } = options;
			// Parse config to apply defaults
			const processorConfig = ProcessorConfigSchema.parse(processorInput);

			const { name: fileBasename } = parse(sourceFile);
			const sourceHash = sourceFileHash(base.root, sourceFile);
			const procConfigHash = configHash(processorConfig);

			const cacheDir = join(base.cache, `${procConfigHash}-${fileBasename}-${sourceHash}`);
			const featureFile = join(cacheDir, 'index.json');

			span.setAttributes({
				'zone5.sourceFile': sourceFile,
				'zone5.fileBasename': fileBasename,
				'zone5.sourceHash': sourceHash,
				'zone5.configHash': procConfigHash,
				'zone5.cacheDir': cacheDir,
				'zone5.clear': clear,
				'zone5.forceOverwrite': forceOverwrite,
			});

			let feature: ItemFeature;

			if (!(await fileExists(featureFile)) || clear || forceOverwrite) {
				const [exifFeature, blurhash, averageColor, variants, metadata] = await Promise.all([
					exifFromFilePath(sourceFile),
					generateBlurhash(sourceFile),
					getDominantColors(sourceFile),
					generateImageVariants({ sourceFile, processor: processorConfig, cacheDir, clear, forceOverwrite }),
					sharp(sourceFile).metadata(),
				]);

				// Strip GPS data if configured (for privacy)
				const geometry = processorConfig.strip_gps ? null : exifFeature.geometry;

				feature = {
					type: 'Feature',
					geometry,
					id: sourceHash,
					properties: {
						...exifFeature.properties,
						aspectRatio: metadata.width / metadata.height,
						blurhash,
						averageColor,
					},
					assets: variants.map((variant) => ({
						href: relative(base.cache, variant.path),
						width: variant.width,
					})),
				};
				await writeFile(featureFile, JSON.stringify(feature));

				span.setAttribute('zone5.variantsCount', variants.length);
			} else {
				// Read cached feature - this is the only case where we need to read from disk
				feature = JSON.parse(await readFile(featureFile, { encoding: 'utf-8' })) as ItemFeature;
				span.setAttribute('zone5.cached', true);
			}

			span.setStatus({ code: SpanStatusCode.OK });
			return { featureFile, feature };
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
};

export default processor;
