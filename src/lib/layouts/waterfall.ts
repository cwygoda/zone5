/**
 * Pure waterfall (masonry) layout calculation.
 *
 * This module contains no Svelte or DOM dependencies - just math.
 * Makes layout logic testable without mounting components.
 */

/**
 * Input: an item with aspect ratio and original index.
 */
export interface WaterfallItem {
	aspectRatio: number;
	index: number;
}

/**
 * Output: columns with items and optional filler heights.
 */
export interface WaterfallColumn {
	items: WaterfallItem[];
	fillerHeight: number;
}

/**
 * Configuration for waterfall layout calculation.
 */
export interface WaterfallLayoutOptions {
	containerWidth: number;
	columnBreakpoints: Record<number, number>;
}

/**
 * Calculate number of columns based on container width and breakpoints.
 *
 * @param containerWidth - Current container width in pixels
 * @param breakpoints - Map of min-width to column count
 * @returns Number of columns to use
 */
export function calculateColumnCount(
	containerWidth: number,
	breakpoints: Record<number, number>,
): number {
	let columns = 1;
	const sortedBreakpoints = Object.entries(breakpoints).sort(
		([a], [b]) => Number(a) - Number(b),
	);

	for (const [breakpoint, cols] of sortedBreakpoints) {
		if (containerWidth >= Number(breakpoint)) {
			columns = cols;
		}
	}

	return columns;
}

/**
 * Distribute items across columns in round-robin fashion.
 *
 * @param items - Array of items with aspect ratios
 * @param columnCount - Number of columns
 * @returns Array of columns with items and filler heights
 */
export function calculateWaterfallLayout(
	items: WaterfallItem[],
	columnCount: number,
): WaterfallColumn[] {
	if (items.length === 0 || columnCount <= 0) {
		return [];
	}

	// Distribute items round-robin across columns
	const columns: WaterfallItem[][] = Array.from({ length: columnCount }, () => []);
	items.forEach((item, idx) => {
		columns[idx % columnCount].push(item);
	});

	// Calculate relative heights (sum of 1/aspectRatio for each column)
	// This represents the height each column would be if all images had width=1
	const heights: number[] = [];
	let maxHeight = 0;

	for (const col of columns) {
		const height = col.reduce((sum, item) => sum + 1 / item.aspectRatio, 0);
		heights.push(height);
		if (height > maxHeight) {
			maxHeight = height;
		}
	}

	// Create result with filler heights to equalize columns
	return columns.map((items, idx) => ({
		items,
		fillerHeight: maxHeight - heights[idx],
	}));
}
