export interface PDCAWin {
	dimension: string;
	description: string;
	evidence: string;
}

export interface PDCAMiss {
	dimension: string;
	description: string;
	evidence: string;
}

export interface PDCASuggestion {
	action: string;
	rationale: string;
	priority: "high" | "medium" | "low";
}

export interface PDCAReview {
	period: string;
	generatedAt: string;
	wins: PDCAWin[];
	misses: PDCAMiss[];
	suggestions: PDCASuggestion[];
}

export interface Improvement {
	id: string;
	dimension: string;
	action: string;
	outcome?: string;
	startedAt: string;
	completedAt?: string;
}
