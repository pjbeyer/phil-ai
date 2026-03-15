import type { GateDefinition } from "../schemas/gate.js";

export type GateEvaluator = (context: GateContext) => Promise<GateRunResult>;

export interface GateContext {
	itemId: string;
	itemTitle?: string;
	itemType?: string;
	currentState?: string;
	targetState?: string;
	branch?: string;
	profile?: string;
}

export interface GateRunResult {
	gateName: string;
	result: "pass" | "fail" | "blocked";
	reason: string;
	creditsUsed?: number;
}

export interface RegisteredGate {
	definition: GateDefinition;
	evaluator: GateEvaluator;
}
