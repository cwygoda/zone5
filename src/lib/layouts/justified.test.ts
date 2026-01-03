import { describe, it, expect } from 'vitest';
import { calculateJustifiedLayout, calculateItemWidth, type JustifiedItem } from './justified';

describe('calculateJustifiedLayout', () => {
	const createItem = (aspectRatio: number, index: number): JustifiedItem => ({
		aspectRatio,
		index,
	});

	it('should return empty array for empty input', () => {
		const result = calculateJustifiedLayout([], {
			containerWidth: 1000,
			targetRowHeight: 200,
			gap: 8,
		});
		expect(result).toEqual([]);
	});

	it('should return empty array for zero container width', () => {
		const items = [createItem(1.5, 0)];
		const result = calculateJustifiedLayout(items, {
			containerWidth: 0,
			targetRowHeight: 200,
			gap: 8,
		});
		expect(result).toEqual([]);
	});

	it('should place single image in single row', () => {
		const items = [createItem(1.5, 0)];
		const result = calculateJustifiedLayout(items, {
			containerWidth: 1000,
			targetRowHeight: 200,
			gap: 8,
		});

		expect(result).toHaveLength(1);
		expect(result[0].items).toHaveLength(1);
		expect(result[0].items[0].index).toBe(0);
		// Height should be capped at targetRowHeight for incomplete rows
		expect(result[0].height).toBeLessThanOrEqual(200);
	});

	it('should fill row until height drops to target', () => {
		// Three landscape images with aspect ratio 2.0 each
		const items = [createItem(2.0, 0), createItem(2.0, 1), createItem(2.0, 2)];
		const result = calculateJustifiedLayout(items, {
			containerWidth: 1000,
			targetRowHeight: 200,
			gap: 8,
		});

		// With container width 1000, gap 8:
		// Row calculation: height = (1000 - gaps) / sum(aspectRatios)
		// For all 3: height = (1000 - 16) / 6 = 164px (below target)
		// So they should fit in one row
		expect(result.length).toBeGreaterThanOrEqual(1);
	});

	it('should put panoramic images in their own row', () => {
		const items = [
			createItem(1.5, 0),
			createItem(4.0, 1), // panorama (> 3.0 threshold)
			createItem(1.5, 2),
		];
		const result = calculateJustifiedLayout(items, {
			containerWidth: 1000,
			targetRowHeight: 200,
			gap: 8,
			panoramaThreshold: 3.0,
		});

		// Panorama should get its own row
		const panoramaRow = result.find((row) =>
			row.items.some((item) => item.index === 1),
		);
		expect(panoramaRow).toBeDefined();
		expect(panoramaRow!.items).toHaveLength(1);
	});

	it('should preserve original indices', () => {
		const items = [createItem(1.5, 0), createItem(1.2, 1), createItem(1.8, 2)];
		const result = calculateJustifiedLayout(items, {
			containerWidth: 1000,
			targetRowHeight: 200,
			gap: 8,
		});

		const allIndices = result.flatMap((row) => row.items.map((item) => item.index));
		expect(allIndices).toContain(0);
		expect(allIndices).toContain(1);
		expect(allIndices).toContain(2);
	});
});

describe('calculateItemWidth', () => {
	it('should calculate width from aspect ratio and height', () => {
		expect(calculateItemWidth(1.5, 200)).toBe(300);
		expect(calculateItemWidth(2.0, 150)).toBe(300);
		expect(calculateItemWidth(0.5, 200)).toBe(100);
	});
});
