import { describe, it, expect } from 'vitest';
import {
	calculateWaterfallLayout,
	calculateColumnCount,
	type WaterfallItem,
} from './waterfall';

describe('calculateColumnCount', () => {
	const breakpoints = {
		640: 2,
		768: 3,
		1024: 4,
	};

	it('should return 1 column for width below all breakpoints', () => {
		expect(calculateColumnCount(500, breakpoints)).toBe(1);
	});

	it('should return correct columns for each breakpoint', () => {
		expect(calculateColumnCount(640, breakpoints)).toBe(2);
		expect(calculateColumnCount(700, breakpoints)).toBe(2);
		expect(calculateColumnCount(768, breakpoints)).toBe(3);
		expect(calculateColumnCount(900, breakpoints)).toBe(3);
		expect(calculateColumnCount(1024, breakpoints)).toBe(4);
		expect(calculateColumnCount(1200, breakpoints)).toBe(4);
	});

	it('should return 1 for empty breakpoints', () => {
		expect(calculateColumnCount(1000, {})).toBe(1);
	});
});

describe('calculateWaterfallLayout', () => {
	const createItem = (aspectRatio: number, index: number): WaterfallItem => ({
		aspectRatio,
		index,
	});

	it('should return empty array for empty input', () => {
		const result = calculateWaterfallLayout([], 3);
		expect(result).toEqual([]);
	});

	it('should return empty array for zero columns', () => {
		const items = [createItem(1.5, 0)];
		const result = calculateWaterfallLayout(items, 0);
		expect(result).toEqual([]);
	});

	it('should distribute items round-robin across columns', () => {
		const items = [
			createItem(1.5, 0),
			createItem(1.5, 1),
			createItem(1.5, 2),
			createItem(1.5, 3),
			createItem(1.5, 4),
			createItem(1.5, 5),
		];
		const result = calculateWaterfallLayout(items, 3);

		expect(result).toHaveLength(3);
		// Column 0: items 0, 3
		expect(result[0].items.map((i) => i.index)).toEqual([0, 3]);
		// Column 1: items 1, 4
		expect(result[1].items.map((i) => i.index)).toEqual([1, 4]);
		// Column 2: items 2, 5
		expect(result[2].items.map((i) => i.index)).toEqual([2, 5]);
	});

	it('should calculate filler heights to equalize columns', () => {
		// Two tall images (aspect ratio 0.5 = portrait) and one wide (2.0 = landscape)
		const items = [
			createItem(0.5, 0), // tall: height factor = 1/0.5 = 2
			createItem(2.0, 1), // wide: height factor = 1/2.0 = 0.5
			createItem(0.5, 2), // tall: height factor = 1/0.5 = 2
		];
		const result = calculateWaterfallLayout(items, 3);

		// Column 0: height = 2
		// Column 1: height = 0.5
		// Column 2: height = 2
		// Max height = 2
		// Filler for column 1 = 2 - 0.5 = 1.5
		expect(result[0].fillerHeight).toBe(0);
		expect(result[1].fillerHeight).toBe(1.5);
		expect(result[2].fillerHeight).toBe(0);
	});

	it('should handle single item in single column', () => {
		const items = [createItem(1.5, 0)];
		const result = calculateWaterfallLayout(items, 1);

		expect(result).toHaveLength(1);
		expect(result[0].items).toHaveLength(1);
		expect(result[0].fillerHeight).toBe(0);
	});

	it('should preserve original indices', () => {
		const items = [createItem(1.5, 0), createItem(1.2, 1), createItem(1.8, 2)];
		const result = calculateWaterfallLayout(items, 2);

		const allIndices = result.flatMap((col) => col.items.map((item) => item.index));
		expect(allIndices).toContain(0);
		expect(allIndices).toContain(1);
		expect(allIndices).toContain(2);
	});
});
