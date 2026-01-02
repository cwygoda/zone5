import { access } from 'node:fs/promises';
import { dirname, join, parse, relative, resolve } from 'node:path';
import { cwd } from 'node:process';
import { stringify } from 'smol-toml';
import { z } from 'zod';
import { loadConfig } from 'zod-config';
import { tomlAdapter } from 'zod-config/toml-adapter';

import { GalleryConfigSchema } from './gallery/config.js';
import { ProcessorConfigSchema } from './processor/config.js';

const BaseConfigSchema = z.object({
	root: z.string().default(cwd()),
	cache: z.string().default(join(cwd(), '.zone5')),
	namespace: z.string().default('@zone5'),
});

export type BaseConfigType = z.infer<typeof BaseConfigSchema>;

const ConfigSchema = z.object({
	base: BaseConfigSchema.prefault({}),
	processor: ProcessorConfigSchema.prefault({}),
	gallery: GalleryConfigSchema.prefault({}),
});

export type ConfigType = z.infer<typeof ConfigSchema>;

/**
 * Walk up directory tree looking for a file.
 * Uses iterative approach instead of recursion for better performance.
 */
export const walkUntilFound = async (path: string): Promise<string | undefined> => {
	let currentPath = path;

	while (true) {
		try {
			await access(currentPath);
			return currentPath;
		} catch {
			const parentDir = dirname(dirname(currentPath));
			const filename = parse(currentPath).base;

			// Reached filesystem root
			if (parentDir === dirname(currentPath)) {
				return undefined;
			}

			currentPath = join(parentDir, filename);
		}
	}
};

export const load = async (configDir: string | undefined = undefined) => {
	const tomlFile = await walkUntilFound(resolve(configDir || cwd(), '.zone5.toml'));
	if (tomlFile) {
		const config = await loadConfig({
			schema: ConfigSchema,
			adapters: tomlAdapter({ path: tomlFile }),
		});
		// TODO: Define z.Path type which the adapter resolves?
		const tomlFileDir = parse(tomlFile).dir;
		config.base.root = resolve(tomlFileDir, config.base.root);
		config.base.cache = resolve(tomlFileDir, config.base.cache);
		return { ...config, src: tomlFile };
	}
	return ConfigSchema.parse({});
};

export const toToml = (config: ConfigType & { src?: string }) => {
	const data = ConfigSchema.parse(config);
	// output relative paths
	if (config.src) {
		const srcDir = parse(config.src).dir;
		data.base.root = relative(srcDir, data.base.root);
		data.base.cache = relative(srcDir, data.base.cache);
	}

	return stringify(data);
};
