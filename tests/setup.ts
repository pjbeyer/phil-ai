import { afterEach, beforeEach } from "bun:test";
import { mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const TEST_DIR = join(tmpdir(), "phil-ai-test");

beforeEach(async () => {
	await mkdir(TEST_DIR, { recursive: true });
});

afterEach(async () => {
	await rm(TEST_DIR, { recursive: true, force: true });
});

export function getTestPath(filename: string): string {
	return join(TEST_DIR, filename);
}
