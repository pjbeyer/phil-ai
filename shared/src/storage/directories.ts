import { constants } from "node:fs";
import { access, mkdir, rm } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

export const DATA_DIR_NAME = "phil-ai";
export const CONFIG_DIR_NAME = "phil-ai";

export function getDataDir(): string {
	return join(homedir(), ".local", "share", DATA_DIR_NAME);
}

export function getConfigDir(): string {
	return join(homedir(), ".config", CONFIG_DIR_NAME);
}

export function getLockDir(): string {
	return join(getDataDir(), ".lock");
}

export interface DataPaths {
	root: string;
	index: string;
	learnings: string;
	patterns: string;
	version: string;
	lock: string;
}

export function getDataPaths(): DataPaths {
	const root = getDataDir();
	return {
		root,
		index: join(root, "index.json"),
		learnings: join(root, "learnings"),
		patterns: join(root, "patterns"),
		version: join(root, "version.json"),
		lock: join(root, ".lock"),
	};
}

export interface ConfigPaths {
	root: string;
	config: string;
	profiles: string;
	credentials: string;
}

export function getConfigPaths(): ConfigPaths {
	const root = getConfigDir();
	return {
		root,
		config: join(root, "config.yaml"),
		profiles: join(root, "profiles"),
		credentials: join(root, ".credentials"),
	};
}

export async function ensureDir(dirPath: string): Promise<void> {
	await mkdir(dirPath, { recursive: true });
}

export async function ensureDataDirs(): Promise<void> {
	const paths = getDataPaths();
	await ensureDir(paths.root);
	await ensureDir(paths.learnings);
	await ensureDir(paths.patterns);
	await ensureDir(paths.lock);

	for (const level of ["global", "profile", "project", "agent"]) {
		await ensureDir(join(paths.learnings, level));
	}
}

export async function ensureConfigDirs(): Promise<void> {
	const paths = getConfigPaths();
	await ensureDir(paths.root);
	await ensureDir(paths.profiles);
	await ensureDir(paths.credentials);
}

export async function ensureAllDirs(): Promise<void> {
	await ensureDataDirs();
	await ensureConfigDirs();
}

export async function dirExists(dirPath: string): Promise<boolean> {
	try {
		await access(dirPath, constants.F_OK);
		return true;
	} catch {
		return false;
	}
}

export async function isWritable(dirPath: string): Promise<boolean> {
	try {
		await access(dirPath, constants.W_OK);
		return true;
	} catch {
		return false;
	}
}

export async function cleanDataDir(): Promise<void> {
	const paths = getDataPaths();
	await rm(paths.root, { recursive: true, force: true });
}
