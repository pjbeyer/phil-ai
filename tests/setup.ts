import { beforeEach, afterEach } from "bun:test";
import { rm, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

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
