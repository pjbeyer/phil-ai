import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { ensureAllDirs, GateLog, MetricsStore, type GateEntry, type MetricsSnapshot } from "@phil-ai/shared";
import { TEST_DIR } from "../../setup.js";

interface WorkflowJsonlEvent {
	event: string;
	profile: string;
	date: string;
	issue: string;
	branch: string;
	type?: "feature" | "bug" | "chore" | "refactor";
	duration?: number;
}

export interface WorkflowTestFixture {
	dir: string;
	homeDir: string;
	workflowMetricsDir: string;
	cleanup: () => Promise<void>;
	seedWorkflowEvents: (events: WorkflowJsonlEvent[]) => Promise<void>;
	seedGateEntries: (entries: GateEntry[]) => Promise<void>;
	seedMetricsSnapshots: (snapshots: MetricsSnapshot[]) => Promise<void>;
}

function formatWorkflowTimestamp(input: string): string {
	const date = new Date(input);
	const year = date.getUTCFullYear();
	const month = String(date.getUTCMonth() + 1).padStart(2, "0");
	const day = String(date.getUTCDate()).padStart(2, "0");
	const hours = String(date.getUTCHours()).padStart(2, "0");
	const minutes = String(date.getUTCMinutes()).padStart(2, "0");
	const seconds = String(date.getUTCSeconds()).padStart(2, "0");
	return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function getWorkflowMonth(timestamp: string): string {
	const date = new Date(timestamp);
	const year = date.getUTCFullYear();
	const month = String(date.getUTCMonth() + 1).padStart(2, "0");
	return `${year}-${month}`;
}

export async function createWorkflowFixture(): Promise<WorkflowTestFixture> {
	await mkdir(TEST_DIR, { recursive: true });
	const dir = await mkdtemp(join(TEST_DIR, "phil-ai-workflow-int-"));
	const homeDir = join(dir, "home");
	const workflowMetricsDir = join(homeDir, "Projects", ".workflow", "metrics");

	const previousHome = process.env.HOME;
	process.env.HOME = homeDir;

	await mkdir(workflowMetricsDir, { recursive: true });
	await ensureAllDirs();

	return {
		dir,
		homeDir,
		workflowMetricsDir,
		cleanup: async () => {
			process.env.HOME = previousHome;
			await rm(dir, { recursive: true, force: true });
		},
		seedWorkflowEvents: async (events: WorkflowJsonlEvent[]) => {
			const grouped = new Map<string, WorkflowJsonlEvent[]>();
			for (const event of events) {
				const monthKey = getWorkflowMonth(event.date);
				const bucket = grouped.get(monthKey) ?? [];
				bucket.push(event);
				grouped.set(monthKey, bucket);
			}

			for (const [monthKey, monthEvents] of grouped.entries()) {
				const filePath = join(workflowMetricsDir, `work-${monthKey}.json`);
				const lines = monthEvents.map((event) => {
					const jsonEvent: WorkflowJsonlEvent = {
						...event,
						date: formatWorkflowTimestamp(event.date),
					};
					return JSON.stringify(jsonEvent);
				});
				await writeFile(filePath, `${lines.join("\n")}\n`, "utf-8");
			}
		},
		seedGateEntries: async (entries: GateEntry[]) => {
			const gateLog = new GateLog();
			for (const entry of entries) {
				await gateLog.persist(entry);
			}
		},
		seedMetricsSnapshots: async (snapshots: MetricsSnapshot[]) => {
			const store = new MetricsStore();
			for (const snapshot of snapshots) {
				await store.saveSnapshot(snapshot);
			}
		},
	};
}

export function makeGateEntry(overrides: Partial<GateEntry> = {}): GateEntry {
	return {
		name: "test-gate",
		date: new Date().toISOString(),
		executedBy: "agent",
		result: "pass",
		reason: "seeded gate entry",
		sourceItemId: "seed-item",
		sourceSystem: "workflow-integration-test",
		context: "work",
		role: "maintainer",
		...overrides,
	};
}

export function makeSnapshot(overrides: Partial<MetricsSnapshot> = {}): MetricsSnapshot {
	return {
		period: "2026-03",
		context: "aggregate",
		velocity: 3,
		avgDuration: 6,
		gatePassRate: 0.9,
		activeItems: 2,
		completedItems: 8,
		...overrides,
	};
}
