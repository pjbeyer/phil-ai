import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import type { z } from "zod";
import { withFileLock, type LockOptions } from "./lock.js";

export interface JsonReadOptions extends LockOptions {
	useLock?: boolean;
}

export interface JsonWriteOptions extends LockOptions {
	useLock?: boolean;
	pretty?: boolean;
}

export async function readJson<T>(
	filePath: string,
	schema: z.ZodType<T>,
	options: JsonReadOptions = {},
): Promise<T | null> {
	if (!existsSync(filePath)) {
		return null;
	}

	const { useLock = true, ...lockOptions } = options;

	const read = async () => {
		const content = await readFile(filePath, "utf-8");
		const data = JSON.parse(content);
		return schema.parse(data);
	};

	if (useLock) {
		return withFileLock(filePath, read, lockOptions);
	}
	return read();
}

export async function writeJson<T>(
	filePath: string,
	data: T,
	schema: z.ZodType<T>,
	options: JsonWriteOptions = {},
): Promise<void> {
	const { useLock = true, pretty = true, ...lockOptions } = options;

	const validated = schema.parse(data);

	const write = async () => {
		const content = pretty
			? JSON.stringify(validated, null, 2)
			: JSON.stringify(validated);
		await writeFile(filePath, content, "utf-8");
	};

	if (useLock) {
		await withFileLock(filePath, write, lockOptions);
	} else {
		await write();
	}
}

export async function readJsonUnsafe<T>(filePath: string): Promise<T | null> {
	if (!existsSync(filePath)) {
		return null;
	}
	const content = await readFile(filePath, "utf-8");
	return JSON.parse(content) as T;
}
