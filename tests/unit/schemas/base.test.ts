import { describe, expect, test } from "bun:test";
import {
	VersionedDataSchema,
	createVersionedData,
	updateVersionedData,
} from "@phil-ai/shared/schemas";

describe("VersionedDataSchema", () => {
	test("validates correct versioned data", () => {
		const data = {
			_version: "1.0.0",
			_created: "2026-01-02T12:00:00.000Z",
			_modified: "2026-01-02T12:00:00.000Z",
		};

		expect(() => VersionedDataSchema.parse(data)).not.toThrow();
	});

	test("rejects invalid version format", () => {
		const data = {
			_version: "1.0",
			_created: "2026-01-02T12:00:00.000Z",
			_modified: "2026-01-02T12:00:00.000Z",
		};

		expect(() => VersionedDataSchema.parse(data)).toThrow();
	});

	test("rejects invalid datetime format", () => {
		const data = {
			_version: "1.0.0",
			_created: "not-a-date",
			_modified: "2026-01-02T12:00:00.000Z",
		};

		expect(() => VersionedDataSchema.parse(data)).toThrow();
	});
});

describe("createVersionedData", () => {
	test("creates versioned data with current timestamp", () => {
		const before = new Date().toISOString();
		const data = createVersionedData("1.0.0");
		const after = new Date().toISOString();

		expect(data._version).toBe("1.0.0");
		expect(data._created >= before).toBe(true);
		expect(data._created <= after).toBe(true);
		expect(data._created).toBe(data._modified);
	});
});

describe("updateVersionedData", () => {
	test("updates modified timestamp", async () => {
		const original = createVersionedData("1.0.0");
		await new Promise((r) => setTimeout(r, 10));
		const updated = updateVersionedData(original);

		expect(updated._version).toBe(original._version);
		expect(updated._created).toBe(original._created);
		expect(updated._modified > original._modified).toBe(true);
	});
});
