import {
	createBuiltinGates,
	GateLog,
	GateRunner,
	getBranchAge,
	ingestAll,
	ingestLearningEvents,
	ingestWorkflowEvents,
	MetricsStore,
	type DateRange,
	type GateRunResult,
	type SystemEvent,
} from "@phil-ai/shared";

const STALE_BRANCH_DAYS = 30;

function textResponse(text: string) {
	return {
		content: [
			{
				type: "text" as const,
				text,
			},
		],
	};
}

function asString(value: unknown): string | undefined {
	return typeof value === "string" ? value : undefined;
}

function parsePeriodDateRange(period: string | undefined): DateRange | undefined {
	if (period === undefined) {
		return undefined;
	}

	const match = /^(\d{4})-(\d{2})$/.exec(period);
	if (match === null) {
		return undefined;
	}
	const [, yearRaw, monthRaw] = match;
	if (yearRaw === undefined || monthRaw === undefined) {
		return undefined;
	}

	const year = Number.parseInt(yearRaw, 10);
	const month = Number.parseInt(monthRaw, 10);
	if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
		return undefined;
	}

	const from = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
	const to = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
	return { from, to };
}

function sortEventsByTimestamp(events: SystemEvent[]): SystemEvent[] {
	return [...events].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

function isWorkStartEvent(eventType: string): boolean {
	return eventType === "work_started" || eventType === "work_start";
}

function isWorkFinishEvent(eventType: string): boolean {
	return (
		eventType === "work_finished" ||
		eventType === "work_finish" ||
		eventType === "work_completed"
	);
}

function collectActiveWorkflowItems(events: SystemEvent[]): Map<string, string> {
	const activeItems = new Map<string, string>();

	for (const event of sortEventsByTimestamp(events)) {
		if (!("issueId" in event)) {
			continue;
		}

		const issueId = event.issueId;
		if (typeof issueId !== "string" || issueId.length === 0) {
			continue;
		}

		if (isWorkStartEvent(event.eventType)) {
			activeItems.set(issueId, event.timestamp);
			continue;
		}

		if (isWorkFinishEvent(event.eventType)) {
			activeItems.delete(issueId);
		}
	}

	return activeItems;
}

async function runGate(
	gateName: string,
	context: {
		itemId: string;
		itemTitle?: string;
		itemType?: string;
		currentState?: string;
	},
): Promise<GateRunResult> {
	const gateRunner = new GateRunner();
	for (const gate of createBuiltinGates()) {
		gateRunner.register(gate.definition, gate.evaluator);
	}

	return gateRunner.evaluateGate(gateName, context);
}

async function persistGateResult(
	itemId: string,
	result: GateRunResult,
	sourceSystem = "phil-ai-mcp-hooks",
): Promise<void> {
	const gateLog = new GateLog();
	await gateLog.persist({
		name: result.gateName,
		date: new Date().toISOString(),
		executedBy: "agent",
		result: result.result,
		reason: result.reason,
		sourceItemId: itemId,
		sourceSystem,
		context: "work",
		role: "maintainer",
		...(result.creditsUsed !== undefined ? { creditsUsed: result.creditsUsed } : {}),
	});
}

function formatGateResult(result: GateRunResult): string {
	return `${result.gateName}: ${result.result.toUpperCase()} - ${result.reason}`;
}

async function evaluateQualitySignals(itemId: string): Promise<{
	status: "pass" | "fail" | "unknown";
	message: string;
}> {
	const gateLog = new GateLog();
	const entries = await gateLog.getEntries();
	const qualityEntries = entries.filter(
		(entry) =>
			entry.sourceItemId === itemId &&
			(/test/i.test(entry.name) ||
				/lint/i.test(entry.name) ||
				/test/i.test(entry.reason) ||
				/lint/i.test(entry.reason)),
	);

	if (qualityEntries.length === 0) {
		return {
			status: "unknown",
			message: "No test/lint gate evidence found for this item",
		};
	}

	const failedEntries = qualityEntries.filter((entry) => entry.result !== "pass");
	if (failedEntries.length > 0) {
		const names = failedEntries.map((entry) => entry.name).join(", ");
		return {
			status: "fail",
			message: `Test/lint checks not passing: ${names}`,
		};
	}

	return {
		status: "pass",
		message: `Test/lint checks passing (${qualityEntries.length} gate entries)`,
	};
}

export const verifyBeforeStart = {
	name: "verify_before_start",
	description:
		"Gate check before starting work - validates no duplicate active items, checks stale branches",
	inputSchema: {
		type: "object" as const,
		properties: {
			itemId: { type: "string", description: "Work item ID to start" },
			itemTitle: { type: "string", description: "Work item title" },
			itemType: { type: "string", description: "Work item type" },
		},
	},
	handler: async (params: Record<string, unknown>) => {
		const itemId = asString(params.itemId);
		const itemTitle = asString(params.itemTitle);
		const itemType = asString(params.itemType);

		if (itemId === undefined || itemId.trim().length === 0) {
			return textResponse("verify_before_start: itemId is required");
		}

		try {
			const gateResult = await runGate("work-start-validation", {
				itemId,
				...(itemTitle !== undefined ? { itemTitle } : {}),
				...(itemType !== undefined ? { itemType } : {}),
			});

			await persistGateResult(itemId, gateResult);
			if (gateResult.result !== "pass") {
				return textResponse(formatGateResult(gateResult));
			}

			const workflowEvents = await ingestWorkflowEvents();
			const activeItems = collectActiveWorkflowItems(workflowEvents);
			const duplicateItems = Array.from(activeItems.keys()).filter(
				(activeItemId) => activeItemId !== itemId,
			);

			if (activeItems.has(itemId)) {
				return textResponse(
					"verify_before_start: FAIL - item is already active (duplicate start)",
				);
			}

			if (duplicateItems.length > 0) {
				return textResponse(
					`verify_before_start: FAIL - found other active work items: ${duplicateItems.join(", ")}`,
				);
			}

			const branchAgeDays = await getBranchAge("HEAD", process.cwd());
			if (branchAgeDays >= STALE_BRANCH_DAYS) {
				return textResponse(
					`verify_before_start: BLOCKED - branch appears stale (${branchAgeDays} days since last commit, threshold ${STALE_BRANCH_DAYS})`,
				);
			}

			return textResponse(
				[
					formatGateResult(gateResult),
					"active-items-check: PASS - no duplicate active items",
					`stale-branch-check: PASS - branch age ${branchAgeDays} days`,
				].join("\n"),
			);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			return textResponse(`verify_before_start: ERROR - ${message}`);
		}
	},
};

export const verifyBeforeFinish = {
	name: "verify_before_finish",
	description:
		"Gate check before finishing work - validates item was in-progress and checks test/lint status",
	inputSchema: {
		type: "object" as const,
		properties: {
			itemId: { type: "string", description: "Work item ID to finish" },
			currentState: {
				type: "string",
				description: "Current state (should be in-progress)",
			},
		},
	},
	handler: async (params: Record<string, unknown>) => {
		const itemId = asString(params.itemId);
		const currentState = asString(params.currentState);

		if (itemId === undefined || itemId.trim().length === 0) {
			return textResponse("verify_before_finish: itemId is required");
		}

		try {
			const gateResult = await runGate("work-finish-completeness", {
				itemId,
				...(currentState !== undefined ? { currentState } : {}),
			});
			await persistGateResult(itemId, gateResult);

			const quality = await evaluateQualitySignals(itemId);
			if (gateResult.result !== "pass") {
				return textResponse(
					[
						formatGateResult(gateResult),
						`quality-check: ${quality.status.toUpperCase()} - ${quality.message}`,
					].join("\n"),
				);
			}

			if (quality.status === "fail") {
				return textResponse(
					[
						formatGateResult(gateResult),
						`quality-check: FAIL - ${quality.message}`,
					].join("\n"),
				);
			}

			return textResponse(
				[
					formatGateResult(gateResult),
					`quality-check: ${quality.status.toUpperCase()} - ${quality.message}`,
				].join("\n"),
			);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			return textResponse(`verify_before_finish: ERROR - ${message}`);
		}
	},
};

export const workStatusEnhanced = {
	name: "work_status_enhanced",
	description:
		"Enhanced work status with metrics overlay (velocity, gate history, scorecard)",
	inputSchema: {
		type: "object" as const,
		properties: {
			period: { type: "string", description: "Period for metrics (e.g., 2026-03)" },
		},
	},
	handler: async (params: Record<string, unknown>) => {
		const period = asString(params.period);
		const dateRange = parsePeriodDateRange(period);

		if (period !== undefined && dateRange === undefined) {
			return textResponse(
				"work_status_enhanced: period must use YYYY-MM format (example: 2026-03)",
			);
		}

		try {
			const workflowEvents = await ingestWorkflowEvents(
				dateRange !== undefined ? { dateRange } : undefined,
			);
			const gateLog = new GateLog();
			const gateEntries = await gateLog.getEntries(dateRange);
			const gatePassRate = await gateLog.getPassRate(dateRange);

			const metricsStore = new MetricsStore();
			const snapshot =
				period === undefined
					? null
					: await metricsStore.getSnapshot(period);
			const queriedSnapshots =
				snapshot === null ? await metricsStore.queryMetrics(dateRange) : [];
			const latestSnapshot = snapshot ?? queriedSnapshots[queriedSnapshots.length - 1] ?? null;

			const activeItems = collectActiveWorkflowItems(workflowEvents);
			const completedCount = workflowEvents.filter((event) =>
				isWorkFinishEvent(event.eventType),
			).length;
			const startCount = workflowEvents.filter((event) => isWorkStartEvent(event.eventType)).length;

			const passCount = gateEntries.filter((entry) => entry.result === "pass").length;
			const failCount = gateEntries.filter((entry) => entry.result === "fail").length;
			const blockedCount = gateEntries.filter((entry) => entry.result === "blocked").length;

			const velocity = latestSnapshot?.velocity ?? completedCount;
			const avgDuration = latestSnapshot?.avgDuration ?? 0;
			const scorecard = ((velocity * 0.6 + gatePassRate * 100 * 0.4) / 20).toFixed(2);

			return textResponse(
				[
					`period: ${period ?? "latest"}`,
					`workflow-events: ${workflowEvents.length} (starts: ${startCount}, finishes: ${completedCount})`,
					`active-items: ${activeItems.size}`,
					`metrics-overlay: velocity=${velocity}, avgDuration=${avgDuration}, gatePassRate=${(gatePassRate * 100).toFixed(1)}%`,
					`gate-history: total=${gateEntries.length}, pass=${passCount}, fail=${failCount}, blocked=${blockedCount}`,
					`scorecard: ${scorecard}/5.00`,
				].join("\n"),
			);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			return textResponse(`work_status_enhanced: ERROR - ${message}`);
		}
	},
};

export const systemHealth = {
	name: "system_health",
	description: "Cross-plugin health check for all phil-ai plugins",
	inputSchema: {
		type: "object" as const,
		properties: {},
	},
	handler: async () => {
		const checks: string[] = [];

		try {
			const workflowEvents = await ingestWorkflowEvents();
			checks.push(`[ok] workflow-events accessible (${workflowEvents.length} events)`);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			checks.push(`[fail] workflow-events unavailable (${message})`);
		}

		try {
			const learningEvents = await ingestLearningEvents();
			checks.push(`[ok] learning-events accessible (${learningEvents.length} events)`);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			checks.push(`[fail] learning-events unavailable (${message})`);
		}

		try {
			const gateEntries = await new GateLog().getEntries();
			checks.push(`[ok] gate-log accessible (${gateEntries.length} entries)`);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			checks.push(`[fail] gate-log unavailable (${message})`);
		}

		try {
			const snapshots = await new MetricsStore().queryMetrics();
			checks.push(`[ok] metrics-store accessible (${snapshots.length} snapshots)`);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			checks.push(`[fail] metrics-store unavailable (${message})`);
		}

		try {
			const allEvents = await ingestAll();
			checks.push(`[ok] cross-plugin ingest accessible (${allEvents.length} total events)`);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			checks.push(`[fail] cross-plugin ingest unavailable (${message})`);
		}

		return textResponse(checks.join("\n"));
	},
};

export const hookTools = [
	verifyBeforeStart,
	verifyBeforeFinish,
	workStatusEnhanced,
	systemHealth,
];
