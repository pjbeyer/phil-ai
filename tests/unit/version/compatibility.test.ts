import { describe, expect, test } from "bun:test";
import {
	parseSemver,
	compareSemver,
	isCompatible,
	incrementVersion,
} from "@phil-ai/shared/version";
import {
	checkCompatibility,
	needsMigration,
	getMigrationPath,
} from "@phil-ai/shared/version";
import type { VersionManifest } from "@phil-ai/shared/schemas";

describe("parseSemver", () => {
	test("parses valid semver", () => {
		const result = parseSemver("1.2.3");
		expect(result).toEqual({ major: 1, minor: 2, patch: 3 });
	});

	test("returns null for invalid format", () => {
		expect(parseSemver("1.2")).toBeNull();
		expect(parseSemver("v1.2.3")).toBeNull();
		expect(parseSemver("1.2.3.4")).toBeNull();
	});
});

describe("compareSemver", () => {
	test("compares major versions", () => {
		expect(compareSemver("2.0.0", "1.0.0")).toBeGreaterThan(0);
		expect(compareSemver("1.0.0", "2.0.0")).toBeLessThan(0);
	});

	test("compares minor versions", () => {
		expect(compareSemver("1.2.0", "1.1.0")).toBeGreaterThan(0);
		expect(compareSemver("1.1.0", "1.2.0")).toBeLessThan(0);
	});

	test("compares patch versions", () => {
		expect(compareSemver("1.0.2", "1.0.1")).toBeGreaterThan(0);
		expect(compareSemver("1.0.1", "1.0.2")).toBeLessThan(0);
	});

	test("returns 0 for equal versions", () => {
		expect(compareSemver("1.2.3", "1.2.3")).toBe(0);
	});
});

describe("isCompatible", () => {
	test("major strategy allows same major", () => {
		expect(isCompatible("1.5.0", "1.0.0", "major")).toBe(true);
		expect(isCompatible("2.0.0", "1.0.0", "major")).toBe(false);
	});

	test("minor strategy requires same major and >= minor", () => {
		expect(isCompatible("1.5.0", "1.3.0", "minor")).toBe(true);
		expect(isCompatible("1.2.0", "1.3.0", "minor")).toBe(false);
	});

	test("exact strategy requires exact match", () => {
		expect(isCompatible("1.2.3", "1.2.3", "exact")).toBe(true);
		expect(isCompatible("1.2.4", "1.2.3", "exact")).toBe(false);
	});
});

describe("incrementVersion", () => {
	test("increments major", () => {
		expect(incrementVersion("1.2.3", "major")).toBe("2.0.0");
	});

	test("increments minor", () => {
		expect(incrementVersion("1.2.3", "minor")).toBe("1.3.0");
	});

	test("increments patch", () => {
		expect(incrementVersion("1.2.3", "patch")).toBe("1.2.4");
	});
});

describe("checkCompatibility", () => {
	test("validates manifest with all required components", () => {
		const manifest: VersionManifest = {
			_version: "1.0.0",
			components: [
				{
					component: "core",
					version: "1.0.0",
					installedAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				},
				{
					component: "cli",
					version: "1.0.0",
					installedAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				},
			],
			dataSchemaVersion: "1.0.0",
			lastCheck: new Date().toISOString(),
		};

		const result = checkCompatibility(manifest);
		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	test("reports missing required components", () => {
		const manifest: VersionManifest = {
			_version: "1.0.0",
			components: [],
			dataSchemaVersion: "1.0.0",
		};

		const result = checkCompatibility(manifest);
		expect(result.valid).toBe(false);
		expect(result.errors.some((e) => e.includes("core"))).toBe(true);
		expect(result.errors.some((e) => e.includes("cli"))).toBe(true);
	});
});

describe("needsMigration", () => {
	test("returns true for major version bump", () => {
		expect(needsMigration("1.0.0", "2.0.0")).toBe(true);
	});

	test("returns false for same major", () => {
		expect(needsMigration("1.0.0", "1.5.0")).toBe(false);
	});
});

describe("getMigrationPath", () => {
	test("returns path for multiple major versions", () => {
		const path = getMigrationPath("1.0.0", "3.0.0");
		expect(path).toEqual(["2.0.0", "3.0.0"]);
	});

	test("returns empty array when no migration needed", () => {
		const path = getMigrationPath("2.0.0", "2.5.0");
		expect(path).toEqual([]);
	});
});
