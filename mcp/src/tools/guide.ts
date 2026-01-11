import {
	type GuideLoadOptions,
	type VerbosityLevelType,
	formatGuideForAgent,
	loadMergedGuide,
} from "@phil-ai/shared";

export const getGuide = {
	name: "get_guide",
	description:
		"Load and merge system guide preferences from all hierarchy levels (global, profile, project)",
	inputSchema: {
		type: "object" as const,
		properties: {
			projectPath: {
				type: "string",
				description: "Project path to discover guides from (defaults to cwd)",
			},
			platform: {
				type: "string",
				enum: ["claude-code", "opencode"],
				description: "Filter preferences for specific platform",
			},
			verbosity: {
				type: "string",
				enum: ["silent", "brief", "verbose"],
				description: "Override guide verbosity level",
			},
			format: {
				type: "string",
				enum: ["json", "markdown"],
				description: "Output format (default: markdown)",
			},
		},
	},
	handler: async (params: Record<string, unknown>) => {
		const projectPath = (params.projectPath as string) || process.cwd();
		const platform = params.platform as "claude-code" | "opencode" | undefined;
		const verbosity = params.verbosity as VerbosityLevelType | undefined;
		const format = (params.format as "json" | "markdown") || "markdown";

		const options: GuideLoadOptions = {
			projectPath,
			includeInactive: false,
		};
		if (platform) options.platform = platform;
		if (verbosity) options.verbosity = verbosity;

		const guide = await loadMergedGuide(options);

		if (!guide) {
			return {
				content: [
					{
						type: "text" as const,
						text: "No GUIDE.md files found. Run 'phil-ai guide init' to create one.",
					},
				],
			};
		}

		const output =
			format === "json"
				? JSON.stringify(guide, null, 2)
				: formatGuideForAgent(guide);

		return {
			content: [
				{
					type: "text" as const,
					text: output,
				},
			],
		};
	},
};

export const listPreferences = {
	name: "list_preferences",
	description: "List all preferences from the merged system guide",
	inputSchema: {
		type: "object" as const,
		properties: {
			projectPath: {
				type: "string",
				description: "Project path to discover guides from (defaults to cwd)",
			},
			type: {
				type: "string",
				enum: ["hard", "soft", "all"],
				description: "Filter by preference type (default: all)",
			},
			includeInactive: {
				type: "boolean",
				description: "Include inactive preferences (default: false)",
			},
		},
	},
	handler: async (params: Record<string, unknown>) => {
		const projectPath = (params.projectPath as string) || process.cwd();
		const typeFilter = (params.type as "hard" | "soft" | "all") || "all";
		const includeInactive = params.includeInactive === true;

		const guide = await loadMergedGuide({
			projectPath,
			includeInactive,
		});

		if (!guide) {
			return {
				content: [
					{
						type: "text" as const,
						text: "No preferences found. No GUIDE.md files exist.",
					},
				],
			};
		}

		let preferences = guide.preferences;
		if (typeFilter !== "all") {
			preferences = preferences.filter((p) => p.type === typeFilter);
		}

		if (preferences.length === 0) {
			return {
				content: [
					{
						type: "text" as const,
						text: `No ${typeFilter === "all" ? "" : typeFilter + " "}preferences found.`,
					},
				],
			};
		}

		const lines = preferences.map((p) => {
			const level = p.sourceLevel ? `[${p.sourceLevel}]` : "";
			const type = p.type === "hard" ? "(HARD)" : "(soft)";
			return `- ${p.id} ${type} ${level}\n  ${p.content}`;
		});

		return {
			content: [
				{
					type: "text" as const,
					text: `Found ${preferences.length} preferences:\n\n${lines.join("\n\n")}`,
				},
			],
		};
	},
};

export const checkPreference = {
	name: "check_preference",
	description: "Check if a specific preference exists and get its details",
	inputSchema: {
		type: "object" as const,
		properties: {
			preferenceId: {
				type: "string",
				description:
					"Preference ID to check (e.g., 'code-style.explicit-types')",
			},
			projectPath: {
				type: "string",
				description: "Project path to discover guides from (defaults to cwd)",
			},
		},
		required: ["preferenceId"],
	},
	handler: async (params: Record<string, unknown>) => {
		const preferenceId = params.preferenceId as string;
		const projectPath = (params.projectPath as string) || process.cwd();

		if (!preferenceId) {
			return {
				content: [
					{
						type: "text" as const,
						text: "Error: preferenceId is required",
					},
				],
			};
		}

		const guide = await loadMergedGuide({
			projectPath,
			includeInactive: true,
		});

		if (!guide) {
			return {
				content: [
					{
						type: "text" as const,
						text: `Preference "${preferenceId}" not found. No GUIDE.md files exist.`,
					},
				],
			};
		}

		const pref = guide.preferences.find((p) => p.id === preferenceId);

		if (!pref) {
			const similar = guide.preferences
				.filter(
					(p) => p.id.includes(preferenceId) || preferenceId.includes(p.id),
				)
				.slice(0, 3)
				.map((p) => p.id);

			const suggestion =
				similar.length > 0 ? `\n\nDid you mean: ${similar.join(", ")}?` : "";

			return {
				content: [
					{
						type: "text" as const,
						text: `Preference "${preferenceId}" not found.${suggestion}`,
					},
				],
			};
		}

		const details = [
			`ID: ${pref.id}`,
			`Type: ${pref.type} ${pref.type === "hard" ? "(must follow)" : "(default, can override)"}`,
			`Active: ${pref.active}`,
			pref.sourceLevel ? `Source: ${pref.sourceLevel} level` : null,
			`\nContent:\n${pref.content}`,
		]
			.filter(Boolean)
			.join("\n");

		return {
			content: [
				{
					type: "text" as const,
					text: details,
				},
			],
		};
	},
};

export const guideTools = [getGuide, listPreferences, checkPreference];
