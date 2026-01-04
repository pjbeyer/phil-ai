export type HealthStatus = "healthy" | "degraded" | "unhealthy";

export interface HealthCheckResult {
	name: string;
	status: HealthStatus;
	message: string;
	details?: Record<string, unknown>;
}

export interface HealthChecker {
	name: string;
	check(): Promise<HealthCheckResult>;
}

export function aggregateStatus(results: HealthCheckResult[]): HealthStatus {
	if (results.some((r) => r.status === "unhealthy")) {
		return "unhealthy";
	}
	if (results.some((r) => r.status === "degraded")) {
		return "degraded";
	}
	return "healthy";
}

export function getStatusIcon(status: HealthStatus): string {
	switch (status) {
		case "healthy":
			return "✓";
		case "degraded":
			return "!";
		case "unhealthy":
			return "✗";
	}
}
