import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { z } from "zod";
import { getConfigDir } from "../storage/directories.js";

// ── Schemas ──────────────────────────────────────────────────────────

export const NotionHubConfigSchema = z.object({
	parentPageId: z.string(),
	systemOverviewPageId: z.string().optional(),
	gateLogDatabaseId: z.string().optional(),
	gateLogDataSourceId: z.string().optional(),
	scorecardDatabaseId: z.string().optional(),
	scorecardDataSourceId: z.string().optional(),
	dashboardPageId: z.string().optional(),
	systemStatusPageIds: z
		.record(z.string(), z.string())
		.optional(),
	createdAt: z.string().datetime().optional(),
	updatedAt: z.string().datetime().optional(),
});

export type NotionHubConfig = z.infer<typeof NotionHubConfigSchema>;

// ── Constants ────────────────────────────────────────────────────────

export const PHIL_AI_PARENT_PAGE_ID = "0754676937f542e8a61d8b5033af6d78";

export const MONITORED_SYSTEMS = [
	"phil-ai-workflow",
	"phil-ai-learning",
	"phil-ai-docs",
	"phil-ai-context",
	"phil-ai-guide",
] as const;

export type MonitoredSystem = (typeof MONITORED_SYSTEMS)[number];

export const GATE_LOG_SCHEMA = `CREATE TABLE (
	"gate_name" TITLE,
	"date" DATE,
	"source_system" SELECT(
		'phil-ai-workflow':blue,
		'phil-ai-learning':green,
		'phil-ai-docs':yellow,
		'phil-ai-context':orange,
		'phil-ai-guide':purple
	),
	"executed_by" SELECT('agent':blue, 'manual':green, 'cli':gray),
	"result" SELECT('pass':green, 'fail':red, 'blocked':orange),
	"reason" RICH_TEXT,
	"source_item_id" RICH_TEXT,
	"context" SELECT('work':blue, 'personal':green, 'oss':purple),
	"role" SELECT('maintainer':blue, 'contributor':green, 'observer':gray),
	"credits_used" NUMBER
)`;

export const SCORECARD_SCHEMA = `CREATE TABLE (
	"period" TITLE,
	"date" DATE,
	"context" SELECT('work':blue, 'personal':green, 'oss':purple, 'aggregate':gray),
	"velocity_score" NUMBER,
	"quality_score" NUMBER,
	"consistency_score" NUMBER,
	"throughput_score" NUMBER,
	"average" NUMBER,
	"notes" RICH_TEXT
)`;

// ── Config File Management ───────────────────────────────────────────

function getHubConfigPath(): string {
	return join(getConfigDir(), "notion-hub.json");
}

export async function readHubConfig(): Promise<NotionHubConfig | null> {
	const configPath = getHubConfigPath();
	if (!existsSync(configPath)) {
		return null;
	}
	const content = await readFile(configPath, "utf-8");
	const data: unknown = JSON.parse(content);
	return NotionHubConfigSchema.parse(data);
}

export async function writeHubConfig(
	config: NotionHubConfig,
): Promise<void> {
	const configPath = getHubConfigPath();
	const dir = dirname(configPath);
	await mkdir(dir, { recursive: true });
	const validated = NotionHubConfigSchema.parse({
		...config,
		updatedAt: new Date().toISOString(),
	});
	await writeFile(configPath, JSON.stringify(validated, null, 2), "utf-8");
}

// ── Notion API Types ─────────────────────────────────────────────────

/**
 * Interface for Notion API operations.
 * Implementations should wrap the actual Notion MCP or API client.
 */
export interface NotionClient {
	searchPages(query: string, parentPageId: string): Promise<NotionSearchResult[]>;
	createPage(parentPageId: string, title: string, icon: string, content: string): Promise<NotionPageResult>;
	createDatabase(parentPageId: string, title: string, description: string, schema: string): Promise<NotionDatabaseResult>;
}

export interface NotionSearchResult {
	id: string;
	title: string;
	type: "page" | "database";
}

export interface NotionPageResult {
	id: string;
	url: string;
}

export interface NotionDatabaseResult {
	id: string;
	url: string;
	dataSourceId: string;
}

// ── Hub Setup Functions ──────────────────────────────────────────────

/**
 * Idempotent setup of the Phil AI Notion Hub.
 * Searches for existing pages/databases before creating new ones.
 * Stores resulting IDs in ~/.config/phil-ai/notion-hub.json.
 */
export async function getOrCreatePhilAiHub(
	client: NotionClient,
	parentPageId: string = PHIL_AI_PARENT_PAGE_ID,
): Promise<NotionHubConfig> {
	const existing = await readHubConfig();
	const config: NotionHubConfig = existing ?? {
		parentPageId,
		createdAt: new Date().toISOString(),
	};

	// System Overview page
	if (!config.systemOverviewPageId) {
		const found = await findExistingPage(client, parentPageId, "System Overview");
		if (found) {
			config.systemOverviewPageId = found;
		} else {
			const result = await client.createPage(
				parentPageId,
				"System Overview",
				"\ud83d\udccb",
				buildSystemOverviewContent(),
			);
			config.systemOverviewPageId = result.id;
		}
	}

	// Gate Log database
	if (!config.gateLogDatabaseId) {
		const gateLogResult = await getOrCreateGateLogDb(client, parentPageId);
		config.gateLogDatabaseId = gateLogResult.id;
		config.gateLogDataSourceId = gateLogResult.dataSourceId;
	}

	// Scorecard database
	if (!config.scorecardDatabaseId) {
		const scorecardResult = await getOrCreateScorecardDb(client, parentPageId);
		config.scorecardDatabaseId = scorecardResult.id;
		config.scorecardDataSourceId = scorecardResult.dataSourceId;
	}

	// Dashboard page
	if (!config.dashboardPageId) {
		const found = await findExistingPage(client, parentPageId, "Dashboard");
		if (found) {
			config.dashboardPageId = found;
		} else {
			const result = await client.createPage(
				parentPageId,
				"Dashboard",
				"\ud83d\udcca",
				buildDashboardContent(),
			);
			config.dashboardPageId = result.id;
		}
	}

	// System Status sub-pages
	if (!config.systemStatusPageIds) {
		config.systemStatusPageIds = {};
	}
	for (const system of MONITORED_SYSTEMS) {
		if (!config.systemStatusPageIds[system]) {
			const title = `System Status: ${system}`;
			const found = await findExistingPage(client, parentPageId, title);
			if (found) {
				config.systemStatusPageIds[system] = found;
			} else {
				const result = await client.createPage(
					parentPageId,
					title,
					getSystemIcon(system),
					buildSystemStatusContent(system),
				);
				config.systemStatusPageIds[system] = result.id;
			}
		}
	}

	await writeHubConfig(config);
	return config;
}

/**
 * Idempotent Gate Log database creation.
 */
export async function getOrCreateGateLogDb(
	client: NotionClient,
	parentPageId: string = PHIL_AI_PARENT_PAGE_ID,
): Promise<NotionDatabaseResult> {
	const existing = await readHubConfig();
	if (existing?.gateLogDatabaseId && existing.gateLogDataSourceId) {
		return {
			id: existing.gateLogDatabaseId,
			url: `https://www.notion.so/${existing.gateLogDatabaseId.replace(/-/g, "")}`,
			dataSourceId: existing.gateLogDataSourceId,
		};
	}

	const found = await findExistingDatabase(client, parentPageId, "Gate Log");
	if (found) {
		return found;
	}

	return client.createDatabase(
		parentPageId,
		"Gate Log",
		"Log of all quality gate executions across phil-ai systems",
		GATE_LOG_SCHEMA,
	);
}

/**
 * Idempotent Scorecard database creation.
 */
export async function getOrCreateScorecardDb(
	client: NotionClient,
	parentPageId: string = PHIL_AI_PARENT_PAGE_ID,
): Promise<NotionDatabaseResult> {
	const existing = await readHubConfig();
	if (existing?.scorecardDatabaseId && existing.scorecardDataSourceId) {
		return {
			id: existing.scorecardDatabaseId,
			url: `https://www.notion.so/${existing.scorecardDatabaseId.replace(/-/g, "")}`,
			dataSourceId: existing.scorecardDataSourceId,
		};
	}

	const found = await findExistingDatabase(client, parentPageId, "Scorecard");
	if (found) {
		return found;
	}

	return client.createDatabase(
		parentPageId,
		"Scorecard",
		"Periodic scorecard assessments across velocity, quality, consistency, and throughput dimensions",
		SCORECARD_SCHEMA,
	);
}

// ── Helpers ──────────────────────────────────────────────────────────

async function findExistingPage(
	client: NotionClient,
	parentPageId: string,
	title: string,
): Promise<string | undefined> {
	const results = await client.searchPages(title, parentPageId);
	const match = results.find(
		(r) => r.type === "page" && r.title === title,
	);
	return match?.id;
}

async function findExistingDatabase(
	client: NotionClient,
	parentPageId: string,
	title: string,
): Promise<NotionDatabaseResult | undefined> {
	const results = await client.searchPages(title, parentPageId);
	const match = results.find(
		(r) => r.type === "database" && r.title === title,
	);
	if (match) {
		return {
			id: match.id,
			url: `https://www.notion.so/${match.id.replace(/-/g, "")}`,
			dataSourceId: match.id, // Caller should fetch actual data source ID
		};
	}
	return undefined;
}

function getSystemIcon(system: MonitoredSystem): string {
	const icons: Record<MonitoredSystem, string> = {
		"phil-ai-workflow": "\ud83d\udd27",
		"phil-ai-learning": "\ud83d\udca1",
		"phil-ai-docs": "\ud83d\udcdd",
		"phil-ai-context": "\ud83d\udd17",
		"phil-ai-guide": "\ud83d\udcd6",
	};
	return icons[system];
}

function getSystemDescription(system: MonitoredSystem): string {
	const descriptions: Record<MonitoredSystem, string> = {
		"phil-ai-workflow": "Work tracking, git integration, and workflow management",
		"phil-ai-learning": "Hierarchical learning capture and closed-loop tracking",
		"phil-ai-docs": "Documentation with audience optimization and multi-platform publishing",
		"phil-ai-context": "AGENTS.md optimization, MCP config, and context loading",
		"phil-ai-guide": "User preference system with GUIDE.md files",
	};
	return descriptions[system];
}

function buildSystemOverviewContent(): string {
	const systemRows = MONITORED_SYSTEMS.map(
		(s) => `| ${s} | ${getSystemDescription(s)} | Active |`,
	).join("\n");

	return `# Phil AI System Overview

Phil AI is a CLI-driven AI workflow system that governs cross-platform plugin generation, hierarchical agent workflows, documentation management, and continuous learning.

## What Phil AI Governs

- **Plugin Generation** — Multi-platform AI plugin generation (Claude Code, OpenCode)
- **Quality Gates** — Automated verification gates for code, docs, and workflow quality
- **Metrics & Scorecards** — Velocity, quality, consistency, and throughput tracking
- **Drift Detection** — Pattern drift monitoring across monitored systems
- **PDCA Cycles** — Plan-Do-Check-Act continuous improvement loops

## Monitored Systems

| System | Purpose | Status |
|--------|---------|--------|
${systemRows}

## Key Concepts

- **Gates**: Quality checkpoints that pass/fail/block based on defined criteria
- **Scorecards**: Periodic assessments across velocity, quality, consistency, throughput
- **Contexts**: work, personal, oss — separate tracking per context
- **Roles**: maintainer, contributor, observer — permission-based gate execution`;
}

function buildDashboardContent(): string {
	const systemRows = MONITORED_SYSTEMS.map(
		(s) => `| ${s} | Active | - | - |`,
	).join("\n");

	return `# Phil AI Dashboard

## System Health Summary

| System | Status | Last Gate | Last Score |
|--------|--------|-----------|------------|
${systemRows}

## Recent Activity

*No gate executions recorded yet. Gate entries will appear here as the system processes quality checks.*`;
}

function buildSystemStatusContent(system: MonitoredSystem): string {
	return `# ${system} System Status

## Overview
${getSystemDescription(system)}

## Health
| Metric | Value |
|--------|-------|
| Status | Active |
| Last Gate | - |
| Pass Rate | - |
| Issues | None |`;
}
