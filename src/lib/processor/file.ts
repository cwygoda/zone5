import { createHash } from 'crypto';
import { access, mkdir } from 'fs/promises';
import { relative } from 'path';

export const sourceFileHash = (sourceBaseDir: string, sourceFile: string) => {
	// Calculate relative path from source base dir
	const relativePath = relative(sourceBaseDir, sourceFile);

	// Generate SHAKE256 hash with length 8
	const hash = createHash('shake256', { outputLength: 8 });
	hash.update(relativePath);
	return hash.digest('hex');
};

export const ensureDirectoryExists = async (dirPath: string): Promise<void> => {
	// mkdir with recursive: true is idempotent - no need to check if dir exists first
	await mkdir(dirPath, { recursive: true });
};

export const fileExists = async (filePath: string): Promise<boolean> => {
	try {
		await access(filePath);
		return true;
	} catch {
		return false;
	}
};
