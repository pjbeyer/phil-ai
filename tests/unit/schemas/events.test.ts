import { describe, expect, test } from "bun:test";
import {
	ContributionEventSchema,
	DocEventSchema,
	LearningEventSchema,
	SystemEventSchema,
	WorkflowEventSchema,
	parseWorkflowJsonl,
} from "@phil-ai/shared";

const baseEvent = {
	id: "550e8400-e29b-41d4-a716-446655440000",
	source: "phil-ai-workflow",
	context: "work" as const,
	role: "maintainer" as const,
	eventType: "work_started",
	timestamp: "2026-01-15T09:30:00.000Z",
};

describe("SystemEventSchema", () => {
	test("validates correct system event", () => {
		expect(() => SystemEventSchema.parse(baseEvent)).not.toThrow();
	});

	test("validates system event with optional metadata", () => {
		const event = {
			...baseEvent,
			metadata: { key: "value", nested: { deep: true } },
		};
		expect(() => SystemEventSchema.parse(event)).not.toThrow();
	});

	test("rejects missing source field", () => {
		const { source: _, ...noSource } = baseEvent;
		const result = SystemEventSchema.safeParse(noSource);
		expect(result.success).toBe(false);
	});

	test("rejects invalid context enum value", () => {
		const result = SystemEventSchema.safeParse({
			...baseEvent,
			context: "invalid",
		});
		expect(result.success).toBe(false);
	});
});

describe("WorkflowEventSchema", () => {
	test("validates workflow event with workType", () => {
		const event = {
			...baseEvent,
			issueId: "SEC-2040",
			branch: "feature/SEC-2040",
			profile: "work",
			workType: "feature" as const,
		};
		expect(() => WorkflowEventSchema.parse(event)).not.toThrow();
	});

	test("validates workflow event without workType (optional)", () => {
		const event = {
			...baseEvent,
			eventType: "work_finished",
			issueId: "SEC-2040",
			branch: "feature/SEC-2040",
			profile: "work",
		};
		expect(() => WorkflowEventSchema.parse(event)).not.toThrow();
	});

	test("rejects workflow event with invalid context", () => {
		const result = WorkflowEventSchema.safeParse({
			...baseEvent,
			context: "invalid",
			issueId: "SEC-2040",
			branch: "feature/SEC-2040",
			profile: "work",
		});
		expect(result.success).toBe(false);
	});
});

describe("LearningEventSchema", () => {
	test("validates correct learning event", () => {
		const event = {
			...baseEvent,
			eventType: "learning_captured",
			learningId: "learn-001",
			action: "captured" as const,
			category: "testing",
		};
		expect(() => LearningEventSchema.parse(event)).not.toThrow();
	});
});

describe("ContributionEventSchema", () => {
	test("validates correct contribution event", () => {
		const event = {
			...baseEvent,
			eventType: "contribution",
			repo: "pjbeyer/phil-ai",
			contributionType: "pr" as const,
			externalId: "PR-42",
		};
		expect(() => ContributionEventSchema.parse(event)).not.toThrow();
	});
});

describe("DocEventSchema", () => {
	test("validates correct doc event", () => {
		const event = {
			...baseEvent,
			eventType: "doc_created",
			docPath: "/docs/guide.md",
			action: "created" as const,
			audience: "human" as const,
		};
		expect(() => DocEventSchema.parse(event)).not.toThrow();
	});
});

describe("parseWorkflowJsonl", () => {
	test("converts YYYY-MM-DD HH:MM:SS to ISO 8601", () => {
		const line = JSON.stringify({
			event: "work_started",
			profile: "work",
			date: "2025-12-01 09:31:36",
			issue: "SEC-2040",
			branch: "feature/SEC-2040",
			type: "feature",
		});

		const result = parseWorkflowJsonl(line);
		expect(result.timestamp).toBe("2025-12-01T09:31:36.000Z");
		expect(result.issueId).toBe("SEC-2040");
		expect(result.workType).toBe("feature");
	});

	test("parses event without optional type field", () => {
		const line = JSON.stringify({
			event: "work_finished",
			profile: "work",
			date: "2025-12-01 10:00:00",
			issue: "SEC-2040",
			branch: "feature/SEC-2040",
		});

		const result = parseWorkflowJsonl(line);
		expect(result.eventType).toBe("work_finished");
		expect(result.workType).toBeUndefined();
	});

	test("throws on malformed JSON", () => {
		expect(() => parseWorkflowJsonl("{invalid json")).toThrow();
	});

	test("throws on missing required fields", () => {
		const line = JSON.stringify({ event: "work_started" });
		expect(() => parseWorkflowJsonl(line)).toThrow();
	});
});
