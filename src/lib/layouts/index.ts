/**
 * Pure layout calculation functions.
 *
 * These modules contain no Svelte or DOM dependencies - just math.
 * Benefits:
 * - Testable without mounting components
 * - Can run in workers for large galleries
 * - Reusable across frameworks (if ever needed)
 */

export {
	calculateJustifiedLayout,
	calculateItemWidth,
	type JustifiedItem,
	type JustifiedRow,
	type JustifiedLayoutOptions,
} from './justified.js';

export {
	calculateWaterfallLayout,
	calculateColumnCount,
	type WaterfallItem,
	type WaterfallColumn,
	type WaterfallLayoutOptions,
} from './waterfall.js';
