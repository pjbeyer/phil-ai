import type { DateRange } from "../ingestion/types.js";

export interface MetricsOptions {
	dateRange?: DateRange;
	context?: "work" | "personal" | "oss" | "aggregate";
}

export interface VelocityWindow {
	weeks: number;
}

export interface DurationResult {
	issueId: string;
	branch: string;
	startedAt: string;
	completedAt: string | null;
	durationHours: number | null;
}
