import { describe, expect, test } from "bun:test";
import {
	PatternEngine,
	detectRecurringGateFailures,
	detectVelocityAnomaly,
	detectTypeConcentration,
	detectDurationOutliers,
	detectBlockedAccumulation,
	type SystemEvent,
	type GateEntry,
	type MetricsSnapshot,
	type DurationResult,
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

// ── recurring-gate-failure ──────────────────────────────────────────

describe("detectRecurringGateFailures", () => {
	test("returns empty for empty entries", () => {
		expect(detectRecurringGateFailures([])).toEqual([]);
	});

	test("returns empty when fewer than 3 failures for any gate", () => {
		const entries = [
			makeGateEntry({ name: "g1", result: "fail", date: "2026-01-01T00:00:00.000Z" }),
			makeGateEntry({ name: "g1", result: "fail", date: "2026-01-02T00:00:00.000Z" }),
		];
		expect(detectRecurringGateFailures(entries)).toEqual([]);
	});

	test("detects 3+ failures within 30-day window", () => {
		const entries = [
			makeGateEntry({ name: "quality-check", result: "fail", date: "2026-01-01T00:00:00.000Z" }),
			makeGateEntry({ name: "quality-check", result: "fail", date: "2026-01-10T00:00:00.000Z" }),
			makeGateEntry({ name: "quality-check", result: "fail", date: "2026-01-20T00:00:00.000Z" }),
		];

		const result = detectRecurringGateFailures(entries);
		expect(result).toHaveLength(1);
		expect(result[0]!.type).toBe("recurring-gate-failure");
		expect(result[0]!.severity).toBe("critical");
		expect(result[0]!.description).toContain("quality-check");
	});

	test("ignores passing gates", () => {
		const entries = [
			makeGateEntry({ name: "g1", result: "pass", date: "2026-01-01T00:00:00.000Z" }),
			makeGateEntry({ name: "g1", result: "pass", date: "2026-01-10T00:00:00.000Z" }),
			makeGateEntry({ name: "g1", result: "pass", date: "2026-01-20T00:00:00.000Z" }),
		];
		expect(detectRecurringGateFailures(entries)).toEqual([]);
	});

	test("failures spread over >30 days do not trigger if no 3 within window", () => {
		const entries = [
			makeGateEntry({ name: "g1", result: "fail", date: "2026-01-01T00:00:00.000Z" }),
			makeGateEntry({ name: "g1", result: "fail", date: "2026-02-15T00:00:00.000Z" }),
			makeGateEntry({ name: "g1", result: "fail", date: "2026-04-01T00:00:00.000Z" }),
		];
		expect(detectRecurringGateFailures(entries)).toEqual([]);
	});
});

// ── velocity-anomaly ────────────────────────────────────────────────

describe("detectVelocityAnomaly", () => {
	test("returns empty for fewer than 2 snapshots", () => {
		expect(detectVelocityAnomaly([])).toEqual([]);
		expect(detectVelocityAnomaly([makeSnapshot({})])).toEqual([]);
	});

	test("detects >30% velocity drop between consecutive snapshots", () => {
		const snapshots = [
			makeSnapshot({ period: "2026-01", velocity: 10 }),
			makeSnapshot({ period: "2026-02", velocity: 5 }),
		];

		const result = detectVelocityAnomaly(snapshots);
		expect(result).toHaveLength(1);
		expect(result[0]!.type).toBe("velocity-anomaly");
		expect(result[0]!.severity).toBe("warning");
		expect(result[0]!.description).toContain("2026-01");
		expect(result[0]!.description).toContain("2026-02");
	});

	test("does not trigger for <=30% drop", () => {
		const snapshots = [
			makeSnapshot({ period: "2026-01", velocity: 10 }),
			makeSnapshot({ period: "2026-02", velocity: 7.5 }),
		];
		expect(detectVelocityAnomaly(snapshots)).toEqual([]);
	});

	test("does not trigger for velocity increase", () => {
		const snapshots = [
			makeSnapshot({ period: "2026-01", velocity: 5 }),
			makeSnapshot({ period: "2026-02", velocity: 10 }),
		];
		expect(detectVelocityAnomaly(snapshots)).toEqual([]);
	});

	test("skips comparison when previous velocity is 0", () => {
		const snapshots = [
			makeSnapshot({ period: "2026-01", velocity: 0 }),
			makeSnapshot({ period: "2026-02", velocity: 5 }),
		];
		expect(detectVelocityAnomaly(snapshots)).toEqual([]);
	});
});

// ── type-concentration ──────────────────────────────────────────────

describe("detectTypeConcentration", () => {
	test("returns empty for empty events", () => {
		expect(detectTypeConcentration([])).toEqual([]);
	});

	test("returns empty when no events have workType", () => {
		const events = [
			makeEvent({ eventType: "work_started", timestamp: "2026-01-01T00:00:00.000Z" }),
		];
		expect(detectTypeConcentration(events)).toEqual([]);
	});

	test("detects >80% concentration in one work type", () => {
		// 9 out of 10 are "bug" → 90%
		const events: SystemEvent[] = [];
		for (let i = 0; i < 9; i++) {
			events.push({
				...makeEvent({ eventType: "work_started", timestamp: `2026-01-0${i + 1}T00:00:00.000Z` }),
				workType: "bug",
			} as SystemEvent);
		}
		events.push({
			...makeEvent({ eventType: "work_started", timestamp: "2026-01-10T00:00:00.000Z" }),
			workType: "feature",
		} as SystemEvent);

		const result = detectTypeConcentration(events);
		expect(result).toHaveLength(1);
		expect(result[0]!.type).toBe("type-concentration");
		expect(result[0]!.severity).toBe("warning");
		expect(result[0]!.description).toContain("bug");
	});

	test("does not trigger at exactly 80%", () => {
		// 8 out of 10 = 80% → should NOT trigger (threshold is >80%)
		const events: SystemEvent[] = [];
		for (let i = 0; i < 8; i++) {
			events.push({
				...makeEvent({ eventType: "work_started", timestamp: `2026-01-0${i + 1}T00:00:00.000Z` }),
				workType: "bug",
			} as SystemEvent);
		}
		events.push({
			...makeEvent({ eventType: "work_started", timestamp: "2026-01-09T00:00:00.000Z" }),
			workType: "feature",
		} as SystemEvent);
		events.push({
			...makeEvent({ eventType: "work_started", timestamp: "2026-01-10T00:00:00.000Z" }),
			workType: "chore",
		} as SystemEvent);

		expect(detectTypeConcentration(events)).toEqual([]);
	});
});

// ── duration-outlier ────────────────────────────────────────────────

describe("detectDurationOutliers", () => {
	test("returns empty for empty durations", () => {
		expect(detectDurationOutliers([])).toEqual([]);
	});

	test("returns empty for fewer than 2 completed durations", () => {
		const durations: DurationResult[] = [
			{ issueId: "A", branch: "b", startedAt: "2026-01-01T00:00:00.000Z", completedAt: "2026-01-01T10:00:00.000Z", durationHours: 10 },
		];
		expect(detectDurationOutliers(durations)).toEqual([]);
	});

	test("detects outlier beyond mean + 2*stddev", () => {
		// Normal items: 2h, 2h, 2h, 2h, 2h, 2h, 2h, 2h → mean=2, stddev=0 won't work (stddev=0 returns empty)
		// Use slight variation: 2, 2.1, 1.9, 2.0 → mean≈2, stddev≈0.07, threshold≈2.14
		// Outlier: 50h → well above any threshold
		const durations: DurationResult[] = [
			{ issueId: "A", branch: "b", startedAt: "t", completedAt: "t", durationHours: 2 },
			{ issueId: "B", branch: "b", startedAt: "t", completedAt: "t", durationHours: 2.1 },
			{ issueId: "C", branch: "b", startedAt: "t", completedAt: "t", durationHours: 1.9 },
			{ issueId: "D", branch: "b", startedAt: "t", completedAt: "t", durationHours: 2.0 },
			{ issueId: "E", branch: "b", startedAt: "t", completedAt: "t", durationHours: 2.05 },
			{ issueId: "F", branch: "b", startedAt: "t", completedAt: "t", durationHours: 1.95 },
			{ issueId: "OUTLIER", branch: "b", startedAt: "t", completedAt: "t", durationHours: 50 },
		];

		const result = detectDurationOutliers(durations);
		expect(result.length).toBeGreaterThanOrEqual(1);
		expect(result.some((r) => r.description.includes("OUTLIER"))).toBe(true);
		expect(result[0]!.type).toBe("duration-outlier");
	});

	test("does not trigger when all durations are similar", () => {
		const durations: DurationResult[] = [
			{ issueId: "A", branch: "b", startedAt: "t", completedAt: "t", durationHours: 2 },
			{ issueId: "B", branch: "b", startedAt: "t", completedAt: "t", durationHours: 2.1 },
			{ issueId: "C", branch: "b", startedAt: "t", completedAt: "t", durationHours: 2.2 },
		];
		expect(detectDurationOutliers(durations)).toEqual([]);
	});

	test("ignores null durations", () => {
		const durations: DurationResult[] = [
			{ issueId: "A", branch: "b", startedAt: "t", completedAt: null, durationHours: null },
			{ issueId: "B", branch: "b", startedAt: "t", completedAt: null, durationHours: null },
		];
		expect(detectDurationOutliers(durations)).toEqual([]);
	});
});

// ── blocked-accumulation ────────────────────────────────────────────

describe("detectBlockedAccumulation", () => {
	test("returns empty for empty events", () => {
		expect(detectBlockedAccumulation([])).toEqual([]);
	});

	test("returns empty for fewer than 3 weeks of blocked events", () => {
		const events = [
			makeEvent({
				eventType: "blocked",
				timestamp: "2026-01-06T00:00:00.000Z",
				metadata: { blocked: true },
			}),
		];
		expect(detectBlockedAccumulation(events)).toEqual([]);
	});

	test("detects growing blocked counts across 3 consecutive weeks", () => {
		// Week 1 (Mon Jan 5): 1 blocked
		// Week 2 (Mon Jan 12): 2 blocked
		// Week 3 (Mon Jan 19): 3 blocked
		const events = [
			makeEvent({ eventType: "blocked", timestamp: "2026-01-06T00:00:00.000Z", metadata: { blocked: true } }),
			makeEvent({ eventType: "blocked", timestamp: "2026-01-12T00:00:00.000Z", metadata: { blocked: true } }),
			makeEvent({ eventType: "blocked", timestamp: "2026-01-13T00:00:00.000Z", metadata: { blocked: true } }),
			makeEvent({ eventType: "blocked", timestamp: "2026-01-19T00:00:00.000Z", metadata: { blocked: true } }),
			makeEvent({ eventType: "blocked", timestamp: "2026-01-20T00:00:00.000Z", metadata: { blocked: true } }),
			makeEvent({ eventType: "blocked", timestamp: "2026-01-21T00:00:00.000Z", metadata: { blocked: true } }),
		];

		const result = detectBlockedAccumulation(events);
		expect(result).toHaveLength(1);
		expect(result[0]!.type).toBe("blocked-accumulation");
		expect(result[0]!.severity).toBe("critical");
	});

	test("does not trigger when counts are not growing", () => {
		// 3 weeks but counts are flat (2, 2, 2)
		const events = [
			makeEvent({ eventType: "blocked", timestamp: "2026-01-06T00:00:00.000Z", metadata: { blocked: true } }),
			makeEvent({ eventType: "blocked", timestamp: "2026-01-07T00:00:00.000Z", metadata: { blocked: true } }),
			makeEvent({ eventType: "blocked", timestamp: "2026-01-13T00:00:00.000Z", metadata: { blocked: true } }),
			makeEvent({ eventType: "blocked", timestamp: "2026-01-14T00:00:00.000Z", metadata: { blocked: true } }),
			makeEvent({ eventType: "blocked", timestamp: "2026-01-20T00:00:00.000Z", metadata: { blocked: true } }),
			makeEvent({ eventType: "blocked", timestamp: "2026-01-21T00:00:00.000Z", metadata: { blocked: true } }),
		];

		expect(detectBlockedAccumulation(events)).toEqual([]);
	});

	test("recognizes blocked via metadata.status", () => {
		const events = [
			makeEvent({ eventType: "update", timestamp: "2026-01-06T00:00:00.000Z", metadata: { status: "blocked" } }),
			makeEvent({ eventType: "update", timestamp: "2026-01-13T00:00:00.000Z", metadata: { status: "blocked" } }),
			makeEvent({ eventType: "update", timestamp: "2026-01-14T00:00:00.000Z", metadata: { status: "blocked" } }),
			makeEvent({ eventType: "update", timestamp: "2026-01-20T00:00:00.000Z", metadata: { status: "blocked" } }),
			makeEvent({ eventType: "update", timestamp: "2026-01-21T00:00:00.000Z", metadata: { status: "blocked" } }),
			makeEvent({ eventType: "update", timestamp: "2026-01-22T00:00:00.000Z", metadata: { status: "blocked" } }),
		];

		const result = detectBlockedAccumulation(events);
		expect(result).toHaveLength(1);
	});
});

// ── PatternEngine ───────────────────────────────────────────────────

describe("PatternEngine", () => {
	test("analyze returns report with all detector results", async () => {
		const engine = new PatternEngine();
		const report = await engine.analyze({});

		expect(report.generatedAt).toBeDefined();
		expect(typeof report.totalPatterns).toBe("number");
		expect(Array.isArray(report.entries)).toBe(true);
		expect(report.detectorResults["recurring-gate-failure"]).toBeDefined();
		expect(report.detectorResults["velocity-anomaly"]).toBeDefined();
		expect(report.detectorResults["type-concentration"]).toBeDefined();
		expect(report.detectorResults["duration-outlier"]).toBeDefined();
		expect(report.detectorResults["blocked-accumulation"]).toBeDefined();
	});

	test("all detectors report ran=true with empty data", async () => {
		const engine = new PatternEngine();
		const report = await engine.analyze({});

		for (const [, result] of Object.entries(report.detectorResults)) {
			expect(result.ran).toBe(true);
			expect(result.count).toBe(0);
		}
	});

	test("totalPatterns matches entries length", async () => {
		const engine = new PatternEngine();
		const gateEntries = [
			makeGateEntry({ name: "g1", result: "fail", date: "2026-01-01T00:00:00.000Z" }),
			makeGateEntry({ name: "g1", result: "fail", date: "2026-01-10T00:00:00.000Z" }),
			makeGateEntry({ name: "g1", result: "fail", date: "2026-01-20T00:00:00.000Z" }),
		];

		const report = await engine.analyze({ gateEntries });
		expect(report.totalPatterns).toBe(report.entries.length);
	});
});
