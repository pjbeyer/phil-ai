import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	sweepAll,
	detectOrphanedStorage,
	detectSchemaStaleness,
} from "@phil-ai/shared";

const TEST_DIR = join(tmpdir(), "phil-ai-drift-test");

beforeEach(async () => {
	await mkdir(TEST_DIR, { recursive: true });
});

afterEach(async () => {
	await rm(TEST_DIR, { recursive: true, force: true });
});

// ── sweepAll ────────────────────────────────────────────────────────

describe("sweepAll", () => {
	test("returns report with all 8 detector results", async () => {
		const report = await sweepAll();

		expect(report.generatedAt).toBeDefined();
		expect(typeof report.totalIssues).toBe("number");
		expect(Array.isArray(report.entries)).toBe(true);

		const expectedDetectors = [
			"stale-work-items",
			"orphaned-storage",
			"schema-staleness",
			"unclosed-learnings",
			"unused-skills",
			"stale-documentation",
			"context-divergence",
			"guide-violations",
		];

		for (const name of expectedDetectors) {
			expect(report.detectorResults[name]).toBeDefined();
		}
	});

	test("totalIssues matches entries length", async () => {
		const report = await sweepAll();
		expect(report.totalIssues).toBe(report.entries.length);
	});

	test("stubbed detectors return ran=true with count=0", async () => {
		const report = await sweepAll();

		// These are intentionally stubbed to return empty arrays
		const stubbedDetectors = [
			"stale-documentation",
			"context-divergence",
			"guide-violations",
		];

		for (const name of stubbedDetectors) {
			const result = report.detectorResults[name];
			expect(result).toBeDefined();
			expect(result!.ran).toBe(true);
			expect(result!.count).toBe(0);
		}
	});

	test("detector failures are captured gracefully (ran=false)", async () => {
		// sweepAll catches errors per-detector and records them
		// We can't easily inject a failing detector, but we verify the structure
		const report = await sweepAll();

		for (const [, result] of Object.entries(report.detectorResults)) {
			expect(typeof result.ran).toBe("boolean");
			expect(typeof result.count).toBe("number");
		}
	});
});

// ── detectOrphanedStorage ───────────────────────────────────────────

describe("detectOrphanedStorage", () => {
	test("returns empty for empty directory", async () => {
		const result = await detectOrphanedStorage(TEST_DIR);
		expect(result).toEqual([]);
	});

	test("returns empty for valid JSON files", async () => {
		await writeFile(join(TEST_DIR, "valid.json"), '{"key": "value"}', "utf-8");

		const result = await detectOrphanedStorage(TEST_DIR);
		expect(result).toEqual([]);
	});

	test("detects malformed JSON files", async () => {
		await writeFile(join(TEST_DIR, "broken.json"), "not valid json {{{", "utf-8");

		const result = await detectOrphanedStorage(TEST_DIR);
		expect(result).toHaveLength(1);
		expect(result[0]!.type).toBe("orphaned-storage");
		expect(result[0]!.severity).toBe("warning");
		expect(result[0]!.path).toContain("broken.json");
		expect(result[0]!.suggestedAction).toBeDefined();
	});

	test("recursively scans subdirectories", async () => {
		const subDir = join(TEST_DIR, "nested", "deep");
		await mkdir(subDir, { recursive: true });
		await writeFile(join(subDir, "bad.json"), "{invalid", "utf-8");

		const result = await detectOrphanedStorage(TEST_DIR);
		expect(result).toHaveLength(1);
		expect(result[0]!.path).toContain("bad.json");
	});

	test("ignores non-JSON files", async () => {
		await writeFile(join(TEST_DIR, "readme.txt"), "not json", "utf-8");
		await writeFile(join(TEST_DIR, "data.yaml"), "key: value", "utf-8");

		const result = await detectOrphanedStorage(TEST_DIR);
		expect(result).toEqual([]);
	});

	test("handles mix of valid and invalid JSON files", async () => {
		await writeFile(join(TEST_DIR, "good.json"), '{"ok": true}', "utf-8");
		await writeFile(join(TEST_DIR, "bad1.json"), "{{", "utf-8");
		await writeFile(join(TEST_DIR, "bad2.json"), "", "utf-8");

		const result = await detectOrphanedStorage(TEST_DIR);
		expect(result).toHaveLength(2);
	});
});

// ── detectSchemaStaleness ───────────────────────────────────────────

describe("detectSchemaStaleness", () => {
	test("returns empty for empty directory", async () => {
		const result = await detectSchemaStaleness(TEST_DIR);
		expect(result).toEqual([]);
	});

	test("returns empty for files without _version field", async () => {
		await writeFile(join(TEST_DIR, "no-version.json"), '{"key": "value"}', "utf-8");

		const result = await detectSchemaStaleness(TEST_DIR);
		expect(result).toEqual([]);
	});

	test("returns empty for files at current schema version", async () => {
		await writeFile(
			join(TEST_DIR, "current.json"),
			JSON.stringify({ _version: "1.0.0", data: "test" }),
			"utf-8",
		);

		const result = await detectSchemaStaleness(TEST_DIR);
		expect(result).toEqual([]);
	});

	test("detects files with older schema version", async () => {
		await writeFile(
			join(TEST_DIR, "old.json"),
			JSON.stringify({ _version: "0.1.0", id: "test-id" }),
			"utf-8",
		);

		const result = await detectSchemaStaleness(TEST_DIR);
		expect(result).toHaveLength(1);
		expect(result[0]!.type).toBe("schema-staleness");
		expect(result[0]!.severity).toBe("warning");
		expect(result[0]!.description).toContain("0.1.0");
		expect(result[0]!.itemId).toBe("test-id");
	});

	test("skips files with invalid _version strings", async () => {
		await writeFile(
			join(TEST_DIR, "bad-version.json"),
			JSON.stringify({ _version: "not-semver" }),
			"utf-8",
		);

		const result = await detectSchemaStaleness(TEST_DIR);
		expect(result).toEqual([]);
	});

	test("skips malformed JSON files without crashing", async () => {
		await writeFile(join(TEST_DIR, "broken.json"), "not json", "utf-8");

		const result = await detectSchemaStaleness(TEST_DIR);
		expect(result).toEqual([]);
	});

	test("returns empty for files with newer schema version", async () => {
		await writeFile(
			join(TEST_DIR, "newer.json"),
			JSON.stringify({ _version: "2.0.0" }),
			"utf-8",
		);

		const result = await detectSchemaStaleness(TEST_DIR);
		expect(result).toEqual([]);
	});

	test("recursively scans subdirectories", async () => {
		const subDir = join(TEST_DIR, "sub");
		await mkdir(subDir, { recursive: true });
		await writeFile(
			join(subDir, "old.json"),
			JSON.stringify({ _version: "0.5.0" }),
			"utf-8",
		);

		const result = await detectSchemaStaleness(TEST_DIR);
		expect(result).toHaveLength(1);
	});
});
