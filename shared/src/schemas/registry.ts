import { z } from "zod";
import { EventContext, EventRole } from "./events.js";

export const SystemType = [
	"git-repo",
	"cli-plugin",
	"notion-workspace",
	"custom",
] as const;
export type SystemTypeType = (typeof SystemType)[number];

export const SystemAdapter = ["jsonl", "github", "notion", "git", "custom"] as const;
export type SystemAdapterType = (typeof SystemAdapter)[number];

export const IsolationMode = ["open", "strict"] as const;
export type IsolationModeType = (typeof IsolationMode)[number];

export const SystemConnectionSchema = z.object({
	path: z.string().optional(),
	repo: z.string().optional(),
	databaseId: z.string().optional(),
});

export const SystemRegistryEntrySchema = z.object({
	name: z.string(),
	type: z.enum(SystemType),
	role: z.enum(EventRole),
	context: z.enum(EventContext),
	adapter: z.enum(SystemAdapter),
	connection: SystemConnectionSchema.optional(),
	isolation: z.enum(IsolationMode).default("open"),
	enabled: z.boolean().default(true),
	gateOverrides: z.record(z.string(), z.boolean()).optional(),
});

export const RegistryConfigSchema = z.array(SystemRegistryEntrySchema);

export type SystemConnection = z.infer<typeof SystemConnectionSchema>;
export type SystemRegistryEntry = z.infer<typeof SystemRegistryEntrySchema>;
export type RegistryConfig = z.infer<typeof RegistryConfigSchema>;
