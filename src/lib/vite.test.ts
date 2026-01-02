import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// Test the path traversal prevention logic
describe('vite serve path validation', () => {
	const isPathWithinDir = (cacheDir: string, requestedPath: string): boolean => {
		const src = resolve(cacheDir, requestedPath);
		const normalizedCacheDir = resolve(cacheDir);
		return src.startsWith(normalizedCacheDir + '/') || src === normalizedCacheDir;
	};

	it('should allow paths within cache directory', () => {
		const cacheDir = '/project/.zone5';

		expect(isPathWithinDir(cacheDir, 'abc123-image-def456/image-800.jpg')).toBe(true);
		expect(isPathWithinDir(cacheDir, 'subfolder/image.jpg')).toBe(true);
		expect(isPathWithinDir(cacheDir, 'image.jpg')).toBe(true);
	});

	it('should block path traversal attempts with ../', () => {
		const cacheDir = '/project/.zone5';

		expect(isPathWithinDir(cacheDir, '../package.json')).toBe(false);
		expect(isPathWithinDir(cacheDir, '../../etc/passwd')).toBe(false);
		expect(isPathWithinDir(cacheDir, 'subfolder/../../secret.txt')).toBe(false);
	});

	it('should block absolute paths outside cache directory', () => {
		const cacheDir = '/project/.zone5';

		expect(isPathWithinDir(cacheDir, '/etc/passwd')).toBe(false);
		expect(isPathWithinDir(cacheDir, '/home/user/.ssh/id_rsa')).toBe(false);
	});

	it('should handle URL-encoded path traversal attempts', () => {
		const cacheDir = '/project/.zone5';

		// After decodeURIComponent, these would become path traversals
		const decodedPath1 = decodeURIComponent('..%2F..%2Fetc%2Fpasswd');
		const decodedPath2 = decodeURIComponent('..%252F..%252Fetc%252Fpasswd');

		expect(isPathWithinDir(cacheDir, decodedPath1)).toBe(false);
		// Double-encoded stays encoded after single decode
		expect(isPathWithinDir(cacheDir, decodedPath2)).toBe(true); // This is fine, it's literally "..%2F"
	});

	it('should handle edge cases', () => {
		const cacheDir = '/project/.zone5';

		// Empty path should resolve to cache dir itself
		expect(isPathWithinDir(cacheDir, '')).toBe(true);

		// Path with . (current directory) should be fine
		expect(isPathWithinDir(cacheDir, './image.jpg')).toBe(true);

		// Tricky paths that look like traversals but aren't
		expect(isPathWithinDir(cacheDir, '...image.jpg')).toBe(true);
		expect(isPathWithinDir(cacheDir, '..image.jpg')).toBe(true);
	});

	it('should handle cache directory without trailing slash', () => {
		const cacheDir = '/project/.zone5';

		// Make sure we don't accidentally allow /project/.zone5-evil/
		const maliciousPath = '../.zone5-evil/malicious.jpg';
		expect(isPathWithinDir(cacheDir, maliciousPath)).toBe(false);
	});
});
