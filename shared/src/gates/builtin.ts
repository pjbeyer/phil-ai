import type { GateDefinition, GateRoleType } from "../schemas/gate.js";
import type { GateContext, GateEvaluator, GateRunResult } from "./types.js";

const BUILTIN_ROLES: GateRoleType[] = ["maintainer", "contributor", "observer"];
const VALID_ITEM_TYPES = new Set(["feature", "bug", "chore", "refactor"]);

function isNonEmptyString(value: string | undefined): value is string {
	return typeof value === "string" && value.trim().length > 0;
}

const workStartValidationDefinition: GateDefinition = {
	name: "work-start-validation",
	description: "Validates work item metadata before work starts",
	severity: "critical",
	applicableRoles: BUILTIN_ROLES,
};

const workStartValidationEvaluator: GateEvaluator = async (
	context: GateContext,
): Promise<GateRunResult> => {
	if (!isNonEmptyString(context.itemTitle)) {
		return {
			gateName: workStartValidationDefinition.name,
			result: "fail",
			reason: "Item title is required",
		};
	}

	if (
		context.itemType !== undefined &&
		!VALID_ITEM_TYPES.has(context.itemType)
	) {
		return {
			gateName: workStartValidationDefinition.name,
			result: "fail",
			reason: "Item type must be one of: feature, bug, chore, refactor",
		};
	}

	return {
		gateName: workStartValidationDefinition.name,
		result: "pass",
		reason: "Work item metadata is valid",
	};
};

const workFinishCompletenessDefinition: GateDefinition = {
	name: "work-finish-completeness",
	description: "Ensures work item was in-progress before completion",
	severity: "warning",
	applicableRoles: BUILTIN_ROLES,
};

const workFinishCompletenessEvaluator: GateEvaluator = async (
	context: GateContext,
): Promise<GateRunResult> => {
	if (context.currentState !== "in-progress") {
		return {
			gateName: workFinishCompletenessDefinition.name,
			result: "fail",
			reason: "Current state must be 'in-progress' to finish work",
		};
	}

	return {
		gateName: workFinishCompletenessDefinition.name,
		result: "pass",
		reason: "Work item is eligible for completion",
	};
};

const VALID_TRANSITIONS: Record<string, ReadonlySet<string>> = {
	open: new Set(["in-progress"]),
	"in-progress": new Set(["completed", "blocked"]),
	blocked: new Set(["in-progress"]),
};

const stateTransitionValidityDefinition: GateDefinition = {
	name: "state-transition-validity",
	description: "Validates allowed state transitions",
	severity: "critical",
	applicableRoles: BUILTIN_ROLES,
};

const stateTransitionValidityEvaluator: GateEvaluator = async (
	context: GateContext,
): Promise<GateRunResult> => {
	if (!isNonEmptyString(context.currentState) || !isNonEmptyString(context.targetState)) {
		return {
			gateName: stateTransitionValidityDefinition.name,
			result: "fail",
			reason: "Both currentState and targetState are required",
		};
	}

	const allowedTargets = VALID_TRANSITIONS[context.currentState];
	if (allowedTargets === undefined || !allowedTargets.has(context.targetState)) {
		return {
			gateName: stateTransitionValidityDefinition.name,
			result: "fail",
			reason: `Invalid state transition: ${context.currentState} -> ${context.targetState}`,
		};
	}

	return {
		gateName: stateTransitionValidityDefinition.name,
		result: "pass",
		reason: "State transition is valid",
	};
};

export function createBuiltinGates(): Array<{
	definition: GateDefinition;
	evaluator: GateEvaluator;
}> {
	return [
		{
			definition: workStartValidationDefinition,
			evaluator: workStartValidationEvaluator,
		},
		{
			definition: workFinishCompletenessDefinition,
			evaluator: workFinishCompletenessEvaluator,
		},
		{
			definition: stateTransitionValidityDefinition,
			evaluator: stateTransitionValidityEvaluator,
		},
	];
}
