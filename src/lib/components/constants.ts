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
 * Height for single image in wall mode (Tailwind class)
 */
export const SINGLE_IMAGE_HEIGHT_CLASS = 'h-96';

/**
 * Height for multiple images in wall mode (Tailwind class)
 */
export const WALL_IMAGE_HEIGHT_CLASS = 'h-96';
