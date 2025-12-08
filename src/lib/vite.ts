import { type Context, type Span, SpanStatusCode, context, trace } from '@opentelemetry/api';
import { dataToEsm } from '@rollup/pluginutils';
import type { NextHandleFunction } from 'connect';
import mime from 'mime';
import { createReadStream } from 'node:fs';
import { cp, readFile, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { Plugin, ResolvedConfig } from 'vite';

import { type ConfigType, load } from './config.js';
import processor, { type ItemFeature } from './processor/index.js';

const tracer = trace.getTracer('zone5-vite');

// Store active spans for module resolution chains
const moduleSpans = new Map<string, { span: Span; context: Context }>();

const createBasePath = (namespace: string, base?: string) =>
	(base?.replace(/\/$/, '') || '') + `/${namespace}/`;

const parseURL = (rawURL: string): URL => {
	return new URL(rawURL.replace(/#/g, '%23'), 'file://');
};

const serve =
	(basePath: string, cacheDir: string): NextHandleFunction =>
	async (req, res, next) => {
		if (req.url?.startsWith(basePath)) {
			const [, id] = req.url.split(basePath);
			try {
				const path = decodeURIComponent(id);
				const src = join(cacheDir, path);
				try {
					const image = createReadStream(src);
					const stats = await stat(src);
					res.setHeader('Content-Type', mime.getType(src) ?? 'binary/octet');
					res.setHeader('Content-Length', stats.size);
					res.setHeader('Cache-Control', 'max-age=360000');
					return image.pipe(res);
				} catch (error) {
					console.error(`can not find zone5 data for ${id}`);
					console.error(error);
				}
			} catch {
				res.statusCode = 404;
			}
		}

		next();
	};

export interface Zone5PluginOptions {
	cwd?: string;
	basePath?: string;
}

export function zone5(options: Zone5PluginOptions = {}): Plugin {
	let viteConfig: ResolvedConfig;
	let basePath: string;
	let zone5Config: ConfigType;

	return {
		name: 'zone5',
		enforce: 'pre',

		async config() {
			// Load config early so we can inject defines
			if (!zone5Config) {
				zone5Config = await load(options.cwd);
			}
			return {
				define: {
					__ZONE5_MAP_URL_CONFIG__: JSON.stringify(zone5Config.base.mapUrl ?? null),
				},
			};
		},

		async configResolved(cfg) {
			viteConfig = cfg;
			if (!zone5Config) {
				zone5Config = await load(options.cwd);
			}
			basePath = createBasePath(zone5Config.base.namespace, options.basePath ?? viteConfig.base);
		},

		async resolveId(id, importer) {
			const srcURL = parseURL(id);
			if (srcURL.searchParams.get('z5') !== null) {
				if (importer && !id.startsWith('/')) {
					id = join(dirname(importer), id);
				}
				return `\0${id}`;
			}
		},

		async load(id, options): Promise<string | null | undefined> {
			const srcURL = parseURL(id);
			if (srcURL.pathname.endsWith('.jpg') && srcURL.searchParams.get('z5') !== null) {
				// Find parent span context from the importer
				const importer = options?.ssr ? undefined : id;
				let parentContext: Context | undefined;

				// Try to find parent span from any matching importer
				for (const [importerPath, spanData] of moduleSpans.entries()) {
					if (importer?.startsWith(importerPath) || id.includes(importerPath)) {
						parentContext = spanData.context;
						break;
					}
				}

				// Execute span creation within parent context if available
				const executeInContext = async (): Promise<string> => {
					return tracer.startActiveSpan('zone5.load', async (span: Span) => {
						try {
							span.setAttributes({
								'zone5.id': id,
								'zone5.pathname': srcURL.pathname,
							});

							const featureFile = await processor({
								...zone5Config,
								sourceFile: srcURL.pathname,
							});

							const item: ItemFeature = JSON.parse(
								await readFile(featureFile, { encoding: 'utf-8' }),
							);

							item.assets.forEach((asset) => {
								asset.href = join(basePath, asset.href);
							});

							span.setStatus({ code: SpanStatusCode.OK });
							return dataToEsm(item, {
								namedExports: true,
								compact: viteConfig.build.minify !== false,
								preferConst: true,
							});
						} catch (error) {
							span.setStatus({
								code: SpanStatusCode.ERROR,
								message: error instanceof Error ? error.message : String(error),
							});
							span.recordException(error instanceof Error ? error : new Error(String(error)));
							console.error(`can not find zone5 data for ${id}`);
							throw error;
						} finally {
							span.end();
						}
					});
				};

				return parentContext ? context.with(parentContext, executeInContext) : executeInContext();
			}
		},

		configureServer(server) {
			server.middlewares.use(serve(basePath, zone5Config.base.cache));
		},

		configurePreviewServer(server) {
			server.middlewares.use(serve(basePath, zone5Config.base.cache));
		},

		buildEnd() {
			// Close all open parent spans and clean up
			for (const [, spanData] of moduleSpans.entries()) {
				spanData.span.end();
			}
			moduleSpans.clear();
		},

		async writeBundle() {
			if (viteConfig.command === 'build') {
				return tracer.startActiveSpan('zone5.writeBundle', async (span) => {
					try {
						const outDir = viteConfig.build.outDir;
						const targetDir = join(outDir, zone5Config.base.namespace);

						span.setAttributes({
							'zone5.outDir': outDir,
							'zone5.targetDir': targetDir,
							'zone5.namespace': zone5Config.base.namespace,
						});

						await cp(zone5Config.base.cache, targetDir, { recursive: true });
						console.log(`Copied Zone5 cache to ${targetDir}`);

						span.setStatus({ code: SpanStatusCode.OK });
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
		},
	};
}
