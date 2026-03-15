import { describe, expect, test } from "bun:test";
import {
	GateDefinitionSchema,
	GateEntrySchema,
	GateLogIndexSchema,
} from "@phil-ai/shared";

const validGateEntry = {
	name: "pre-commit-lint",
	date: "2026-01-15T09:30:00.000Z",
	executedBy: "agent" as const,
	result: "pass" as const,
	reason: "All lint checks passed",
	sourceItemId: "SEC-2040",
	sourceSystem: "phil-ai-workflow",
	context: "work" as const,
	role: "maintainer" as const,
};

describe("GateEntrySchema", () => {
	test("validates gate entry with all required fields", () => {
		expect(() => GateEntrySchema.parse(validGateEntry)).not.toThrow();
	});

	test("validates gate entry with optional creditsUsed", () => {
		const entry = { ...validGateEntry, creditsUsed: 3 };
		const result = GateEntrySchema.parse(entry);
		expect(result.creditsUsed).toBe(3);
	});

	test("validates gate entry with fail result", () => {
		const entry = { ...validGateEntry, result: "fail" as const };
		expect(() => GateEntrySchema.parse(entry)).not.toThrow();
	});

	test("validates gate entry with blocked result", () => {
		const entry = { ...validGateEntry, result: "blocked" as const };
		expect(() => GateEntrySchema.parse(entry)).not.toThrow();
	});

	test("rejects invalid result enum value", () => {
		const result = GateEntrySchema.safeParse({
			...validGateEntry,
			result: "maybe",
		});
		expect(result.success).toBe(false);
	});

	test("rejects missing required name field", () => {
		const { name: _, ...noName } = validGateEntry;
		const result = GateEntrySchema.safeParse(noName);
		expect(result.success).toBe(false);
	});

	test("rejects invalid executor enum value", () => {
		const result = GateEntrySchema.safeParse({
			...validGateEntry,
			executedBy: "robot",
		});
		expect(result.success).toBe(false);
	});
});

describe("GateDefinitionSchema", () => {
	test("validates correct gate definition", () => {
		const definition = {
			name: "pre-commit-lint",
			description: "Run linting before commit",
			severity: "warning" as const,
			applicableRoles: ["maintainer" as const, "contributor" as const],
		};
		expect(() => GateDefinitionSchema.parse(definition)).not.toThrow();
	});

	test("rejects invalid severity enum", () => {
		const result = GateDefinitionSchema.safeParse({
			name: "test-gate",
			description: "Test",
			severity: "low",
			applicableRoles: ["maintainer"],
		});
		expect(result.success).toBe(false);
	});
});

describe("GateLogIndexSchema", () => {
	test("validates gate log index with entries", () => {
		const index = {
			entries: [validGateEntry],
			lastUpdated: "2026-01-15T09:30:00.000Z",
			totalCount: 1,
		};
		expect(() => GateLogIndexSchema.parse(index)).not.toThrow();
	});

	test("validates gate log index with empty entries", () => {
		const index = {
			entries: [],
			lastUpdated: "2026-01-15T09:30:00.000Z",
			totalCount: 0,
		};
		expect(() => GateLogIndexSchema.parse(index)).not.toThrow();
	});
});
