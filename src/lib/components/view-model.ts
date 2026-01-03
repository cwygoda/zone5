/**
 * View model layer for Zone5 components.
 *
 * This module provides a clean separation between the domain model (ItemFeature/ImageData)
 * and what UI components actually need. Benefits:
 * - Components don't break if ItemFeature structure changes
 * - Computed values (srcset, sizes) are centralized
 * - Easier to test UI logic without full domain objects
 */

import type { ImageData } from './types';

/**
 * What a single image needs for rendering in Zone5 components.
 */
export interface ImageViewModel {
	/** Unique identifier for the image */
	id: string;
	/** Aspect ratio (width / height) */
	aspectRatio: number;
	/** Alt text for accessibility */
	alt: string;
	/** Optional title/caption */
	title?: string;
	/** Placeholder styling during load */
	placeholder: {
		color: string;
		isDark: boolean;
		blurhash: string;
	};
	/** Responsive image sources */
	sources: {
		src: string;
		srcset: string;
		sizes: string;
		widths: number[];
	};
}

/**
 * Convert ImageData (domain model) to ImageViewModel (UI model).
 */
export function toViewModel(image: ImageData): ImageViewModel {
	const widths = image.assets.map((a) => a.width).sort((a, b) => a - b);
	const maxWidth = Math.max(...widths);

	return {
		id: image.id,
		aspectRatio: image.properties.aspectRatio,
		alt: image.properties.alt,
		title: image.properties.title,
		placeholder: {
			color: image.properties.averageColor.hex,
			isDark: image.properties.averageColor.isDark,
			blurhash: image.properties.blurhash,
		},
		sources: {
			src: image.assets[0].href,
			srcset: image.assets.map((asset) => `${asset.href} ${asset.width}w`).join(', '),
			sizes: computeSizes(maxWidth),
			widths,
		},
	};
}

/**
 * Convert an array of ImageData to ImageViewModels.
 */
export function toViewModels(images: ImageData[]): ImageViewModel[] {
	return images.map(toViewModel);
}

/**
 * Compute responsive sizes attribute based on max available width.
 */
function computeSizes(maxWidth: number): string {
	const breakpoints: string[] = [];

	if (maxWidth >= 1200) breakpoints.push('(min-width: 1200px) 1200px');
	if (maxWidth >= 768) breakpoints.push('(min-width: 768px) 768px');
	breakpoints.push(`${Math.min(maxWidth, 640)}px`);

	return breakpoints.join(', ');
}
