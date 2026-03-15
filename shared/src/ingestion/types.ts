export interface DateRange {
	from?: Date;
	to?: Date;
}

export interface IngestOptions {
	dateRange?: DateRange;
}

export interface EventStoreIndex {
	lastUpdated: string;
	totalCount: number;
	sources: Record<string, { count: number; lastIngested: string }>;
}
