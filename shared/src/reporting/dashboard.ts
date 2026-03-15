import { GateLog } from "../gates/log.js";
import { ingestAll } from "../ingestion/all.js";
import { calculateDurations } from "../metrics/duration.js";
import { MetricsStore } from "../metrics/store.js";
import { calculateVelocity } from "../metrics/velocity.js";
import { PatternEngine } from "../patterns/engine.js";
import type { SystemEvent } from "../schemas/events.js";
import { sweepAll } from "../drift/sweep.js";

export interface DashboardSection {
	value: number;
	label: string;
	evidence: string;
}

export interface DashboardReport {
	generatedAt: string;
	sourcePeriod: string | null;
	velocity: DashboardSection;
	gatePassRate: DashboardSection;
	activeItems: DashboardSection;
	patterns: DashboardSection;
	driftAlerts: DashboardSection;
	markdown: string;
}

function asFinite(value: number): number {
	return Number.isFinite(value) ? value : 0;
}

function asPercent(value: number): number {
	if (!Number.isFinite(value)) {
		return 0;
	}

	if (value <= 0) {
		return 0;
	}

	if (value >= 1) {
		return 1;
	}

	return value;
}

type WorkflowStateEvent = SystemEvent & {
	eventType: "work_started" | "work_finished";
	issueId: string;
};

function isWorkflowStateEvent(event: SystemEvent): event is WorkflowStateEvent {
	const candidate = event as Partial<WorkflowStateEvent>;
	const isTimingEvent =
		candidate.eventType === "work_started" || candidate.eventType === "work_finished";

	return isTimingEvent && typeof candidate.issueId === "string";
}

function activeItemCount(events: SystemEvent[]): number {
	const active = new Set<string>();
	for (const event of events) {
		if (!isWorkflowStateEvent(event)) {
			continue;
		}

		if (event.eventType === "work_started") {
			active.add(event.issueId);
			continue;
		}

		active.delete(event.issueId);
	}

	return active.size;
}

function buildMarkdown(report: Omit<DashboardReport, "markdown">): string {
	const lines = [
		"# Workflow Dashboard",
		"",
		report.sourcePeriod
			? `Source period: ${report.sourcePeriod}`
			: "Source period: live aggregate",
		"",
		`- Velocity: ${report.velocity.label} (${report.velocity.evidence})`,
		`- Gate Pass Rate: ${report.gatePassRate.label} (${report.gatePassRate.evidence})`,
		`- Active Items: ${report.activeItems.label} (${report.activeItems.evidence})`,
		`- Patterns: ${report.patterns.label} (${report.patterns.evidence})`,
		`- Drift Alerts: ${report.driftAlerts.label} (${report.driftAlerts.evidence})`,
	];

	return lines.join("\n");
}

export async function generateDashboard(): Promise<DashboardReport> {
	const store = new MetricsStore();
	const gateLog = new GateLog();
	const patternEngine = new PatternEngine();

	const [snapshots, gatePassRate, events, driftReport] = await Promise.all([
		store.queryMetrics(),
		gateLog.getPassRate(),
		ingestAll(),
		sweepAll(),
	]);

	const latestSnapshot = snapshots[snapshots.length - 1] ?? null;
	const durations = calculateDurations(events);
	const patternReport = await patternEngine.analyze({
		gateEntries: await gateLog.getEntries(),
		metricsSnapshots: snapshots,
		events,
		durations,
	});

	const velocityValue = asFinite(
		latestSnapshot?.velocity ?? calculateVelocity(events, { weeks: 4 }),
	);
	const gatePassRateValue = asPercent(latestSnapshot?.gatePassRate ?? gatePassRate);
	const activeItemsValue = asFinite(
		latestSnapshot?.activeItems ?? activeItemCount(events),
	);
	const patternsValue = asFinite(patternReport.totalPatterns);
	const driftAlertsValue = asFinite(
		driftReport.entries.filter((entry) => entry.severity !== "info").length,
	);

	const reportWithoutMarkdown: Omit<DashboardReport, "markdown"> = {
		generatedAt: new Date().toISOString(),
		sourcePeriod: latestSnapshot?.period ?? null,
		velocity: {
			value: velocityValue,
			label: `${velocityValue.toFixed(2)} items/week`,
			evidence: latestSnapshot
				? `From metrics snapshot ${latestSnapshot.period}`
				: "Calculated from ingested workflow events over 4 weeks",
		},
		gatePassRate: {
			value: gatePassRateValue,
			label: `${(gatePassRateValue * 100).toFixed(1)}%`,
			evidence: latestSnapshot
				? `From metrics snapshot ${latestSnapshot.period}`
				: "Computed from persisted gate logs",
		},
		activeItems: {
			value: activeItemsValue,
			label: `${Math.max(0, Math.round(activeItemsValue))} active`,
			evidence: latestSnapshot
				? `From metrics snapshot ${latestSnapshot.period}`
				: "Derived from work_started/work_finished events",
		},
		patterns: {
			value: patternsValue,
			label: `${Math.max(0, Math.round(patternsValue))} detected`,
			evidence: `${patternReport.totalPatterns} total patterns across ${Object.keys(patternReport.detectorResults).length} detectors`,
		},
		driftAlerts: {
			value: driftAlertsValue,
			label: `${Math.max(0, Math.round(driftAlertsValue))} alerts`,
			evidence: `${driftReport.totalIssues} drift findings (${driftAlertsValue.toFixed(0)} warning/critical)`,
		},
	};

	return {
		...reportWithoutMarkdown,
		markdown: buildMarkdown(reportWithoutMarkdown),
	};
}
