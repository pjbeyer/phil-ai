import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	generateReview,
	trackImprovement,
	getImprovements,
	pruneStale,
	type SystemEvent,
	type GateEntry,
	type MetricsSnapshot,
} from "@phil-ai/shared";

function makeEvent(overrides: Partial<SystemEvent> & { eventType: string; timestamp: string }): SystemEvent {
	return {
		id: crypto.randomUUID(),
		source: "test",
		context: "work",
		role: "maintainer",
		...overrides,
	};
}

function makeGateEntry(overrides: Partial<GateEntry>): GateEntry {
	return {
		name: "test-gate",
		date: new Date().toISOString(),
		executedBy: "agent",
		result: "pass",
		reason: "test",
		sourceItemId: "item-1",
		sourceSystem: "test",
		context: "work",
		role: "maintainer",
		...overrides,
	};
}

function makeSnapshot(overrides: Partial<MetricsSnapshot>): MetricsSnapshot {
	return {
		period: "2026-01",
		context: "aggregate",
		velocity: 3,
		avgDuration: 2,
		gatePassRate: 0.9,
		activeItems: 5,
		completedItems: 10,
		...overrides,
	};
}

// ── generateReview ──────────────────────────────────────────────────

describe("generateReview", () => {
	test("returns review with wins, misses, and suggestions", async () => {
		const review = await generateReview("2026-01", {
			events: [],
			gateEntries: [],
			snapshots: [],
		});

		expect(review.period).toBe("2026-01");
		expect(review.generatedAt).toBeDefined();
		expect(review.wins.length).toBeGreaterThanOrEqual(1);
		expect(review.misses.length).toBeGreaterThanOrEqual(1);
		expect(review.suggestions.length).toBeGreaterThanOrEqual(1);
	});

	test("emits fallback win under sparse telemetry", async () => {
		const review = await generateReview("2026-01", {
			events: [],
			gateEntries: [],
			snapshots: [],
		});

		// With no velocity, no passing gates, no snapshots → fallback win
		const baselineWin = review.wins.find((w) => w.dimension === "baseline");
		expect(baselineWin).toBeDefined();
		expect(baselineWin!.description).toContain("Telemetry");
	});

	test("emits fallback miss under sparse telemetry", async () => {
		const review = await generateReview("2026-01", {
			events: [],
			gateEntries: [],
			snapshots: [],
		});

		const coverageMiss = review.misses.find((m) => m.dimension === "coverage");
		expect(coverageMiss).toBeDefined();
	});

	test("emits fallback suggestion under sparse telemetry", async () => {
		const review = await generateReview("2026-01", {
			events: [],
			gateEntries: [],
			snapshots: [],
		});

		// No quality misses, no velocity misses, no quality wins → fallback suggestion
		expect(review.suggestions[0]!.priority).toBe("low");
		expect(review.suggestions[0]!.action).toContain("experiment");
	});

	test("detects velocity win when work_finished events exist", async () => {
		const now = Date.now();
		const events = [
			makeEvent({ eventType: "work_finished", timestamp: new Date(now - 1000).toISOString() }),
			makeEvent({ eventType: "work_finished", timestamp: new Date(now - 2000).toISOString() }),
		];

		const review = await generateReview("2026-01", {
			events,
			gateEntries: [],
			snapshots: [],
		});

		const velocityWin = review.wins.find((w) => w.dimension === "velocity");
		expect(velocityWin).toBeDefined();
		expect(velocityWin!.evidence).toContain("items/week");
	});

	test("detects quality win when passing gates exist", async () => {
		const gateEntries = [
			makeGateEntry({ result: "pass", date: "2026-01-15T00:00:00.000Z" }),
			makeGateEntry({ result: "pass", date: "2026-01-16T00:00:00.000Z" }),
		];

		const review = await generateReview("2026-01", {
			events: [],
			gateEntries,
			snapshots: [],
		});

		const qualityWin = review.wins.find((w) => w.dimension === "quality");
		expect(qualityWin).toBeDefined();
		expect(qualityWin!.evidence).toContain("pass rate");
	});

	test("detects quality miss when gate failures exist", async () => {
		const gateEntries = [
			makeGateEntry({ result: "fail", date: "2026-01-15T00:00:00.000Z" }),
		];

		const review = await generateReview("2026-01", {
			events: [],
			gateEntries,
			snapshots: [],
		});

		const qualityMiss = review.misses.find((m) => m.dimension === "quality");
		expect(qualityMiss).toBeDefined();
		expect(qualityMiss!.evidence).toContain("failed gates");
	});

	test("suggests gate triage when quality miss exists", async () => {
		const gateEntries = [
			makeGateEntry({ result: "fail", date: "2026-01-15T00:00:00.000Z" }),
		];

		const review = await generateReview("2026-01", {
			events: [],
			gateEntries,
			snapshots: [],
		});

		expect(review.suggestions[0]!.priority).toBe("high");
		expect(review.suggestions[0]!.action).toContain("triage");
	});

	test("detects velocity miss when velocity declines across snapshots", async () => {
		const snapshots = [
			makeSnapshot({ period: "2026-01", velocity: 10 }),
			makeSnapshot({ period: "2026-02", velocity: 5 }),
		];

		const review = await generateReview("2026-01", {
			events: [],
			gateEntries: [],
			snapshots,
		});

		const velocityMiss = review.misses.find((m) => m.dimension === "velocity");
		expect(velocityMiss).toBeDefined();
	});

	test("detects delivery win from snapshots with completedItems", async () => {
		const snapshots = [
			makeSnapshot({ period: "2026-01", completedItems: 15 }),
		];

		const review = await generateReview("2026-01", {
			events: [],
			gateEntries: [],
			snapshots,
		});

		const deliveryWin = review.wins.find((w) => w.dimension === "delivery");
		expect(deliveryWin).toBeDefined();
		expect(deliveryWin!.evidence).toContain("15");
	});
});

// ── pruneStale ──────────────────────────────────────────────────────

describe("pruneStale", () => {
	test("returns empty staleItems when no data exists on disk", async () => {
		const result = await pruneStale(7);
		expect(result.staleItems).toEqual([]);
		expect(result.count).toBe(0);
	});

	test("handles invalid threshold by defaulting to 1 day", async () => {
		const result = await pruneStale(0);
		expect(result.count).toBe(0);
	});

	test("handles negative threshold by defaulting to 1 day", async () => {
		const result = await pruneStale(-5);
		expect(result.count).toBe(0);
	});

	test("handles NaN threshold by defaulting to 1 day", async () => {
		const result = await pruneStale(Number.NaN);
		expect(result.count).toBe(0);
	});
});

// ── trackImprovement / getImprovements ──────────────────────────────
// These require filesystem access via getDataPaths().verificationPdca
// We test them with the real XDG paths (they create files in ~/.local/share/phil-ai/)

describe("trackImprovement", () => {
	const TEST_DIR = join(tmpdir(), "phil-ai-pdca-test");

	beforeEach(async () => {
		await mkdir(TEST_DIR, { recursive: true });
	});

	afterEach(async () => {
		await rm(TEST_DIR, { recursive: true, force: true });
	});

	test("creates improvement with generated id and startedAt", async () => {
		const result = await trackImprovement({
			dimension: "quality",
			action: "Add pre-commit linting gate",
		});

		expect(result.id).toBeDefined();
		expect(result.dimension).toBe("quality");
		expect(result.action).toBe("Add pre-commit linting gate");
		expect(result.startedAt).toBeDefined();
		// outcome should not be present since we didn't provide it
		expect(result.outcome).toBeUndefined();
	});

	test("persists improvement and retrieves it", async () => {
		await trackImprovement({
			dimension: "velocity",
			action: "Break work into smaller slices",
		});

		const all = await getImprovements();
		expect(all.length).toBeGreaterThanOrEqual(1);

		const found = all.find((i) => i.action === "Break work into smaller slices");
		expect(found).toBeDefined();
		expect(found!.dimension).toBe("velocity");
	});

	test("includes outcome when provided", async () => {
		const result = await trackImprovement({
			dimension: "consistency",
			action: "Daily standup checklist",
			outcome: "Improved cadence by 20%",
		});

		expect(result.outcome).toBe("Improved cadence by 20%");
	});

	test("includes completedAt when provided", async () => {
		const completedAt = new Date().toISOString();
		const result = await trackImprovement({
			dimension: "quality",
			action: "Gate review",
			completedAt,
		});

		expect(result.completedAt).toBe(completedAt);
	});
});
