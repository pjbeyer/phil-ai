import { describe, expect, test } from "bun:test";
import { parseWorkflowJsonl } from "@phil-ai/shared";

describe("parseWorkflowJsonl", () => {
	test("parses work_started event with real JSONL date format", () => {
		const line = JSON.stringify({
			event: "work_started",
			profile: "work",
			date: "2025-12-01 09:31:36",
			issue: "SEC-2040",
			branch: "feature/SEC-2040",
			type: "feature",
		});

		const result = parseWorkflowJsonl(line);

		expect(result.eventType).toBe("work_started");
		expect(result.issueId).toBe("SEC-2040");
		expect(result.branch).toBe("feature/SEC-2040");
		expect(result.profile).toBe("work");
		expect(result.workType).toBe("feature");
		expect(result.source).toBe("phil-ai-workflow");
		expect(result.context).toBe("work");
		expect(result.role).toBe("maintainer");
	});

	test("converts YYYY-MM-DD HH:MM:SS date to ISO 8601", () => {
		const line = JSON.stringify({
			event: "work_started",
			profile: "work",
			date: "2025-12-01 09:31:36",
			issue: "TEST-1",
			branch: "feature/TEST-1",
		});

		const result = parseWorkflowJsonl(line);

		// Should be converted to ISO 8601 format
		expect(result.timestamp).toBe("2025-12-01T09:31:36.000Z");
	});

	test("parses work_finished event without type field", () => {
		const line = JSON.stringify({
			event: "work_finished",
			profile: "work",
			date: "2025-12-01 10:45:22",
			issue: "SEC-2040",
			branch: "feature/SEC-2040",
			duration: 4426,
		});

		const result = parseWorkflowJsonl(line);

		expect(result.eventType).toBe("work_finished");
		expect(result.workType).toBeUndefined();
		expect(result.duration).toBe(4426);
	});

	test("generates a UUID id for each parsed event", () => {
		const line = JSON.stringify({
			event: "work_started",
			profile: "pjbeyer",
			date: "2025-11-15 14:00:00",
			issue: "FEAT-100",
			branch: "feature/FEAT-100",
			type: "bug",
		});

		const result = parseWorkflowJsonl(line);

		expect(result.id).toBeDefined();
		expect(result.id.length).toBe(36); // UUID format
	});

	test("throws on malformed JSON", () => {
		expect(() => parseWorkflowJsonl("{not valid json")).toThrow();
	});

	test("throws on missing required fields", () => {
		const line = JSON.stringify({
			event: "work_started",
			// missing profile, date, issue, branch
		});

		expect(() => parseWorkflowJsonl(line)).toThrow();
	});

	test("throws on invalid work type", () => {
		const line = JSON.stringify({
			event: "work_started",
			profile: "work",
			date: "2025-12-01 09:31:36",
			issue: "TEST-1",
			branch: "feature/TEST-1",
			type: "invalid_type",
		});

		expect(() => parseWorkflowJsonl(line)).toThrow();
	});

	test("parses event with chore work type", () => {
		const line = JSON.stringify({
			event: "work_started",
			profile: "work",
			date: "2025-06-15 08:00:00",
			issue: "CHORE-42",
			branch: "chore/CHORE-42",
			type: "chore",
		});

		const result = parseWorkflowJsonl(line);

		expect(result.workType).toBe("chore");
	});

	test("parses event with refactor work type", () => {
		const line = JSON.stringify({
			event: "work_started",
			profile: "pjbeyer",
			date: "2025-03-20 16:30:00",
			issue: "REF-7",
			branch: "refactor/REF-7",
			type: "refactor",
		});

		const result = parseWorkflowJsonl(line);

		expect(result.workType).toBe("refactor");
	});

	test("validates timestamp is ISO 8601 in output", () => {
		const line = JSON.stringify({
			event: "work_started",
			profile: "work",
			date: "2025-12-01 09:31:36",
			issue: "TEST-1",
			branch: "feature/TEST-1",
		});

		const result = parseWorkflowJsonl(line);

		// ISO 8601 format check
		expect(() => new Date(result.timestamp).toISOString()).not.toThrow();
		expect(result.timestamp).toMatch(
			/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
		);
	});
});
