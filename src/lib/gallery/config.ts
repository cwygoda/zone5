import z from 'zod';

/**
 * Schema for gallery configuration in .zone5.toml
 *
 * These values override the component defaults.
 */
export const GalleryConfigSchema = z
	.object({
		/** Default gallery layout mode */
		mode: z.enum(['wall', 'waterfall', 'justified']).optional(),

		/** Viewport width to column count mapping for waterfall mode */
		columnBreakpoints: z.record(z.string(), z.number().int().positive()).optional(),

		/** Target row height in pixels for justified mode */
		targetRowHeight: z.number().int().positive().optional(),

		/** Gap between images in pixels for justified mode */
		gap: z.number().int().nonnegative().optional(),

		/** Aspect ratio threshold for panoramic images in justified mode */
		panoramaThreshold: z.number().positive().optional(),
	})
	.prefault({})
	.transform((data) => ({
		...data,
		// Convert string keys to numbers for columnBreakpoints
		columnBreakpoints: data.columnBreakpoints
			? Object.fromEntries(
					Object.entries(data.columnBreakpoints).map(([k, v]) => [parseInt(k, 10), v]),
				)
			: undefined,
	}));

export type GalleryConfig = z.output<typeof GalleryConfigSchema>;
