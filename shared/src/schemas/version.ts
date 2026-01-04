import { z } from "zod";
import { SemverRegex } from "./base.js";

export const ComponentName = [
	"core",
	"cli",
	"mcp",
	"claude-code-generator",
	"opencode-generator",
] as const;
export type ComponentNameType = (typeof ComponentName)[number];

export const ComponentVersionSchema = z.object({
	component: z.enum(ComponentName),
	version: z.string().regex(SemverRegex),
	minCompatible: z.string().regex(SemverRegex).optional(),
	installedAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
});

export type ComponentVersion = z.infer<typeof ComponentVersionSchema>;

export const VersionManifestSchema = z.object({
	_version: z.string(),
	components: z.array(ComponentVersionSchema),
	dataSchemaVersion: z.string(),
	lastCheck: z.string().datetime().optional(),
});

export type VersionManifest = z.infer<typeof VersionManifestSchema>;

export function createVersionManifest(version: string): VersionManifest {
	const now = new Date().toISOString();
	return {
		_version: version,
		components: [
			{
				component: "core",
				version,
				installedAt: now,
				updatedAt: now,
			},
			{
				component: "cli",
				version,
				installedAt: now,
				updatedAt: now,
			},
		],
		dataSchemaVersion: version,
		lastCheck: now,
	};
}
