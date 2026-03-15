import { GateDefinitionSchema, GateResult } from "../schemas/gate.js";
import type { GateDefinition } from "../schemas/gate.js";
import type { GateContext, GateEvaluator, GateRunResult, RegisteredGate } from "./types.js";

function validateGateRunResult(result: GateRunResult, gateName: string): GateRunResult {
	if (!GateResult.includes(result.result)) {
		throw new Error(`Gate '${gateName}' returned invalid result: ${result.result}`);
	}

	if (result.gateName !== gateName) {
		return {
			...result,
			gateName,
		};
	}

	return result;
}

export class GateRunner {
	private readonly gates: Map<string, RegisteredGate> = new Map();

	register(definition: GateDefinition, evaluator: GateEvaluator): void {
		const validatedDefinition = GateDefinitionSchema.parse(definition);

		if (this.gates.has(validatedDefinition.name)) {
			throw new Error(`Gate '${validatedDefinition.name}' is already registered`);
		}

		this.gates.set(validatedDefinition.name, {
			definition: validatedDefinition,
			evaluator,
		});
	}

	async evaluate(context: GateContext): Promise<GateRunResult[]> {
		const results: GateRunResult[] = [];

		for (const [gateName, gate] of this.gates) {
			const result = await gate.evaluator(context);
			results.push(validateGateRunResult(result, gateName));
		}

		return results;
	}

	async evaluateGate(gateName: string, context: GateContext): Promise<GateRunResult> {
		const gate = this.gates.get(gateName);
		if (gate === undefined) {
			throw new Error(`Gate '${gateName}' is not registered`);
		}

		const result = await gate.evaluator(context);
		return validateGateRunResult(result, gateName);
	}

	getRegisteredGates(): GateDefinition[] {
		return Array.from(this.gates.values(), (gate) => gate.definition);
	}
}
