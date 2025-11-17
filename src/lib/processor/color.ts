import { SpanStatusCode, trace } from '@opentelemetry/api';
import { getAverageColor } from 'fast-average-color-node';

const tracer = trace.getTracer('zone5-processor-color');

export interface DominantColor {
	hex: string;
	isDark: boolean;
}

export async function getDominantColors(imagePath: string): Promise<DominantColor> {
	return tracer.startActiveSpan('zone5.getDominantColors', async (span) => {
		try {
			span.setAttribute('zone5.imagePath', imagePath);

			const result = await getAverageColor(imagePath, {});

			const color = {
				hex: result.hex,
				isDark: result.isDark,
			};

			span.setAttributes({
				'zone5.color.hex': color.hex,
				'zone5.color.isDark': color.isDark,
			});

			span.setStatus({ code: SpanStatusCode.OK });
			return color;
		} catch (error) {
			span.setStatus({
				code: SpanStatusCode.ERROR,
				message: error instanceof Error ? error.message : String(error),
			});
			span.recordException(error instanceof Error ? error : new Error(String(error)));
			throw new Error(`Failed to extract dominant colors from ${imagePath}: ${error}`);
		} finally {
			span.end();
		}
	});
}
