import { constants } from 'node:fs';
import { access, readdir, stat } from 'node:fs/promises';
import { extname, join } from 'node:path';

const IMAGE_EXTENSIONS = new Set([
	'.jpg',
	'.jpeg',
	'.png',
	'.webp',
	'.avif',
	'.gif',
	'.tiff',
	'.tif',
	'.heic',
	'.heif',
]);

export async function pathExists(path: string): Promise<boolean> {
	try {
		await access(path, constants.F_OK);
		return true;
	} catch {
		return false;
	}
}

export async function isDirectory(path: string): Promise<boolean> {
	try {
		const stats = await stat(path);
		return stats.isDirectory();
	} catch {
		return false;
	}
}

export function isImage(filename: string): boolean {
	const ext = extname(filename).toLowerCase();
	return IMAGE_EXTENSIONS.has(ext);
}

export async function findImages(directory: string): Promise<string[]> {
	const entries = await readdir(directory, { withFileTypes: true });
	const images: string[] = [];

	for (const entry of entries) {
		if (entry.isFile() && isImage(entry.name)) {
			images.push(entry.name);
		}
	}

	return images.sort();
}

export async function findImagesRecursive(
	directory: string,
	baseDir: string = directory,
): Promise<Array<{ path: string; relativePath: string }>> {
	const entries = await readdir(directory, { withFileTypes: true });
	const images: Array<{ path: string; relativePath: string }> = [];

	for (const entry of entries) {
		const fullPath = join(directory, entry.name);

		if (entry.isFile() && isImage(entry.name)) {
			const relativePath = fullPath.replace(baseDir + '/', '');
			images.push({ path: fullPath, relativePath });
		} else if (entry.isDirectory()) {
			const subImages = await findImagesRecursive(fullPath, baseDir);
			images.push(...subImages);
		}
	}

	return images.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}
