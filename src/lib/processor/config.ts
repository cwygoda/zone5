import { createHash } from 'crypto';
import sharp from 'sharp';
import z from 'zod';

export const ProcessorConfigSchema = z
	.object({
		resize_kernel: z.enum(Object.values(sharp.kernel)).default(sharp.kernel.mks2021),
		resize_gamma: z.number().min(1.0).max(3.0).default(2.2),
		variants: z.array(z.number().int().min(1)).default([640, 768, 1280, 1920, 2560]),
	})
	.prefault({});

export type ProcessorConfig = z.infer<typeof ProcessorConfigSchema>;

export const configHash = (config: ProcessorConfig) => {
	// Generate SHAKE256 hash with length 4 for config
	const hash = createHash('shake256', { outputLength: 4 });
	hash.update(JSON.stringify(config));
	return hash.digest('hex');
};
