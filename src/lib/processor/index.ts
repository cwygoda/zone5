import { SpanStatusCode, trace } from '@opentelemetry/api';
import { writeFile } from 'fs/promises';
import { join, parse, relative } from 'path';
import sharp from 'sharp';

import type { BaseConfigType } from '../config.js';
import { generateBlurhash } from './blurhash.js';
import { type DominantColor, getDominantColors } from './color.js';
import type { ProcessorConfig } from './config.js';
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

const processor = async (options: {
	base: BaseConfigType;
	processor: ProcessorConfig;
	sourceFile: string;
	clear?: boolean;
	forceOverwrite?: boolean;
}) => {
	return tracer.startActiveSpan('zone5.processor', async (span) => {
		try {
			const { base, sourceFile, clear = false, forceOverwrite = false } = options;

			const { name: fileBasename } = parse(sourceFile);
			const sourceHash = sourceFileHash(base.root, sourceFile);
			const featureFile = join(base.cache, `${fileBasename}-${sourceHash}`, 'index.json');

			span.setAttributes({
				'zone5.sourceFile': sourceFile,
				'zone5.fileBasename': fileBasename,
				'zone5.sourceHash': sourceHash,
				'zone5.clear': clear,
				'zone5.forceOverwrite': forceOverwrite,
			});

			if (!(await fileExists(featureFile)) || clear || forceOverwrite) {
				const [exifFeature, blurhash, averageColor, variants, metadata] = await Promise.all([
					exifFromFilePath(sourceFile),
					generateBlurhash(sourceFile),
					getDominantColors(sourceFile),
					generateImageVariants(options),
					sharp(sourceFile).metadata(),
				]);

				const feature: ItemFeature = {
					type: 'Feature',
					geometry: exifFeature.geometry,
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
				span.setAttribute('zone5.cached', true);
			}

			span.setStatus({ code: SpanStatusCode.OK });
			return featureFile;
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
