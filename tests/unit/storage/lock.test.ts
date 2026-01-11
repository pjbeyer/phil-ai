import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { isLocked, withFileLock } from "@phil-ai/shared/storage";

const TEST_DIR = join(tmpdir(), "phil-ai-lock-test");

beforeEach(async () => {
	await mkdir(TEST_DIR, { recursive: true });
});

afterEach(async () => {
	await rm(TEST_DIR, { recursive: true, force: true });
});

describe("withFileLock", () => {
	test("executes function with lock", async () => {
		const filePath = join(TEST_DIR, "test.json");
		await writeFile(filePath, "{}");

		let executed = false;
		await withFileLock(filePath, async () => {
			executed = true;
		});

		expect(executed).toBe(true);
	});

	test("returns function result", async () => {
		const filePath = join(TEST_DIR, "test.json");
		await writeFile(filePath, "{}");

		const result = await withFileLock(filePath, async () => {
			return 42;
		});

		expect(result).toBe(42);
	});

	test("creates parent directory if needed", async () => {
		const filePath = join(TEST_DIR, "nested", "dir", "test.json");

		await withFileLock(filePath, async () => {
			await writeFile(filePath, "{}");
		});

		const exists = await Bun.file(filePath).exists();
		expect(exists).toBe(true);
	});

	test("releases lock after completion", async () => {
		const filePath = join(TEST_DIR, "test.json");
		await writeFile(filePath, "{}");

		await withFileLock(filePath, async () => {});

		const locked = await isLocked(filePath);
		expect(locked).toBe(false);
	});

	test("releases lock on error", async () => {
		const filePath = join(TEST_DIR, "test.json");
		await writeFile(filePath, "{}");

		await withFileLock(filePath, async () => {
			throw new Error("test error");
		}).catch(() => {});

		const locked = await isLocked(filePath);
		expect(locked).toBe(false);
	});
});

describe("isLocked", () => {
	test("returns false for unlocked file", async () => {
		const filePath = join(TEST_DIR, "test.json");
		await writeFile(filePath, "{}");

		const locked = await isLocked(filePath);
		expect(locked).toBe(false);
	});

	test("returns false for non-existent file", async () => {
		const filePath = join(TEST_DIR, "nonexistent.json");

		const locked = await isLocked(filePath);
		expect(locked).toBe(false);
	});
});
