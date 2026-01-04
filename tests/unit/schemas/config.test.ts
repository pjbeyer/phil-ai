import { describe, expect, test } from "bun:test";
import { ConfigSchema, createDefaultConfig } from "@phil-ai/shared/schemas";

describe("ConfigSchema", () => {
	test("validates minimal config", () => {
		const config = {
			_version: "1.0.0",
		};

		const result = ConfigSchema.parse(config);
		expect(result._version).toBe("1.0.0");
		expect(result.defaults.priority).toBe("P3");
		expect(result.defaults.impact).toBe("medium");
		expect(result.platforms.claudeCode.enabled).toBe(true);
	});

	test("validates full config", () => {
		const config = {
			_version: "1.0.0",
			defaults: {
				priority: "P1" as const,
				impact: "high" as const,
				effort: "low" as const,
			},
			profiles: {
				pjbeyer: {
					path: "~/Projects/pjbeyer",
					categories: ["tools", "patterns"],
				},
			},
			platforms: {
				claudeCode: {
					enabled: true,
					marketplacePath: "/custom/path",
				},
				opencode: {
					enabled: false,
				},
			},
			mcp: {
				port: 8080,
				host: "0.0.0.0",
			},
		};

		expect(() => ConfigSchema.parse(config)).not.toThrow();
	});

	test("rejects invalid priority", () => {
		const config = {
			_version: "1.0.0",
			defaults: {
				priority: "P5",
			},
		};

		expect(() => ConfigSchema.parse(config)).toThrow();
	});
});

describe("createDefaultConfig", () => {
	test("creates valid default config", () => {
		const config = createDefaultConfig();

		expect(() => ConfigSchema.parse(config)).not.toThrow();
		expect(config._version).toBe("1.0.0");
		expect(config.defaults.priority).toBe("P3");
		expect(config.mcp.port).toBe(3000);
	});
});
