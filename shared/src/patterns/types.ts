export interface PatternEntry {
	type: string;
	severity: "info" | "warning" | "critical";
	description: string;
	evidence: string;
	suggestedAction: string;
	detectedAt: string;
}

export interface PatternReport {
	generatedAt: string;
	totalPatterns: number;
	entries: PatternEntry[];
	detectorResults: Record<string, { ran: boolean; count: number; error?: string }>;
}
