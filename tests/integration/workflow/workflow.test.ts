import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import "../../setup.js";
import {
	GateLog,
	PatternEngine,
	calculateVelocity,
	computeScorecard,
	detectOrphanedStorage,
	generateReview,
	getOrCreatePhilAiHub,
	readHubConfig,
	sweepAll,
	syncGateLog,
	syncScorecard,
	type NotionClient,
	type NotionDatabaseResult,
	type NotionPageResult,
	type NotionSearchResult,
	type SystemEvent,
} from "@phil-ai/shared";
import { verifyBeforeFinish, verifyBeforeStart, workStatusEnhanced } from "../../../mcp/src/tools/hooks.js";
import { gateLog, verifyWorkflow } from "../../../mcp/src/tools/verification.js";
import { assertDriftDetected, assertGateResult, assertPatternDetected, assertVelocity } from "./assertions.js";
import { createWorkflowFixture, makeGateEntry, makeSnapshot, type WorkflowTestFixture } from "./fixtures.js";

const ENABLED = process.env.RUN_WORKFLOW_TESTS === "true";
const RUN_NOTION_TESTS = process.env.RUN_NOTION_TESTS === "true";

interface TextContent {
	type: string;
	text?: string;
}

interface TextResponse {
	content: TextContent[];
}

interface StoredNotionEntity {
	id: string;
	title: string;
	type: "page" | "database";
	parentPageId: string;
}

class MockNotionClient implements NotionClient {
	private readonly entities: StoredNotionEntity[] = [];

	async searchPages(query: string, parentPageId: string): Promise<NotionSearchResult[]> {
		return this.entities
			.filter((entity) => entity.parentPageId === parentPageId && entity.title === query)
			.map((entity) => ({
				id: entity.id,
				title: entity.title,
				type: entity.type,
			}));
	}

	async createPage(
		parentPageId: string,
		title: string,
		_icon: string,
		_content: string,
	): Promise<NotionPageResult> {
		const id = crypto.randomUUID();
		this.entities.push({ id, title, type: "page", parentPageId });
		return { id, url: `https://notion.local/${id}` };
	}

	async createDatabase(
		parentPageId: string,
		title: string,
		_description: string,
		_schema: string,
	): Promise<NotionDatabaseResult> {
		const id = crypto.randomUUID();
		this.entities.push({ id, title, type: "database", parentPageId });
		return {
			id,
			url: `https://notion.local/${id}`,
			dataSourceId: id,
		};
	}
}

function toText(response: TextResponse): string {
	return response.content
		.filter((item) => item.type === "text")
		.map((item) => item.text ?? "")
		.join("\n");
}

function makeSystemEvent(eventType: string, timestamp: string): SystemEvent {
	return {
		id: crypto.randomUUID(),
		source: "workflow-e2e-test",
		context: "work",
		role: "maintainer",
		eventType,
		timestamp,
	};
}

const originalPersist = GateLog.prototype.persist;
const originalGetEntries = GateLog.prototype.getEntries;
const originalGetPassRate = GateLog.prototype.getPassRate;

describe.skipIf(!ENABLED)("Workflow E2E Integration", () => {
	let fixture: WorkflowTestFixture;
	let memoryGateEntries: Array<Awaited<ReturnType<typeof makeGateEntry>>>;

	beforeEach(async () => {
		fixture = await createWorkflowFixture();
		memoryGateEntries = [];
		GateLog.prototype.persist = async function persist(entry) {
			memoryGateEntries.push(entry);
		};
		GateLog.prototype.getEntries = async function getEntries(dateRange) {
			if (dateRange === undefined) {
				return [...memoryGateEntries];
			}
			return memoryGateEntries.filter((entry) => {
				const entryMs = new Date(entry.date).getTime();
				if (!Number.isFinite(entryMs)) {
					return false;
				}
				if (dateRange.from !== undefined && entryMs < dateRange.from.getTime()) {
					return false;
				}
				if (dateRange.to !== undefined && entryMs > dateRange.to.getTime()) {
					return false;
				}
				return true;
			});
		};
		GateLog.prototype.getPassRate = async function getPassRate(dateRange) {
			const entries = await this.getEntries(dateRange);
			if (entries.length === 0) {
				return 1;
			}
			const passed = entries.filter((entry) => entry.result === "pass").length;
			return passed / entries.length;
		};
	});

	afterEach(async () => {
		GateLog.prototype.persist = originalPersist;
		GateLog.prototype.getEntries = originalGetEntries;
		GateLog.prototype.getPassRate = originalGetPassRate;
		await fixture.cleanup();
	});

	it("Start -> Status -> Finish via MCP tools persists gate log entries", async () => {
		const itemId = "pai-870-scenario-1";

		const startResult = (await verifyBeforeStart.handler({
			itemId,
			itemTitle: "Create workflow e2e integration tests",
			itemType: "feature",
		})) as TextResponse;
		const statusResult = (await workStatusEnhanced.handler({ period: "2026-03" })) as TextResponse;
		const finishResult = (await verifyBeforeFinish.handler({
			itemId,
			currentState: "in-progress",
		})) as TextResponse;
		const gateLogResult = (await gateLog.handler({ limit: 20 })) as TextResponse;

		expect(toText(startResult)).toContain("verify_before_start:");
		expect(toText(statusResult)).toContain("gate-history:");
		expect(toText(finishResult)).toContain("work-finish-completeness: PASS");
		expect(toText(gateLogResult)).toContain("work-start-validation");
		expect(toText(gateLogResult)).toContain("work-finish-completeness");

		const persistedEntries = await new GateLog().getEntries();
		expect(persistedEntries.length).toBeGreaterThanOrEqual(2);
	});

	it("Start -> Block -> Resume -> Finish validates state transitions", async () => {
		const itemId = "pai-870-scenario-2";

		const startTransition = (await verifyWorkflow.handler({
			itemId,
			itemTitle: "State transition validation flow",
			itemType: "feature",
			currentState: "open",
			targetState: "in-progress",
		})) as TextResponse;
		const blockTransition = (await verifyWorkflow.handler({
			itemId,
			itemTitle: "State transition validation flow",
			itemType: "feature",
			currentState: "in-progress",
			targetState: "blocked",
		})) as TextResponse;
		const resumeTransition = (await verifyWorkflow.handler({
			itemId,
			itemTitle: "State transition validation flow",
			itemType: "feature",
			currentState: "blocked",
			targetState: "in-progress",
		})) as TextResponse;
		const finishResult = (await verifyBeforeFinish.handler({
			itemId,
			currentState: "in-progress",
		})) as TextResponse;

		assertGateResult(toText(startTransition), "state-transition-validity", "pass");
		assertGateResult(toText(blockTransition), "state-transition-validity", "pass");
		assertGateResult(toText(resumeTransition), "state-transition-validity", "pass");
		expect(toText(finishResult)).toContain("work-finish-completeness: PASS");
	});

	it("Multiple items -> velocity -> scorecard", async () => {
		const now = Date.now();
		const events: SystemEvent[] = [
			makeSystemEvent("work_finished", new Date(now - 24 * 60 * 60 * 1000).toISOString()),
			makeSystemEvent("work_finished", new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString()),
			makeSystemEvent("work_finished", new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString()),
			makeSystemEvent("work_finished", new Date(now - 6 * 24 * 60 * 60 * 1000).toISOString()),
			makeSystemEvent("work_finished", new Date(now - 8 * 24 * 60 * 60 * 1000).toISOString()),
		];

		const velocity = calculateVelocity(events, { weeks: 4 });
		assertVelocity(velocity, 1);

		const scorecard = computeScorecard(
			{
				events,
				gatePassRate: 0.9,
				velocity,
				avgDuration: 4,
			},
			"2026-03",
		);

		expect(scorecard.average).toBeGreaterThan(0);
		expect(scorecard.dimensions.velocity).toBeDefined();
		expect(scorecard.dimensions.quality).toBeDefined();
	});

	it("Pattern detection with seeded velocity-drop anomaly data", async () => {
		const engine = new PatternEngine();
		const report = await engine.analyze({
			metricsSnapshots: [
				makeSnapshot({ period: "2026-01", velocity: 10 }),
				makeSnapshot({ period: "2026-02", velocity: 6 }),
			],
		});

		assertPatternDetected(report, "velocity-anomaly", "warning");
	});

	it("Drift sweep detects orphaned malformed data", async () => {
		const orphanRoot = join(fixture.dir, "orphaned-storage-test");
		await mkdir(orphanRoot, { recursive: true });
		await writeFile(join(orphanRoot, "broken.json"), "{bad-json", "utf-8");

		const orphaned = await detectOrphanedStorage(orphanRoot);
		expect(orphaned.length).toBeGreaterThan(0);

		const report = await sweepAll();

		expect(report.detectorResults["orphaned-storage"]).toBeDefined();
		assertDriftDetected({ ...report, entries: orphaned, totalIssues: orphaned.length }, "orphaned-storage");
	});

	it("PDCA review from seeded workflow telemetry", async () => {
		const workflowEvents: SystemEvent[] = [
			makeSystemEvent("work_finished", "2026-03-05T11:00:00.000Z"),
			makeSystemEvent("work_finished", "2026-03-12T10:30:00.000Z"),
			makeSystemEvent("work_finished", "2026-03-20T17:15:00.000Z"),
		];

		const gateEntries = [
			makeGateEntry({
				name: "integration-test-gate",
				result: "pass",
				date: "2026-03-10T10:00:00.000Z",
				reason: "seeded passing gate",
			}),
			makeGateEntry({
				name: "integration-test-gate",
				result: "fail",
				date: "2026-03-18T10:00:00.000Z",
				reason: "seeded failing gate",
			}),
		];

		const snapshots = [
			makeSnapshot({
				period: "2026-02",
				velocity: 5,
				completedItems: 12,
				gatePassRate: 0.95,
			}),
			makeSnapshot({
				period: "2026-03",
				velocity: 3,
				completedItems: 8,
				gatePassRate: 0.8,
			}),
		];

		const review = await generateReview("2026-03", {
			events: workflowEvents,
			gateEntries,
			snapshots,
		});

		expect(review.wins.length).toBeGreaterThan(0);
		expect(review.misses.length).toBeGreaterThan(0);
		expect(review.suggestions.length).toBeGreaterThan(0);
	});

	it.skipIf(!RUN_NOTION_TESTS)("Notion sync round-trip", async () => {
		const client = new MockNotionClient();
		const hubConfig = await getOrCreatePhilAiHub(client, "parent-page");
		expect(hubConfig.gateLogDatabaseId).toBeDefined();

		const storedConfig = await readHubConfig();
		expect(storedConfig?.gateLogDatabaseId).toBeDefined();

		const gateEntry = makeGateEntry({
			name: "notion-sync-gate",
			sourceSystem: "workflow-e2e",
			date: "2026-03-20T12:00:00.000Z",
		});

		const firstGateSync = await syncGateLog([gateEntry], client);
		const secondGateSync = await syncGateLog([gateEntry], client);

		expect(firstGateSync.created).toBe(1);
		expect(secondGateSync.skipped).toBe(1);

		const scorecard = computeScorecard(
			{
				events: [makeSystemEvent("work_finished", "2026-03-21T10:00:00.000Z")],
				gatePassRate: 1,
				velocity: 2,
				avgDuration: 2,
			},
			"2026-03",
		);

		const firstScoreSync = await syncScorecard(scorecard, client);
		const secondScoreSync = await syncScorecard(scorecard, client);

		expect(firstScoreSync.status).toBe("created");
		expect(secondScoreSync.status).toBe("skipped");
	});
});
