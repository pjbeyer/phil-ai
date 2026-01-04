import lockfile from "proper-lockfile";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";

export interface LockOptions {
	retries?: number;
	retryDelay?: number;
	stale?: number;
}

const DEFAULT_LOCK_OPTIONS: LockOptions = {
	retries: 5,
	retryDelay: 100,
	stale: 10000,
};

export async function withFileLock<T>(
	filePath: string,
	fn: () => Promise<T>,
	options: LockOptions = {},
): Promise<T> {
	const opts = { ...DEFAULT_LOCK_OPTIONS, ...options };
	const dir = dirname(filePath);

	await mkdir(dir, { recursive: true });

	const release = await lockfile.lock(filePath, {
		retries: {
			retries: opts.retries,
			minTimeout: opts.retryDelay,
			maxTimeout: opts.retryDelay! * 10,
		},
		stale: opts.stale,
		realpath: false,
	});

	try {
		return await fn();
	} finally {
		await release();
	}
}

export async function isLocked(filePath: string): Promise<boolean> {
	try {
		return await lockfile.check(filePath, { realpath: false });
	} catch {
		return false;
	}
}
