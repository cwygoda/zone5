import sharp from 'sharp';
import z from 'zod';

export const ProcessorConfigSchema = z
	.object({
		resize_kernel: z.enum(Object.values(sharp.kernel)).default(sharp.kernel.mks2021),
		resize_gamma: z.number().min(1.0).max(3.0).default(2.2),
		variants: z.array(z.number().int().min(1)).default([640, 768, 1280, 1920, 2560]),
	})
	.prefault({});

export type ProcessorConfig = z.infer<typeof ProcessorConfigSchema> & {
	clear?: boolean;
	forceOverwrite?: boolean;
};
