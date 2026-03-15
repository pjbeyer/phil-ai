import type { DashboardReport } from "../reporting/dashboard.js";
import type { GateEntry } from "../schemas/gate.js";
import type { ScorecardEntry } from "../schemas/metrics.js";
import { readHubConfig, type NotionClient } from "../notion/hub.js";

type SyncStatus = "created" | "skipped" | "error";

export interface SyncResult {
	status: SyncStatus;
	message: string;
	pageId?: string;
}

export interface BatchSyncResult {
	total: number;
	created: number;
	skipped: number;
	failed: number;
	results: SyncResult[];
}

export async function syncGateLog(
	entries: GateEntry[],
	client: NotionClient,
): Promise<BatchSyncResult> {
	const config = await readHubConfig();
	if (config?.gateLogDatabaseId === undefined) {
		return {
			total: entries.length,
			created: 0,
			skipped: entries.length,
			failed: 0,
			results: entries.map(() => ({
				status: "skipped",
				message: "Gate Log database ID is not configured",
			})),
		};
	}

	const results: SyncResult[] = [];

	for (const entry of entries) {
		const title = gateEntryTitle(entry);
		try {
			const existing = await findExactMatch(client, config.gateLogDatabaseId, title);
			if (existing !== undefined) {
				results.push({
					status: "skipped",
					message: `Entry already exists (${existing.id})`,
					pageId: existing.id,
				});
				continue;
			}

			const created = await client.createPage(
				config.gateLogDatabaseId,
				title,
				gateResultIcon(entry.result),
				buildGateEntryContent(entry),
			);

			results.push({
				status: "created",
				message: `Synced gate entry ${entry.name}`,
				pageId: created.id,
			});
		} catch (error) {
			results.push({
				status: "error",
				message: `Failed to sync ${title}: ${toErrorMessage(error)}`,
			});
		}
	}

	return summarizeBatch(results);
}

export async function syncScorecard(
	entry: ScorecardEntry,
	client: NotionClient,
): Promise<SyncResult> {
	const config = await readHubConfig();
	if (config?.scorecardDatabaseId === undefined) {
		return {
			status: "skipped",
			message: "Scorecard database ID is not configured",
		};
	}

	const title = scorecardTitle(entry);

	try {
		const existing = await findExactMatch(client, config.scorecardDatabaseId, title);
		if (existing !== undefined) {
			return {
				status: "skipped",
				message: `Scorecard for this period already exists (${existing.id})`,
				pageId: existing.id,
			};
		}

		const created = await client.createPage(
			config.scorecardDatabaseId,
			title,
			"📈",
			buildScorecardContent(entry),
		);

		return {
			status: "created",
			message: "Synced monthly scorecard",
			pageId: created.id,
		};
	} catch (error) {
		return {
			status: "error",
			message: `Failed to sync scorecard: ${toErrorMessage(error)}`,
		};
	}
}

export async function syncDashboard(
	report: DashboardReport,
	client: NotionClient,
): Promise<SyncResult> {
	const config = await readHubConfig();
	if (config?.dashboardPageId === undefined) {
		return {
			status: "skipped",
			message: "Dashboard page ID is not configured",
		};
	}

	const title = dashboardSnapshotTitle(report.generatedAt);

	try {
		const existing = await findExactMatch(client, config.dashboardPageId, title);
		if (existing !== undefined) {
			return {
				status: "skipped",
				message: `Dashboard snapshot already exists (${existing.id})`,
				pageId: existing.id,
			};
		}

		const created = await client.createPage(
			config.dashboardPageId,
			title,
			"📊",
			report.markdown,
		);

		return {
			status: "created",
			message: "Synced dashboard snapshot",
			pageId: created.id,
		};
	} catch (error) {
		return {
			status: "error",
			message: `Failed to sync dashboard: ${toErrorMessage(error)}`,
		};
	}
}

export async function syncSystemStatus(
	system: string,
	status: string,
	client: NotionClient,
): Promise<SyncResult> {
	const config = await readHubConfig();
	const statusPageId = config?.systemStatusPageIds?.[system];

	if (statusPageId === undefined) {
		return {
			status: "skipped",
			message: `System status page is not configured for ${system}`,
		};
	}

	const title = systemStatusTitle(system, status);

	try {
		const existing = await findExactMatch(client, statusPageId, title);
		if (existing !== undefined) {
			return {
				status: "skipped",
				message: `Status update already exists (${existing.id})`,
				pageId: existing.id,
			};
		}

		const created = await client.createPage(
			statusPageId,
			title,
			statusIcon(status),
			buildSystemStatusContent(system, status),
		);

		return {
			status: "created",
			message: `Synced status for ${system}`,
			pageId: created.id,
		};
	} catch (error) {
		return {
			status: "error",
			message: `Failed to sync system status for ${system}: ${toErrorMessage(error)}`,
		};
	}
}

function gateEntryTitle(entry: GateEntry): string {
	return `${entry.name} | ${entry.sourceSystem} | ${entry.date}`;
}

function scorecardTitle(entry: ScorecardEntry): string {
	const month = entry.date.slice(0, 7);
	return `Scorecard ${month} (${entry.context})`;
}

function dashboardSnapshotTitle(generatedAt: string): string {
	return `Dashboard Snapshot ${generatedAt}`;
}

function systemStatusTitle(system: string, status: string): string {
	const date = new Date().toISOString().slice(0, 10);
	return `${system} Status ${status} (${date})`;
}

async function findExactMatch(
	client: NotionClient,
	parentPageId: string,
	title: string,
): Promise<{ id: string; title: string } | undefined> {
	const results = await client.searchPages(title, parentPageId);
	return results.find((result) => result.title === title);
}

function buildGateEntryContent(entry: GateEntry): string {
	return [
		`# Gate Execution: ${entry.name}`,
		"",
		`- Date: ${entry.date}`,
		`- Source System: ${entry.sourceSystem}`,
		`- Result: ${entry.result}`,
		`- Executed By: ${entry.executedBy}`,
		`- Context: ${entry.context}`,
		`- Role: ${entry.role}`,
		`- Source Item ID: ${entry.sourceItemId}`,
		`- Credits Used: ${entry.creditsUsed ?? 0}`,
		"",
		"## Reason",
		entry.reason,
	].join("\n");
}

function buildScorecardContent(entry: ScorecardEntry): string {
	const dimensionLines = Object.entries(entry.dimensions).map(
		([name, dimension]) =>
			`- ${name}: ${dimension.score}/5 (${dimension.trend}) — ${dimension.evidence}`,
	);

	return [
		`# Scorecard ${entry.date.slice(0, 7)} (${entry.context})`,
		"",
		`- Date: ${entry.date}`,
		`- Average: ${entry.average.toFixed(2)}`,
		"",
		"## Dimensions",
		...dimensionLines,
		"",
		"## Notes",
		entry.notes ?? "No notes provided.",
	].join("\n");
}

function buildSystemStatusContent(system: string, status: string): string {
	return [
		`# ${system} Health Update`,
		"",
		`- Updated At: ${new Date().toISOString()}`,
		`- Status: ${status}`,
		"",
		"This entry was generated by Phil AI Notion sync.",
	].join("\n");
}

function gateResultIcon(result: GateEntry["result"]): string {
	if (result === "pass") {
		return "✅";
	}

	if (result === "fail") {
		return "❌";
	}

	return "⛔";
}

function statusIcon(status: string): string {
	const normalized = status.toLowerCase();
	if (normalized === "healthy" || normalized === "ok" || normalized === "green") {
		return "🟢";
	}

	if (normalized === "degraded" || normalized === "warning" || normalized === "yellow") {
		return "🟡";
	}

	if (normalized === "down" || normalized === "critical" || normalized === "red") {
		return "🔴";
	}

	return "⚪";
}

function summarizeBatch(results: SyncResult[]): BatchSyncResult {
	return {
		total: results.length,
		created: results.filter((result) => result.status === "created").length,
		skipped: results.filter((result) => result.status === "skipped").length,
		failed: results.filter((result) => result.status === "error").length,
		results,
	};
}

function toErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}

	return String(error);
}
