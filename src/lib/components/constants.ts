/**
 * Default column breakpoints for waterfall mode.
 * Maps viewport width (in pixels) to number of columns.
 */
export const DEFAULT_COLUMN_BREAKPOINTS = {
	640: 2, // sm: 2 columns
	768: 3, // md: 3 columns
	1024: 4, // lg: 4 columns
} as const;

/**
 * Default target row height for justified mode in pixels.
 */
export const DEFAULT_TARGET_ROW_HEIGHT = 300;

/**
 * Default gap between images in justified mode in pixels.
 */
export const DEFAULT_GAP = 8;

/**
 * Aspect ratio threshold for panoramic images.
 * Images with aspect ratio greater than this get their own row in justified mode.
 */
export const PANORAMA_THRESHOLD = 3.0;

/**
 * Height for single image in wall mode (Tailwind class)
 */
export const SINGLE_IMAGE_HEIGHT_CLASS = 'h-96';

/**
 * Height for multiple images in wall mode (Tailwind class)
 */
export const WALL_IMAGE_HEIGHT_CLASS = 'h-96';
