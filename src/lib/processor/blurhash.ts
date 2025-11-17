import { SpanStatusCode, trace } from '@opentelemetry/api';
import { encode } from 'blurhash';
import sharp from 'sharp';

const tracer = trace.getTracer('zone5-processor-blurhash');

export interface BlurhashOptions {
	componentX?: number;
	componentY?: number;
	width?: number;
	height?: number;
}

export async function generateBlurhash(
	imagePath: string,
	options: BlurhashOptions = {},
): Promise<string> {
	return tracer.startActiveSpan('zone5.generateBlurhash', async (span) => {
		try {
			const { componentX = 4, componentY = 4, width = 100, height = 100 } = options;

			span.setAttributes({
				'zone5.imagePath': imagePath,
				'zone5.componentX': componentX,
				'zone5.componentY': componentY,
				'zone5.width': width,
				'zone5.height': height,
			});

			const { data, info } = await sharp(imagePath)
				.resize(width, height, { fit: 'inside' })
				.ensureAlpha()
				.raw()
				.toBuffer({ resolveWithObject: true });

			const blurhash = encode(
				new Uint8ClampedArray(data),
				info.width,
				info.height,
				componentX,
				componentY,
			);

			span.setStatus({ code: SpanStatusCode.OK });
			return blurhash;
		} catch (error) {
			span.setStatus({
				code: SpanStatusCode.ERROR,
				message: error instanceof Error ? error.message : String(error),
			});
			span.recordException(error instanceof Error ? error : new Error(String(error)));
			throw new Error(`Failed to generate blurhash for ${imagePath}: ${error}`);
		} finally {
			span.end();
		}
	});
}
