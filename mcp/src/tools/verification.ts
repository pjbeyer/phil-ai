import {
	GateRunner,
	GateLog,
	MetricsStore,
	createBuiltinGates,
	generateDashboard,
	generateScorecard,
	trendReport,
	type GateRunResult,
	type GateEntry,
} from "@phil-ai/shared";

export const verifyWorkflow = {
	name: "verify_workflow",
	description:
		"Run all registered gates against current state and return aggregate results",
	inputSchema: {
		type: "object" as const,
		properties: {
			itemId: { type: "string", description: "Work item ID to verify" },
			itemTitle: { type: "string", description: "Work item title" },
			itemType: {
				type: "string",
				description: "Work item type (feature|bug|chore|refactor)",
			},
			currentState: {
				type: "string",
				description: "Current state of the item",
			},
			targetState: {
				type: "string",
				description: "Target state for transition",
			},
		},
	},
	handler: async (params: Record<string, unknown>) => {
		try {
			const itemId = (params.itemId as string) || "unknown";

			const runner = new GateRunner();
			const builtinGates = createBuiltinGates();
			for (const gate of builtinGates) {
				runner.register(gate.definition, gate.evaluator);
			}

			const context: Parameters<GateRunner["evaluate"]>[0] = { itemId };
			if (typeof params.itemTitle === "string")
				context.itemTitle = params.itemTitle;
			if (typeof params.itemType === "string")
				context.itemType = params.itemType;
			if (typeof params.currentState === "string")
				context.currentState = params.currentState;
			if (typeof params.targetState === "string")
				context.targetState = params.targetState;

			const results = await runner.evaluate(context);

			const passed = results.filter((r) => r.result === "pass").length;
			const failed = results.filter((r) => r.result === "fail").length;
			const blocked = results.filter((r) => r.result === "blocked").length;

			const lines = [
				`Gate Verification Results for ${itemId}`,
				`${"=".repeat(40)}`,
				`Total: ${results.length} | Pass: ${passed} | Fail: ${failed} | Blocked: ${blocked}`,
				"",
				...results.map(
					(r: GateRunResult) =>
						`[${r.result.toUpperCase()}] ${r.gateName}: ${r.reason}`,
				),
			];

			return {
				content: [
					{
						type: "text" as const,
						text: lines.join("\n"),
					},
				],
			};
		} catch (error) {
			const message =
				error instanceof Error ? error.message : String(error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error running gate verification: ${message}`,
					},
				],
			};
		}
	},
};

export const workflowMetrics = {
	name: "workflow_metrics",
	description: "Return current scorecard data and velocity trends",
	inputSchema: {
		type: "object" as const,
		properties: {
			period: {
				type: "string",
				description: "Period to query (e.g., 2026-03)",
			},
			context: {
				type: "string",
				description:
					"Context filter (work|personal|oss|aggregate)",
			},
		},
	},
	handler: async (params: Record<string, unknown>) => {
		try {
			const period = params.period as string | undefined;
			const context = params.context as string | undefined;

			const store = new MetricsStore();

			if (period) {
				const snapshot = await store.getSnapshot(period);
				if (snapshot === null) {
					return {
						content: [
							{
								type: "text" as const,
								text: `No metrics found for period: ${period}`,
							},
						],
					};
				}

				if (context && snapshot.context !== context) {
					return {
						content: [
							{
								type: "text" as const,
								text: `No metrics found for period ${period} with context ${context}`,
							},
						],
					};
				}

				const lines = [
					`Metrics Snapshot: ${snapshot.period}`,
					`${"=".repeat(40)}`,
					`Context: ${snapshot.context}`,
					`Velocity: ${snapshot.velocity}`,
					`Avg Duration: ${snapshot.avgDuration}`,
					`Gate Pass Rate: ${(snapshot.gatePassRate * 100).toFixed(1)}%`,
					`Active Items: ${snapshot.activeItems}`,
					`Completed Items: ${snapshot.completedItems}`,
				];

				return {
					content: [
						{
							type: "text" as const,
							text: lines.join("\n"),
						},
					],
				};
			}

			// No period specified — return all available snapshots
			const snapshots = await store.queryMetrics();

			if (snapshots.length === 0) {
				return {
					content: [
						{
							type: "text" as const,
							text: "No metrics snapshots found.",
						},
					],
				};
			}

			const filtered = context
				? snapshots.filter((s) => s.context === context)
				: snapshots;

			if (filtered.length === 0) {
				return {
					content: [
						{
							type: "text" as const,
							text: `No metrics found for context: ${context}`,
						},
					],
				};
			}

			const lines = [
				`Metrics Overview (${filtered.length} snapshots)`,
				`${"=".repeat(40)}`,
				...filtered.map(
					(s) =>
						`${s.period} [${s.context}] velocity=${s.velocity} pass=${(s.gatePassRate * 100).toFixed(1)}% active=${s.activeItems} done=${s.completedItems}`,
				),
			];

			return {
				content: [
					{
						type: "text" as const,
						text: lines.join("\n"),
					},
				],
			};
		} catch (error) {
			const message =
				error instanceof Error ? error.message : String(error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error querying metrics: ${message}`,
					},
				],
			};
		}
	},
};

export const gateLog = {
	name: "gate_log",
	description: "Return gate execution history with optional filters",
	inputSchema: {
		type: "object" as const,
		properties: {
			result: {
				type: "string",
				enum: ["pass", "fail", "blocked"],
				description: "Filter by result",
			},
			gateName: {
				type: "string",
				description: "Filter by gate name",
			},
			limit: {
				type: "number",
				description: "Max entries to return (default 20)",
			},
		},
	},
	handler: async (params: Record<string, unknown>) => {
		try {
			const resultFilter = params.result as string | undefined;
			const gateNameFilter = params.gateName as string | undefined;
			const limit =
				typeof params.limit === "number" ? params.limit : 20;

			const log = new GateLog();
			let entries = await log.getEntries();

			if (resultFilter) {
				entries = entries.filter(
					(e: GateEntry) => e.result === resultFilter,
				);
			}

			if (gateNameFilter) {
				entries = entries.filter(
					(e: GateEntry) => e.name === gateNameFilter,
				);
			}

			entries = entries.slice(-limit);

			if (entries.length === 0) {
				const filters = [
					resultFilter ? `result=${resultFilter}` : null,
					gateNameFilter ? `gate=${gateNameFilter}` : null,
				]
					.filter(Boolean)
					.join(", ");

				return {
					content: [
						{
							type: "text" as const,
							text: filters
								? `No gate log entries found matching: ${filters}`
								: "No gate log entries found.",
						},
					],
				};
			}

			const lines = [
				`Gate Log (${entries.length} entries)`,
				`${"=".repeat(40)}`,
				...entries.map(
					(e: GateEntry) =>
						`[${e.result.toUpperCase()}] ${e.name} | ${e.date} | ${e.executedBy} | ${e.reason}`,
				),
			];

			return {
				content: [
					{
						type: "text" as const,
						text: lines.join("\n"),
					},
				],
			};
		} catch (error) {
			const message =
				error instanceof Error ? error.message : String(error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error reading gate log: ${message}`,
					},
				],
			};
		}
	},
};

export const workflowDashboard = {
	name: "workflow_dashboard",
	description:
		"Generate a dashboard report with velocity, gate quality, active work, patterns, drift alerts, and optional scorecard/trends",
	inputSchema: {
		type: "object" as const,
		properties: {
			period: {
				type: "string",
				description: "Optional period for scorecard (e.g., 2026-03)",
			},
			periods: {
				type: "array",
				items: { type: "string" },
				description: "Optional list of periods for trend analysis",
			},
		},
	},
	handler: async (params: Record<string, unknown>) => {
		try {
			const period =
				typeof params.period === "string" && params.period.length > 0
					? params.period
					: undefined;
			const periods = Array.isArray(params.periods)
				? params.periods.filter(
					(entry): entry is string =>
						typeof entry === "string" && entry.trim().length > 0,
				)
				: [];

			const dashboard = await generateDashboard();
			const scorecard =
				period === undefined ? null : await generateScorecard(period);
			const trends = periods.length >= 2 ? await trendReport(periods) : null;

			const payload = {
				dashboard,
				...(scorecard === null ? {} : { scorecard }),
				...(trends === null ? {} : { trends }),
			};

			const markdownSections = [dashboard.markdown];
			if (trends !== null) {
				markdownSections.push(trends.markdown);
			}

			return {
				content: [
					{
						type: "text" as const,
						text: `${JSON.stringify(payload, null, 2)}\n\n${markdownSections.join("\n\n")}`,
					},
				],
			};
		} catch (error) {
			const message =
				error instanceof Error ? error.message : String(error);
			return {
				content: [
					{
						type: "text" as const,
						text: `Error generating workflow dashboard: ${message}`,
					},
				],
			};
		}
	},
};

export const verificationTools = [
	verifyWorkflow,
	workflowMetrics,
	gateLog,
	workflowDashboard,
];
