import type { Image, Paragraph, Root, RootContent } from 'mdast';
import type { Directive, Property, SvelteComponent } from 'svast';
import { compile } from 'svast-stringify/dist/main.es.js';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';

import type { GalleryConfig } from './gallery/config.js';

type ImportMap = Record<string, string>;

interface ImageData {
	key: string;
	alt: string;
	title?: string;
}

/**
 * Options for the remarkZ5Images plugin
 */
export interface RemarkZ5ImagesOptions {
	/** Gallery configuration from .zone5.toml */
	gallery?: GalleryConfig;
}

/**
 * Convert svast svelteComponent node to HTML using svast-stringify
 */
function svelteComponentToHTML(node: SvelteComponent): string {
	return compile({
		type: 'root',
		children: [node],
	});
}

/**
 * Check if a paragraph is a newline (contains only whitespace)
 */
function isNewlineParagraph(node: RootContent): boolean {
	return (
		node.type === 'paragraph' &&
		node.children.length === 1 &&
		node.children[0].type === 'text' &&
		/^\s*$/.test(node.children[0].value)
	);
}

/**
 * Build the expression value for the images property
 */
function buildImagesExpression(imageData: ImageData[]): string {
	const imageExpressions = imageData.map(
		(img) =>
			`{...${img.key}, properties: {...${img.key}.properties, alt: ${JSON.stringify(img.alt)}, title: ${JSON.stringify(img.title)}}}`,
	);
	return '[' + imageExpressions.join(',') + ']';
}

/**
 * Resolved gallery options combining config defaults with frontmatter overrides
 */
interface ResolvedGalleryOptions {
	mode?: string;
	columnBreakpoints?: Record<number, number>;
	targetRowHeight?: number;
	gap?: number;
	panoramaThreshold?: number;
}

/**
 * Create a string property node
 */
function createStringProperty(name: string, value: string): Property {
	return {
		type: 'svelteProperty',
		name,
		shorthand: 'none',
		value: [{ type: 'text', value }],
		modifiers: [],
	};
}

/**
 * Create a numeric property node (as expression)
 */
function createNumberProperty(name: string, value: number): Property {
	return {
		type: 'svelteProperty',
		name,
		shorthand: 'none',
		value: [
			{
				type: 'svelteDynamicContent',
				expression: { type: 'svelteExpression', value: String(value) },
			},
		],
		modifiers: [],
	};
}

/**
 * Create an object property node (as expression)
 */
function createObjectProperty(name: string, value: Record<string, unknown>): Property {
	return {
		type: 'svelteProperty',
		name,
		shorthand: 'none',
		value: [
			{
				type: 'svelteDynamicContent',
				expression: { type: 'svelteExpression', value: JSON.stringify(value) },
			},
		],
		modifiers: [],
	};
}

/**
 * Create a Zone5 Svelte component node
 */
function createZone5Component(
	imageData: ImageData[],
	options: ResolvedGalleryOptions,
): SvelteComponent {
	const properties: (Property | Directive)[] = [
		{
			type: 'svelteProperty',
			name: 'images',
			shorthand: 'none',
			value: [
				{
					type: 'svelteDynamicContent',
					expression: {
						type: 'svelteExpression',
						value: buildImagesExpression(imageData),
					},
				},
			],
			modifiers: [],
		},
	];

	if (options.mode) {
		properties.push(createStringProperty('mode', options.mode));
	}

	if (options.columnBreakpoints) {
		properties.push(createObjectProperty('columnBreakpoints', options.columnBreakpoints));
	}

	if (options.targetRowHeight !== undefined) {
		properties.push(createNumberProperty('targetRowHeight', options.targetRowHeight));
	}

	if (options.gap !== undefined) {
		properties.push(createNumberProperty('gap', options.gap));
	}

	return {
		type: 'svelteComponent',
		tagName: 'Zone5',
		properties,
		selfClosing: true,
		children: [],
	};
}

/**
 * Collect image data from Z5 images
 */
function collectImageData(images: Image[], existingKeys: Set<string>): ImageData[] {
	return images.map((imageNode) => {
		const importKey = generateImportKey(imageNode.url, existingKeys);
		return {
			key: importKey,
			alt: imageNode.alt || '',
			title: imageNode.title || undefined,
		};
	});
}

/**
 * Validate and sanitize an image URL for safe use in import statements.
 * Prevents import path injection by ensuring URLs are valid relative paths.
 */
function validateImageUrl(url: string): boolean {
	// Remove the ?z5 suffix for validation
	const cleanUrl = url.replace(/\?z5$/, '');

	// Block URLs with protocol schemes (http:, https:, file:, data:, javascript:, etc.)
	if (cleanUrl.match(/^[a-zA-Z][a-zA-Z0-9+.-]*:/)) {
		return false;
	}

	// Block URLs with null bytes or other control characters (ASCII 0-31 and 127)
	// eslint-disable-next-line no-control-regex
	if (/[\x00-\x1f\x7f]/.test(cleanUrl)) {
		return false;
	}

	// Block URLs that could escape the import statement (quotes, backticks, newlines)
	if (cleanUrl.match(/['"`\n\r]/)) {
		return false;
	}

	return true;
}

/**
 * Generate a unique import key for an image URL
 */
function generateImportKey(url: string, existingKeys: Set<string>): string {
	const baseName =
		url
			.split('/')
			.pop()
			?.replace(/\?z5$/, '')
			.replace(/\.[^.]*$/, '')
			.replace(/[^a-zA-Z0-9]/g, '_')
			.replace(/^(\d)/, '_$1') || 'image';

	let key = baseName;
	let counter = 1;

	while (existingKeys.has(key)) {
		key = `${baseName}_${counter}`;
		counter++;
	}

	existingKeys.add(key);
	return key;
}

/**
 * Check if a node is a Zone5 image (ends with ?z5) with a valid URL
 */
function isZ5Image(node: RootContent): node is Image {
	if (node.type !== 'image' || typeof node.url !== 'string' || !node.url.endsWith('?z5')) {
		return false;
	}

	// Security: Validate URL to prevent import path injection
	if (!validateImageUrl(node.url)) {
		console.warn(`Zone5: Skipping image with invalid URL: ${node.url}`);
		return false;
	}

	return true;
}

/**
 * Check if a paragraph contains only a single Z5 image
 */
function isZ5ImageParagraph(node: RootContent): boolean {
	return node.type === 'paragraph' && node.children.length === 1 && isZ5Image(node.children[0]);
}

/**
 * Check if a paragraph contains multiple consecutive Z5 images
 */
function isMultiZ5ImageParagraph(node: RootContent): boolean {
	if (node.type !== 'paragraph') return false;

	const paragraph = node as Paragraph;
	const z5Images = paragraph.children.filter((child) => isZ5Image(child));
	return z5Images.length >= 2;
}

/**
 * Extract the image from a Z5 image paragraph
 */
function getImageFromParagraph(node: RootContent): Image | null {
	if (isZ5ImageParagraph(node) && node.type === 'paragraph') {
		return node.children[0] as Image;
	}
	return null;
}

/**
 * Find groups of consecutive Zone5 images
 */
function findConsecutiveImageGroups(children: RootContent[]): number[][] {
	const groups: number[][] = [];
	let currentGroup: number[] = [];

	for (let i = 0; i < children.length; i++) {
		const node = children[i];

		if (isZ5ImageParagraph(node)) {
			currentGroup.push(i);
		} else if (!isNewlineParagraph(node) && currentGroup.length > 0) {
			// End of consecutive group (non-newline, non-image node)
			if (currentGroup.length >= 2) {
				groups.push([...currentGroup]);
			}
			currentGroup = [];
		}
	}

	// Handle group at end of children
	if (currentGroup.length >= 2) {
		groups.push(currentGroup);
	}

	return groups;
}

/**
 * Create a script element with TypeScript imports
 */
function createScriptElement(importMap: ImportMap): { type: 'raw'; value: string } {
	const imports = Object.entries(importMap)
		.map(([key, url]) => `import ${key} from '${url}';`)
		.join('\n');

	// Use string concatenation to prevent the bundler from transforming the import path
	const zone5Import = 'import { Zone5 } from ' + '"zone5/components"';

	const lines = ['<script lang="ts">', zone5Import, imports, '</script>'];

	return {
		type: 'raw',
		value: lines.join('\n'),
	};
}

/**
 * Remark plugin to process Zone5 images
 *
 * @param options - Plugin options including gallery config from .zone5.toml
 */
export const remarkZ5Images: Plugin<[RemarkZ5ImagesOptions?]> = (options = {}) => {
	const galleryConfig = (options.gallery ?? {}) as GalleryConfig;

	return (tree, file): void => {
		const rootTree = tree as Root;
		const importMap: ImportMap = {};
		const existingKeys = new Set<string>();

		// Get frontmatter values (these override config)
		const fm = file.data.fm as Record<string, unknown> | undefined;
		const frontmatterMode = fm?.zone5mode as string | undefined;

		// Merge config with frontmatter (frontmatter takes precedence)
		const resolvedOptions: ResolvedGalleryOptions = {
			mode: frontmatterMode ?? galleryConfig.mode,
			columnBreakpoints: galleryConfig.columnBreakpoints,
			targetRowHeight: galleryConfig.targetRowHeight,
			gap: galleryConfig.gap,
			panoramaThreshold: galleryConfig.panoramaThreshold,
		};

		// First, collect all Z5 images for the import map
		visit(rootTree, 'image', (node) => {
			if (isZ5Image(node)) {
				const importKey = generateImportKey(node.url, existingKeys);
				importMap[importKey] = node.url;
			}
		});

		// Reset keys for consistent grouping
		existingKeys.clear();

		visit(rootTree, 'root', (node) => {
			// First, handle multi-image paragraphs (images on consecutive lines without blank lines)
			for (let i = node.children.length - 1; i >= 0; i--) {
				const child = node.children[i];
				if (isMultiZ5ImageParagraph(child) && child.type === 'paragraph') {
					const paragraph = child as Paragraph;
					const z5Images = paragraph.children.filter((ch) => isZ5Image(ch)) as Image[];
					const imageData = collectImageData(z5Images, existingKeys);
					const svelteComponent = createZone5Component(imageData, resolvedOptions);

					// Replace the multi-image paragraph with the svelte component
					node.children.splice(i, 1, svelteComponent as unknown as RootContent);
				}
			}

			// Then handle consecutive single-image paragraphs
			const groups = findConsecutiveImageGroups(node.children);

			// Process groups in reverse order to maintain correct indices
			for (let i = groups.length - 1; i >= 0; i--) {
				const group = groups[i];

				// Collect image nodes from the group
				const imageNodes = group
					.map((index) => getImageFromParagraph(node.children[index]))
					.filter((img): img is Image => img !== null);

				const imageData = collectImageData(imageNodes, existingKeys);
				const svelteComponent = createZone5Component(imageData, resolvedOptions);

				// Calculate how many nodes to remove (including newlines)
				const startIndex = group[0];
				const endIndex = group[group.length - 1];
				const removeCount = endIndex - startIndex + 1;

				// Count newline paragraphs between images
				let actualRemoveCount = removeCount;
				for (let j = startIndex + 1; j <= endIndex; j++) {
					if (isNewlineParagraph(node.children[j])) {
						actualRemoveCount++;
					}
				}

				node.children.splice(
					startIndex,
					actualRemoveCount,
					svelteComponent as unknown as RootContent,
				);
			}

			// Finally, handle remaining single Z5 images
			for (let i = node.children.length - 1; i >= 0; i--) {
				const child = node.children[i];
				if (isZ5ImageParagraph(child) && child.type === 'paragraph') {
					const imageNode = child.children[0] as Image;
					const imageData = collectImageData([imageNode], existingKeys);
					const svelteComponent = createZone5Component(imageData, resolvedOptions);

					// Replace the single image paragraph with the svelte component
					node.children.splice(i, 1, svelteComponent as unknown as RootContent);
				}
			}
		});

		// Store import map on the VFile's data
		if (!file.data) {
			file.data = {};
		}

		// Convert all svelteComponent nodes to HTML using svast-stringify
		visit(rootTree, 'svelteComponent', (node, index, parent) => {
			if (parent && typeof index === 'number') {
				// Convert the svelteComponent node to HTML using svast-stringify
				const componentHTML = svelteComponentToHTML(node as SvelteComponent);

				// Create an HTML node with the stringified component
				const htmlNode: import('mdast').Html = {
					type: 'html',
					value: componentHTML,
				};

				// Replace the svelteComponent node with the HTML node
				parent.children[index] = htmlNode;
			}
		});

		// add script tag at beginning of markdown
		if (Object.keys(importMap).length) {
			// TODO: use existing script tag if any
			const scriptNode = createScriptElement(importMap);
			rootTree.children.unshift(scriptNode as unknown as RootContent);
		}
	};
};
