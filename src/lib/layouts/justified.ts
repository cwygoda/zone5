/**
 * Pure justified layout calculation.
 *
 * This module contains no Svelte or DOM dependencies - just math.
 * Makes layout logic testable without mounting components.
 */

/**
 * Input: an item with aspect ratio and original index.
 */
export interface JustifiedItem {
	aspectRatio: number;
	index: number;
}

/**
 * Output: a row with items positioned and sized.
 */
export interface JustifiedRow {
	items: JustifiedItem[];
	height: number;
}

/**
 * Configuration for justified layout calculation.
 */
export interface JustifiedLayoutOptions {
	containerWidth: number;
	targetRowHeight: number;
	gap: number;
	panoramaThreshold?: number;
}

const DEFAULT_PANORAMA_THRESHOLD = 3.0;

/**
 * Calculate the row height that makes all items fit the container width exactly.
 * Formula: h = (containerWidth - totalGaps) / sum(aspectRatios)
 */
function calculateRowHeight(items: JustifiedItem[], containerWidth: number, gap: number): number {
	const aspectRatioSum = items.reduce((sum, item) => sum + item.aspectRatio, 0);
	const totalGapWidth = (items.length - 1) * gap;
	const availableWidth = containerWidth - totalGapWidth;
	return availableWidth / aspectRatioSum;
}

/**
 * Calculate justified layout rows using a greedy algorithm.
 *
 * Images are added to rows until the row height drops to or below the target height.
 * Panoramic images (aspect ratio > threshold) get their own row.
 *
 * @param items - Array of items with aspect ratios
 * @param options - Layout configuration
 * @returns Array of rows with calculated heights
 */
export function calculateJustifiedLayout(
	items: JustifiedItem[],
	options: JustifiedLayoutOptions,
): JustifiedRow[] {
	const {
		containerWidth,
		targetRowHeight,
		gap,
		panoramaThreshold = DEFAULT_PANORAMA_THRESHOLD,
	} = options;

	if (items.length === 0 || containerWidth <= 0) {
		return [];
	}

	const result: JustifiedRow[] = [];
	let currentRow: JustifiedItem[] = [];

	for (const item of items) {
		const { aspectRatio } = item;

		// Handle panoramas: if we have items in the current row, finalize it first
		if (aspectRatio > panoramaThreshold && currentRow.length > 0) {
			result.push({
				items: [...currentRow],
				height: calculateRowHeight(currentRow, containerWidth, gap),
			});
			currentRow = [];
		}

		currentRow.push(item);

		// Panorama gets its own row with height capped at target
		if (aspectRatio > panoramaThreshold) {
			const panoramaHeight = Math.min(containerWidth / aspectRatio, targetRowHeight);
			result.push({
				items: [...currentRow],
				height: panoramaHeight,
			});
			currentRow = [];
			continue;
		}

		const rowHeight = calculateRowHeight(currentRow, containerWidth, gap);

		// If row height is at or below target, finalize this row
		if (rowHeight <= targetRowHeight) {
			result.push({
				items: [...currentRow],
				height: rowHeight,
			});
			currentRow = [];
		}
	}

	// Handle last row: left-align by capping height at target
	if (currentRow.length > 0) {
		const calculatedHeight = calculateRowHeight(currentRow, containerWidth, gap);
		result.push({
			items: currentRow,
			height: Math.min(calculatedHeight, targetRowHeight),
		});
	}

	return result;
}

/**
 * Calculate the width of an item in a justified row.
 */
export function calculateItemWidth(aspectRatio: number, rowHeight: number): number {
	return rowHeight * aspectRatio;
}
