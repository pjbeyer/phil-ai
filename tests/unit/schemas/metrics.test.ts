import { describe, expect, test } from "bun:test";
import {
	MetricsSnapshotSchema,
	ScorecardDimensionSchema,
	ScorecardEntrySchema,
} from "@phil-ai/shared";

describe("ScorecardDimensionSchema", () => {
	test("validates correct scorecard dimension", () => {
		const dimension = {
			score: 4,
			evidence: "Consistent test coverage above 80%",
			trend: "up" as const,
		};
		expect(() => ScorecardDimensionSchema.parse(dimension)).not.toThrow();
	});

	test("validates dimension with minimum score", () => {
		const dimension = {
			score: 1,
			evidence: "Needs improvement",
			trend: "down" as const,
		};
		const result = ScorecardDimensionSchema.parse(dimension);
		expect(result.score).toBe(1);
	});

	test("validates dimension with maximum score", () => {
		const dimension = {
			score: 5,
			evidence: "Excellent performance",
			trend: "stable" as const,
		};
		const result = ScorecardDimensionSchema.parse(dimension);
		expect(result.score).toBe(5);
	});

	test("rejects score greater than 5", () => {
		const result = ScorecardDimensionSchema.safeParse({
			score: 6,
			evidence: "Too high",
			trend: "up",
		});
		expect(result.success).toBe(false);
	});

	test("rejects score less than 1", () => {
		const result = ScorecardDimensionSchema.safeParse({
			score: 0,
			evidence: "Too low",
			trend: "down",
		});
		expect(result.success).toBe(false);
	});

	test("rejects invalid trend enum", () => {
		const result = ScorecardDimensionSchema.safeParse({
			score: 3,
			evidence: "Test",
			trend: "sideways",
		});
		expect(result.success).toBe(false);
	});
});

describe("ScorecardEntrySchema", () => {
	test("validates scorecard entry with arbitrary dimension names", () => {
		const entry = {
			date: "2026-01-15T09:30:00.000Z",
			context: "work" as const,
			dimensions: {
				codeQuality: {
					score: 4,
					evidence: "Clean code",
					trend: "up" as const,
				},
				testCoverage: {
					score: 3,
					evidence: "Improving",
					trend: "stable" as const,
				},
			},
			average: 3.5,
		};
		expect(() => ScorecardEntrySchema.parse(entry)).not.toThrow();
	});

	test("validates scorecard entry with aggregate context", () => {
		const entry = {
			date: "2026-01-15T09:30:00.000Z",
			context: "aggregate" as const,
			dimensions: {
				overall: {
					score: 4,
					evidence: "Good overall",
					trend: "up" as const,
				},
			},
			average: 4,
			notes: "Monthly aggregate",
		};
		const result = ScorecardEntrySchema.parse(entry);
		expect(result.context).toBe("aggregate");
		expect(result.notes).toBe("Monthly aggregate");
	});

	test("validates scorecard entry without optional notes", () => {
		const entry = {
			date: "2026-01-15T09:30:00.000Z",
			context: "personal" as const,
			dimensions: {},
			average: 0,
		};
		expect(() => ScorecardEntrySchema.parse(entry)).not.toThrow();
	});

	test("rejects invalid context enum", () => {
		const result = ScorecardEntrySchema.safeParse({
			date: "2026-01-15T09:30:00.000Z",
			context: "invalid",
			dimensions: {},
			average: 0,
		});
		expect(result.success).toBe(false);
	});
});

describe("MetricsSnapshotSchema", () => {
	test("validates correct metrics snapshot", () => {
		const snapshot = {
			period: "2026-W03",
			context: "work" as const,
			velocity: 12.5,
			avgDuration: 3.2,
			gatePassRate: 0.85,
			activeItems: 5,
			completedItems: 8,
		};
		expect(() => MetricsSnapshotSchema.parse(snapshot)).not.toThrow();
	});

	test("validates snapshot with boundary gatePassRate values", () => {
		const snapshotZero = {
			period: "2026-W03",
			context: "oss" as const,
			velocity: 0,
			avgDuration: 0,
			gatePassRate: 0,
			activeItems: 0,
			completedItems: 0,
		};
		expect(() => MetricsSnapshotSchema.parse(snapshotZero)).not.toThrow();

		const snapshotOne = { ...snapshotZero, gatePassRate: 1 };
		expect(() => MetricsSnapshotSchema.parse(snapshotOne)).not.toThrow();
	});

	test("rejects gatePassRate greater than 1", () => {
		const result = MetricsSnapshotSchema.safeParse({
			period: "2026-W03",
			context: "work",
			velocity: 10,
			avgDuration: 2,
			gatePassRate: 1.5,
			activeItems: 3,
			completedItems: 5,
		});
		expect(result.success).toBe(false);
	});

	test("rejects gatePassRate less than 0", () => {
		const result = MetricsSnapshotSchema.safeParse({
			period: "2026-W03",
			context: "work",
			velocity: 10,
			avgDuration: 2,
			gatePassRate: -0.1,
			activeItems: 3,
			completedItems: 5,
		});
		expect(result.success).toBe(false);
	});

	test("rejects non-integer activeItems", () => {
		const result = MetricsSnapshotSchema.safeParse({
			period: "2026-W03",
			context: "work",
			velocity: 10,
			avgDuration: 2,
			gatePassRate: 0.5,
			activeItems: 3.5,
			completedItems: 5,
		});
		expect(result.success).toBe(false);
	});
});
