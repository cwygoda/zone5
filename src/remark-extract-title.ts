import type { Heading, Root } from 'mdast';
import { toString } from 'mdast-util-to-string';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';

/**
 * Remark plugin to extract the first h1 heading as the page title
 * and add it to mdsvex frontmatter
 */
export const remarkExtractTitle: Plugin = () => {
	return (tree, file): void => {
		const rootTree = tree as Root;
		let title: string | undefined;

		// Find the first h1 heading
		visit(rootTree, 'heading', (node: Heading) => {
			if (node.depth === 1 && !title) {
				title = toString(node);
				return false; // Stop visiting
			}
		});

		// Add title to frontmatter
		if (title) {
			if (!file.data.fm) {
				file.data.fm = {};
			}
			(file.data.fm as Record<string, unknown>).title = title;
		}
	};
};
