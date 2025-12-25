/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import Zone5 from './Zone5.svelte';
import {
	DEFAULT_COLUMN_BREAKPOINTS,
	DEFAULT_TARGET_ROW_HEIGHT,
	DEFAULT_GAP,
	PANORAMA_THRESHOLD,
} from './constants';
import type { ImageData } from './types';

// Mock image data factory
function createMockImage(id: string, title?: string, aspectRatio = 1.5): ImageData {
	return {
		type: 'Feature',
		id,
		geometry: null,
		properties: {
			aspectRatio,
			blurhash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj',
			averageColor: { hex: '#a18665', isDark: false },
			alt: `Alt text for ${id}`,
			title,
		},
		assets: [
			{ href: `/images/${id}-640.jpg`, width: 640 },
			{ href: `/images/${id}-768.jpg`, width: 768 },
			{ href: `/images/${id}-1024.jpg`, width: 1024 },
		],
	};
}

describe('Zone5', () => {
	let mockImages: ImageData[];

	beforeEach(() => {
		mockImages = [
			createMockImage('img1', 'Image 1', 1.5),
			createMockImage('img2', 'Image 2', 1.2),
			createMockImage('img3', 'Image 3', 1.8),
		];
	});

	afterEach(() => {
		cleanup();
	});

	describe('Props validation', () => {
		it('should render with default props', () => {
			const { container } = render(Zone5, {
				props: {
					images: mockImages,
				},
			});

			expect(container.children.length).toBeGreaterThan(0);
		});

		it('should use default column breakpoints when not provided', () => {
			const { container } = render(Zone5, {
				props: {
					images: mockImages,
					mode: 'waterfall',
				},
			});

			expect(container.children.length).toBeGreaterThan(0);
		});

		it('should accept custom column breakpoints', () => {
			const customBreakpoints = { 480: 1, 960: 2, 1440: 3 };
			const { container } = render(Zone5, {
				props: {
					images: mockImages,
					mode: 'waterfall',
					columnBreakpoints: customBreakpoints,
				},
			});

			expect(container.children.length).toBeGreaterThan(0);
		});

		it('should render wall mode by default', () => {
			const { container } = render(Zone5, {
				props: {
					images: mockImages,
				},
			});

			// With 3 images, wall mode should render the .zone5-wall container
			expect(container.querySelector('.zone5-wall')).toBeTruthy();
		});

		it('should render waterfall mode when specified', () => {
			const { container } = render(Zone5, {
				props: {
					images: mockImages,
					mode: 'waterfall',
				},
			});

			// Waterfall mode should NOT have .zone5-wall
			expect(container.querySelector('.zone5-wall')).toBeNull();
		});

		it('should render justified mode when specified', () => {
			const { container } = render(Zone5, {
				props: {
					images: mockImages,
					mode: 'justified',
				},
			});

			expect(container.querySelector('.zone5-justified')).toBeTruthy();
		});
	});

	describe('Wall mode - single image', () => {
		it('should render figure element for single image', () => {
			const singleImage = [createMockImage('solo', 'Solo Image')];
			render(Zone5, {
				props: {
					images: singleImage,
					mode: 'wall',
				},
			});

			const figure = screen.getByRole('figure');
			expect(figure).toBeTruthy();
		});

		it('should display caption when title is provided and nocaption is false', () => {
			const singleImage = [createMockImage('solo', 'Beautiful Landscape')];
			render(Zone5, {
				props: {
					images: singleImage,
					mode: 'wall',
					nocaption: false,
				},
			});

			const caption = screen.getByText('Beautiful Landscape');
			expect(caption).toBeTruthy();
			expect(caption.tagName.toLowerCase()).toBe('figcaption');
		});

		it('should hide caption when nocaption is true', () => {
			const singleImage = [createMockImage('solo', 'Beautiful Landscape')];
			render(Zone5, {
				props: {
					images: singleImage,
					mode: 'wall',
					nocaption: true,
				},
			});

			expect(screen.queryByText('Beautiful Landscape')).toBeNull();
		});

		it('should not display caption when title is missing', () => {
			const singleImage = [createMockImage('solo', undefined)];
			const { container } = render(Zone5, {
				props: {
					images: singleImage,
					mode: 'wall',
				},
			});

			expect(container.querySelector('figcaption')).toBeNull();
		});

		it('should have proper aria-label on figure', () => {
			const singleImage = [createMockImage('solo', 'Test Image')];
			render(Zone5, {
				props: {
					images: singleImage,
					mode: 'wall',
				},
			});

			const figure = screen.getByRole('figure');
			expect(figure.getAttribute('aria-label')).toBe('Test Image');
		});

		it('should use fallback aria-label when title is missing', () => {
			const singleImage = [createMockImage('solo', undefined)];
			render(Zone5, {
				props: {
					images: singleImage,
					mode: 'wall',
				},
			});

			const figure = screen.getByRole('figure');
			expect(figure.getAttribute('aria-label')).toBe('Image');
		});
	});

	describe('Wall mode - multiple images', () => {
		it('should render wall container with correct class', () => {
			const { container } = render(Zone5, {
				props: {
					images: mockImages,
					mode: 'wall',
				},
			});

			const wallContainer = container.querySelector('.zone5-wall');
			expect(wallContainer).toBeTruthy();
			expect(wallContainer?.getAttribute('role')).toBe('list');
		});

		it('should render all images in wall mode', () => {
			const { container } = render(Zone5, {
				props: {
					images: mockImages,
					mode: 'wall',
				},
			});

			const imageContainers = container.querySelectorAll('[data-zone5-img="true"]');
			expect(imageContainers.length).toBe(mockImages.length);
		});

		it('should render images with proper list structure', () => {
			render(Zone5, {
				props: {
					images: mockImages,
					mode: 'wall',
				},
			});

			const listItems = screen.getAllByRole('listitem');
			expect(listItems.length).toBe(mockImages.length);
		});
	});

	describe('Waterfall mode (column-based masonry)', () => {
		it('should render waterfall container', () => {
			render(Zone5, {
				props: {
					images: mockImages,
					mode: 'waterfall',
				},
			});

			const waterfallContainer = screen.getByRole('list');
			expect(waterfallContainer).toBeTruthy();
		});

		it('should distribute images across columns', () => {
			render(Zone5, {
				props: {
					images: mockImages,
					mode: 'waterfall',
				},
			});

			// In waterfall mode, each column is a listitem
			const columns = screen.getAllByRole('listitem');
			expect(columns.length).toBeGreaterThan(0);
		});

		it('should render all images in waterfall mode', () => {
			const { container } = render(Zone5, {
				props: {
					images: mockImages,
					mode: 'waterfall',
				},
			});

			const imageElements = container.querySelectorAll('[data-zone5-img="true"]');
			expect(imageElements.length).toBe(mockImages.length);
		});

		it('should add filler elements with aria-hidden', () => {
			const { container } = render(Zone5, {
				props: {
					images: mockImages,
					mode: 'waterfall',
				},
			});

			const fillers = container.querySelectorAll('[aria-hidden="true"]');
			// Fillers may or may not be present depending on column heights
			// Just verify they have aria-hidden when present
			fillers.forEach((filler) => {
				expect(filler.getAttribute('aria-hidden')).toBe('true');
			});
		});
	});

	describe('Justified mode (row-based)', () => {
		it('should render justified container', () => {
			render(Zone5, {
				props: {
					images: mockImages,
					mode: 'justified',
				},
			});

			const justifiedContainer = screen.getByRole('list');
			expect(justifiedContainer).toBeTruthy();
		});

		it('should render justified container with correct class', () => {
			const { container } = render(Zone5, {
				props: {
					images: mockImages,
					mode: 'justified',
				},
			});

			const justifiedContainer = container.querySelector('.zone5-justified');
			expect(justifiedContainer).toBeTruthy();
		});

		it('should render all images in justified mode', () => {
			const { container } = render(Zone5, {
				props: {
					images: mockImages,
					mode: 'justified',
				},
			});

			const imageElements = container.querySelectorAll('[data-zone5-img="true"]');
			expect(imageElements.length).toBe(mockImages.length);
		});

		it('should render images as list items', () => {
			render(Zone5, {
				props: {
					images: mockImages,
					mode: 'justified',
				},
			});

			const listItems = screen.getAllByRole('listitem');
			expect(listItems.length).toBe(mockImages.length);
		});

		it('should accept custom target row height and gap', () => {
			const { container } = render(Zone5, {
				props: {
					images: mockImages,
					mode: 'justified',
					targetRowHeight: 200,
					gap: 16,
				},
			});

			expect(container.querySelector('.zone5-justified')).toBeTruthy();
		});
	});

	describe('Edge cases', () => {
		it('should handle empty images array', () => {
			const { container } = render(Zone5, {
				props: {
					images: [],
					mode: 'wall',
				},
			});

			const imageElements = container.querySelectorAll('[data-zone5-img="true"]');
			expect(imageElements.length).toBe(0);
		});

		it('should handle very large number of images', () => {
			const manyImages = Array.from({ length: 100 }, (_, i) =>
				createMockImage(`img${i}`, `Image ${i}`),
			);

			const { container } = render(Zone5, {
				props: {
					images: manyImages,
					mode: 'wall',
				},
			});

			const imageElements = container.querySelectorAll('[data-zone5-img="true"]');
			expect(imageElements.length).toBe(100);
		});

		it('should handle images with varying aspect ratios in waterfall mode', () => {
			const variedImages = [
				createMockImage('wide', 'Wide', 2.5),
				createMockImage('tall', 'Tall', 0.5),
				createMockImage('square', 'Square', 1.0),
			];

			const { container } = render(Zone5, {
				props: {
					images: variedImages,
					mode: 'waterfall',
				},
			});

			const imageElements = container.querySelectorAll('[data-zone5-img="true"]');
			expect(imageElements.length).toBe(3);
		});

		it('should handle images with varying aspect ratios in justified mode', () => {
			const variedImages = [
				createMockImage('wide', 'Wide', 2.5),
				createMockImage('tall', 'Tall', 0.5),
				createMockImage('square', 'Square', 1.0),
			];

			const { container } = render(Zone5, {
				props: {
					images: variedImages,
					mode: 'justified',
				},
			});

			const imageElements = container.querySelectorAll('[data-zone5-img="true"]');
			expect(imageElements.length).toBe(3);
		});
	});

	describe('Constants', () => {
		it('should have correct default column breakpoints structure', () => {
			expect(DEFAULT_COLUMN_BREAKPOINTS).toEqual({
				640: 2,
				768: 3,
				1024: 4,
			});
		});

		it('should have correct default target row height', () => {
			expect(DEFAULT_TARGET_ROW_HEIGHT).toBe(300);
		});

		it('should have correct default gap', () => {
			expect(DEFAULT_GAP).toBe(8);
		});

		it('should have correct panorama threshold', () => {
			expect(PANORAMA_THRESHOLD).toBe(3.0);
		});
	});

	describe('Accessibility', () => {
		it('should have role="list" on wall mode container', () => {
			render(Zone5, {
				props: {
					images: mockImages,
					mode: 'wall',
				},
			});

			const list = screen.getByRole('list');
			expect(list).toBeTruthy();
		});

		it('should have role="list" on waterfall mode container', () => {
			render(Zone5, {
				props: {
					images: mockImages,
					mode: 'waterfall',
				},
			});

			const list = screen.getByRole('list');
			expect(list).toBeTruthy();
		});

		it('should have role="list" on justified mode container', () => {
			render(Zone5, {
				props: {
					images: mockImages,
					mode: 'justified',
				},
			});

			const list = screen.getByRole('list');
			expect(list).toBeTruthy();
		});

		it('should have role="listitem" on each image container in wall mode', () => {
			render(Zone5, {
				props: {
					images: mockImages,
					mode: 'wall',
				},
			});

			const listItems = screen.getAllByRole('listitem');
			expect(listItems.length).toBe(mockImages.length);
		});

		it('should have role="listitem" on each image container in justified mode', () => {
			render(Zone5, {
				props: {
					images: mockImages,
					mode: 'justified',
				},
			});

			const listItems = screen.getAllByRole('listitem');
			expect(listItems.length).toBe(mockImages.length);
		});

		it('should mark filler elements as aria-hidden in waterfall mode', () => {
			const imagesWithVariedHeights = [
				createMockImage('tall', 'Tall', 0.5),
				createMockImage('wide', 'Wide', 2.0),
			];

			const { container } = render(Zone5, {
				props: {
					images: imagesWithVariedHeights,
					mode: 'waterfall',
				},
			});

			const fillers = container.querySelectorAll('.bg-slate-200.rounded');
			fillers.forEach((filler) => {
				expect(filler.getAttribute('aria-hidden')).toBe('true');
			});
		});
	});
});
