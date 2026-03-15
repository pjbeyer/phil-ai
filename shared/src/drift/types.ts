export interface DriftEntry {
	type: string;
	severity: "info" | "warning" | "critical";
	description: string;
	path?: string;
	itemId?: string;
	detectedAt: string;
	suggestedAction?: string;
}

export interface DriftReport {
	generatedAt: string;
	totalIssues: number;
	entries: DriftEntry[];
	detectorResults: Record<string, { ran: boolean; count: number; error?: string }>;
}
