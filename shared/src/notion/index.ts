export {
	// Schemas
	NotionHubConfigSchema,
	type NotionHubConfig,

	// Constants
	PHIL_AI_PARENT_PAGE_ID,
	MONITORED_SYSTEMS,
	type MonitoredSystem,
	GATE_LOG_SCHEMA,
	SCORECARD_SCHEMA,

	// Config management
	readHubConfig,
	writeHubConfig,

	// Notion API types
	type NotionClient,
	type NotionSearchResult,
	type NotionPageResult,
	type NotionDatabaseResult,

	// Hub setup functions
	getOrCreatePhilAiHub,
	getOrCreateGateLogDb,
	getOrCreateScorecardDb,
} from "./hub.js";
