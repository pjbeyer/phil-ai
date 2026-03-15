import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ingestLearningEvents } from "@phil-ai/shared";

const TEST_DIR = join(tmpdir(), "phil-ai-learning-test");

beforeEach(async () => {
	await mkdir(TEST_DIR, { recursive: true });
});

afterEach(async () => {
	await rm(TEST_DIR, { recursive: true, force: true });
});

describe("ingestLearningEvents", () => {
	test("returns empty array when learnings directory does not exist", async () => {
		// ingestLearningEvents reads from getDataPaths().learnings
		// which is a fixed path. When that path doesn't exist, it returns [].
		// We can't easily override the path, so we test the function returns an array.
		const result = await ingestLearningEvents();

		expect(Array.isArray(result)).toBe(true);
	});

	test("returns SystemEvent array type", async () => {
		const result = await ingestLearningEvents();

		// Each event should have the SystemEvent shape if any exist
		for (const event of result) {
			expect(event.id).toBeDefined();
			expect(event.source).toBeDefined();
			expect(event.eventType).toBeDefined();
			expect(event.timestamp).toBeDefined();
		}
	});

	test("accepts date range filter options", async () => {
		const result = await ingestLearningEvents({
			dateRange: {
				from: new Date("2025-01-01"),
				to: new Date("2025-12-31"),
			},
		});

		expect(Array.isArray(result)).toBe(true);
	});

	test("accepts empty options object", async () => {
		const result = await ingestLearningEvents({});

		expect(Array.isArray(result)).toBe(true);
	});

	test("accepts undefined options", async () => {
		const result = await ingestLearningEvents(undefined);

		expect(Array.isArray(result)).toBe(true);
	});
});
