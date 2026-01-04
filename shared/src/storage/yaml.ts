import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import YAML from "yaml";
import type { z } from "zod";
import { withFileLock, type LockOptions } from "./lock.js";

export interface YamlReadOptions extends LockOptions {
	useLock?: boolean;
}

export interface YamlWriteOptions extends LockOptions {
	useLock?: boolean;
}

export async function readYaml<T>(
	filePath: string,
	schema: z.ZodType<T>,
	options: YamlReadOptions = {},
): Promise<T | null> {
	if (!existsSync(filePath)) {
		return null;
	}

	const { useLock = true, ...lockOptions } = options;

	const read = async () => {
		const content = await readFile(filePath, "utf-8");
		const data = YAML.parse(content);
		return schema.parse(data);
	};

	if (useLock) {
		return withFileLock(filePath, read, lockOptions);
	}
	return read();
}

export async function writeYaml<T>(
	filePath: string,
	data: T,
	schema: z.ZodType<T>,
	options: YamlWriteOptions = {},
): Promise<void> {
	const { useLock = true, ...lockOptions } = options;

	const validated = schema.parse(data);

	const write = async () => {
		const content = YAML.stringify(validated);
		await writeFile(filePath, content, "utf-8");
	};

	if (useLock) {
		await withFileLock(filePath, write, lockOptions);
	} else {
		await write();
	}
}

export async function readYamlUnsafe<T>(filePath: string): Promise<T | null> {
	if (!existsSync(filePath)) {
		return null;
	}
	const content = await readFile(filePath, "utf-8");
	return YAML.parse(content) as T;
}
