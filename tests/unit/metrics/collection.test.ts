import { describe, expect, test } from "bun:test";
import {
	calculateDurations,
	getAverageDuration,
	calculateVelocity,
	computeScorecard,
	type DurationResult,
	type SystemEvent,
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

function makeWorkflowEvent(
	eventType: "work_started" | "work_finished",
	issueId: string,
	branch: string,
	timestamp: string,
): SystemEvent {
	return {
		...makeEvent({ eventType, timestamp }),
		issueId,
		branch,
	} as SystemEvent;
}

describe("calculateDurations", () => {
	test("returns empty array for empty events", () => {
		const result = calculateDurations([]);
		expect(result).toEqual([]);
	});

	test("pairs work_started with work_finished by issueId::branch", () => {
		const events = [
			makeWorkflowEvent("work_started", "ISSUE-1", "feat/1", "2026-01-01T09:00:00.000Z"),
			makeWorkflowEvent("work_finished", "ISSUE-1", "feat/1", "2026-01-01T11:00:00.000Z"),
		];

		const result = calculateDurations(events);
		expect(result).toHaveLength(1);
		expect(result[0]!.issueId).toBe("ISSUE-1");
		expect(result[0]!.branch).toBe("feat/1");
		expect(result[0]!.durationHours).toBeCloseTo(2, 1);
		expect(result[0]!.completedAt).toBe("2026-01-01T11:00:00.000Z");
	});

	test("orphaned start events have null completedAt and durationHours", () => {
		const events = [
			makeWorkflowEvent("work_started", "ISSUE-2", "feat/2", "2026-01-01T09:00:00.000Z"),
		];

		const result = calculateDurations(events);
		expect(result).toHaveLength(1);
		expect(result[0]!.completedAt).toBeNull();
		expect(result[0]!.durationHours).toBeNull();
	});

	test("orphaned finish events are ignored", () => {
		const events = [
			makeWorkflowEvent("work_finished", "ISSUE-3", "feat/3", "2026-01-01T11:00:00.000Z"),
		];

		const result = calculateDurations(events);
		expect(result).toHaveLength(0);
	});

	test("FIFO pairing for multiple start/finish cycles on same key", () => {
		const events = [
			makeWorkflowEvent("work_started", "ISSUE-4", "feat/4", "2026-01-01T08:00:00.000Z"),
			makeWorkflowEvent("work_started", "ISSUE-4", "feat/4", "2026-01-01T09:00:00.000Z"),
			makeWorkflowEvent("work_finished", "ISSUE-4", "feat/4", "2026-01-01T10:00:00.000Z"),
			makeWorkflowEvent("work_finished", "ISSUE-4", "feat/4", "2026-01-01T12:00:00.000Z"),
		];

		const result = calculateDurations(events);
		const completed = result.filter((r) => r.durationHours !== null);
		expect(completed).toHaveLength(2);
		// First start (08:00) pairs with first finish (10:00) = 2h
		expect(completed[0]!.durationHours).toBeCloseTo(2, 1);
		// Second start (09:00) pairs with second finish (12:00) = 3h
		expect(completed[1]!.durationHours).toBeCloseTo(3, 1);
	});

	test("different issueId::branch keys are tracked independently", () => {
		const events = [
			makeWorkflowEvent("work_started", "A", "branch-a", "2026-01-01T08:00:00.000Z"),
			makeWorkflowEvent("work_started", "B", "branch-b", "2026-01-01T09:00:00.000Z"),
			makeWorkflowEvent("work_finished", "B", "branch-b", "2026-01-01T10:00:00.000Z"),
		];

		const result = calculateDurations(events);
		const completed = result.filter((r) => r.durationHours !== null);
		const orphaned = result.filter((r) => r.durationHours === null);
		expect(completed).toHaveLength(1);
		expect(completed[0]!.issueId).toBe("B");
		expect(orphaned).toHaveLength(1);
		expect(orphaned[0]!.issueId).toBe("A");
	});

	test("events without issueId or branch are filtered out", () => {
		const events = [
			makeEvent({ eventType: "work_started", timestamp: "2026-01-01T09:00:00.000Z" }),
			makeEvent({ eventType: "work_finished", timestamp: "2026-01-01T11:00:00.000Z" }),
		];

		const result = calculateDurations(events);
		expect(result).toHaveLength(0);
	});

	test("events are sorted by timestamp before pairing", () => {
		// Provide events out of order
		const events = [
			makeWorkflowEvent("work_finished", "X", "bx", "2026-01-01T12:00:00.000Z"),
			makeWorkflowEvent("work_started", "X", "bx", "2026-01-01T08:00:00.000Z"),
		];

		const result = calculateDurations(events);
		const completed = result.filter((r) => r.durationHours !== null);
		expect(completed).toHaveLength(1);
		expect(completed[0]!.durationHours).toBeCloseTo(4, 1);
	});
});

describe("getAverageDuration", () => {
	test("returns 0 for empty array", () => {
		expect(getAverageDuration([])).toBe(0);
	});

	test("returns 0 when all durations are null (orphaned)", () => {
		const results: DurationResult[] = [
			{ issueId: "A", branch: "b", startedAt: "2026-01-01T00:00:00.000Z", completedAt: null, durationHours: null },
			{ issueId: "B", branch: "b", startedAt: "2026-01-01T00:00:00.000Z", completedAt: null, durationHours: null },
		];
		expect(getAverageDuration(results)).toBe(0);
	});

	test("computes correct average for completed durations", () => {
		const results: DurationResult[] = [
			{ issueId: "A", branch: "b", startedAt: "2026-01-01T00:00:00.000Z", completedAt: "2026-01-01T02:00:00.000Z", durationHours: 2 },
			{ issueId: "B", branch: "b", startedAt: "2026-01-01T00:00:00.000Z", completedAt: "2026-01-01T04:00:00.000Z", durationHours: 4 },
		];
		expect(getAverageDuration(results)).toBe(3);
	});

	test("ignores null durations in average calculation", () => {
		const results: DurationResult[] = [
			{ issueId: "A", branch: "b", startedAt: "2026-01-01T00:00:00.000Z", completedAt: "2026-01-01T06:00:00.000Z", durationHours: 6 },
			{ issueId: "B", branch: "b", startedAt: "2026-01-01T00:00:00.000Z", completedAt: null, durationHours: null },
		];
		expect(getAverageDuration(results)).toBe(6);
	});
});

describe("calculateVelocity", () => {
	test("returns 0 for empty events", () => {
		const result = calculateVelocity([], { weeks: 4 });
		expect(result).toBe(0);
	});

	test("returns 0 when no work_finished events exist", () => {
		const events = [
			makeEvent({ eventType: "work_started", timestamp: new Date().toISOString() }),
		];
		const result = calculateVelocity(events, { weeks: 4 });
		expect(result).toBe(0);
	});

	test("counts work_finished events within window", () => {
		const now = Date.now();
		const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
		const events = [
			makeEvent({ eventType: "work_finished", timestamp: oneWeekAgo }),
			makeEvent({ eventType: "work_finished", timestamp: new Date(now - 1000).toISOString() }),
		];
		const result = calculateVelocity(events, { weeks: 4 });
		expect(result).toBe(2 / 4); // 2 events / 4 weeks
	});

	test("excludes events outside the window", () => {
		const now = Date.now();
		const fiveWeeksAgo = new Date(now - 5 * 7 * 24 * 60 * 60 * 1000).toISOString();
		const events = [
			makeEvent({ eventType: "work_finished", timestamp: fiveWeeksAgo }),
		];
		const result = calculateVelocity(events, { weeks: 4 });
		expect(result).toBe(0);
	});

	test("handles invalid window (0 weeks) by defaulting to 4", () => {
		const now = Date.now();
		const events = [
			makeEvent({ eventType: "work_finished", timestamp: new Date(now - 1000).toISOString() }),
		];
		const result = calculateVelocity(events, { weeks: 0 });
		expect(result).toBe(1 / 4);
	});

	test("handles negative window by defaulting to 4", () => {
		const now = Date.now();
		const events = [
			makeEvent({ eventType: "work_finished", timestamp: new Date(now - 1000).toISOString() }),
		];
		const result = calculateVelocity(events, { weeks: -1 });
		expect(result).toBe(1 / 4);
	});

	test("handles NaN window by defaulting to 4", () => {
		const now = Date.now();
		const events = [
			makeEvent({ eventType: "work_finished", timestamp: new Date(now - 1000).toISOString() }),
		];
		const result = calculateVelocity(events, { weeks: Number.NaN });
		expect(result).toBe(1 / 4);
	});
});

describe("computeScorecard", () => {
	test("returns valid scorecard with all dimensions", () => {
		const events = [
			makeEvent({ eventType: "work_finished", timestamp: "2026-01-01T09:00:00.000Z" }),
			makeEvent({ eventType: "work_finished", timestamp: "2026-01-02T09:00:00.000Z" }),
			makeEvent({ eventType: "work_finished", timestamp: "2026-01-03T09:00:00.000Z" }),
		];

		const result = computeScorecard(
			{ events, gatePassRate: 0.95, velocity: 5, avgDuration: 2.5 },
			"2026-01",
		);

		expect(result.dimensions.velocity).toBeDefined();
		expect(result.dimensions.quality).toBeDefined();
		expect(result.dimensions.consistency).toBeDefined();
		expect(result.average).toBeGreaterThan(0);
		expect(result.context).toBe("aggregate");
	});

	test("velocity score mapping", () => {
		const baseInput = { events: [], gatePassRate: 1, avgDuration: 1 };

		// velocity < 1 → score 1
		const r1 = computeScorecard({ ...baseInput, velocity: 0.5 }, "p");
		expect(r1.dimensions.velocity!.score).toBe(1);

		// velocity >= 6 → score 5
		const r5 = computeScorecard({ ...baseInput, velocity: 6 }, "p");
		expect(r5.dimensions.velocity!.score).toBe(5);
	});

	test("quality score mapping", () => {
		const baseInput = { events: [], velocity: 3, avgDuration: 1 };

		// gatePassRate < 0.6 → score 1
		const r1 = computeScorecard({ ...baseInput, gatePassRate: 0.5 }, "p");
		expect(r1.dimensions.quality!.score).toBe(1);

		// gatePassRate >= 0.9 → score 5
		const r5 = computeScorecard({ ...baseInput, gatePassRate: 0.95 }, "p");
		expect(r5.dimensions.quality!.score).toBe(5);
	});

	test("consistency score is 1 with fewer than 2 events", () => {
		const result = computeScorecard(
			{ events: [], gatePassRate: 1, velocity: 3, avgDuration: 1 },
			"p",
		);
		expect(result.dimensions.consistency!.score).toBe(1);
	});

	test("consistency score is high for evenly spaced events", () => {
		const events = Array.from({ length: 10 }, (_, i) =>
			makeEvent({
				eventType: "work_finished",
				timestamp: new Date(Date.UTC(2026, 0, i + 1, 9, 0, 0)).toISOString(),
			}),
		);

		const result = computeScorecard(
			{ events, gatePassRate: 1, velocity: 3, avgDuration: 1 },
			"p",
		);
		// Evenly spaced → low CV → high score
		expect(result.dimensions.consistency!.score).toBeGreaterThanOrEqual(4);
	});

	test("average is mean of dimension scores", () => {
		const result = computeScorecard(
			{ events: [], gatePassRate: 1, velocity: 3, avgDuration: 1 },
			"p",
		);

		const scores = Object.values(result.dimensions).map((d) => d.score);
		const expectedAvg = scores.reduce((s, v) => s + v, 0) / scores.length;
		expect(result.average).toBeCloseTo(expectedAvg, 5);
	});

	test("scorecard passes Zod validation (ScorecardEntrySchema.parse)", () => {
		// computeScorecard internally calls ScorecardEntrySchema.parse
		// so if it returns without throwing, validation passed
		expect(() =>
			computeScorecard(
				{ events: [], gatePassRate: 0, velocity: 0, avgDuration: 0 },
				"2026-01",
			),
		).not.toThrow();
	});
});
