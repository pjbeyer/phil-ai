import { describe, expect, test } from "bun:test";
import { GateRunner, createBuiltinGates } from "@phil-ai/shared";

/** Local type matching the GateContext interface from gates/types.ts */
interface TestGateContext {
	itemId: string;
	itemTitle?: string;
	itemType?: string;
	currentState?: string;
	targetState?: string;
	branch?: string;
	profile?: string;
}

describe("GateRunner", () => {
	test("registers gates from createBuiltinGates", () => {
		const runner = new GateRunner();
		const builtinGates = createBuiltinGates();

		for (const gate of builtinGates) {
			runner.register(gate.definition, gate.evaluator);
		}

		const registered = runner.getRegisteredGates();
		expect(registered).toHaveLength(3);
	});

	test("returns all 3 built-in gate definitions", () => {
		const builtinGates = createBuiltinGates();

		expect(builtinGates).toHaveLength(3);

		const names = builtinGates.map((g) => g.definition.name);
		expect(names).toContain("work-start-validation");
		expect(names).toContain("work-finish-completeness");
		expect(names).toContain("state-transition-validity");
	});

	test("throws when registering duplicate gate name", () => {
		const runner = new GateRunner();
		const builtinGates = createBuiltinGates();
		const first = builtinGates[0];

		if (first === undefined) {
			throw new Error("Expected at least one builtin gate");
		}

		runner.register(first.definition, first.evaluator);

		expect(() =>
			runner.register(first.definition, first.evaluator),
		).toThrow("already registered");
	});

	test("evaluates all registered gates", async () => {
		const runner = new GateRunner();
		const builtinGates = createBuiltinGates();

		for (const gate of builtinGates) {
			runner.register(gate.definition, gate.evaluator);
		}

		const context: TestGateContext = {
			itemId: "TEST-1",
			itemTitle: "Test item",
			itemType: "feature",
			currentState: "open",
			targetState: "in-progress",
		};

		const results = await runner.evaluate(context);
		expect(results).toHaveLength(3);

		for (const result of results) {
			expect(result.gateName).toBeDefined();
			expect(["pass", "fail", "blocked"]).toContain(result.result);
			expect(result.reason).toBeDefined();
		}
	});

	test("evaluates a single gate by name", async () => {
		const runner = new GateRunner();
		const builtinGates = createBuiltinGates();

		for (const gate of builtinGates) {
			runner.register(gate.definition, gate.evaluator);
		}

		const context: TestGateContext = {
			itemId: "TEST-1",
			itemTitle: "Valid title",
		};

		const result = await runner.evaluateGate(
			"work-start-validation",
			context,
		);
		expect(result.gateName).toBe("work-start-validation");
		expect(result.result).toBe("pass");
	});

	test("throws when evaluating non-existent gate", async () => {
		const runner = new GateRunner();

		const context: TestGateContext = { itemId: "TEST-1" };

		await expect(
			runner.evaluateGate("non-existent-gate", context),
		).rejects.toThrow("not registered");
	});
});

describe("work-start-validation gate", () => {
	function createRunner(): GateRunner {
		const runner = new GateRunner();
		const builtinGates = createBuiltinGates();
		for (const gate of builtinGates) {
			runner.register(gate.definition, gate.evaluator);
		}
		return runner;
	}

	test("passes with valid item title", async () => {
		const runner = createRunner();
		const context: TestGateContext = {
			itemId: "FEAT-1",
			itemTitle: "Implement user authentication",
			itemType: "feature",
		};

		const result = await runner.evaluateGate(
			"work-start-validation",
			context,
		);
		expect(result.result).toBe("pass");
		expect(result.reason).toContain("valid");
	});

	test("fails with empty title", async () => {
		const runner = createRunner();
		const context: TestGateContext = {
			itemId: "FEAT-1",
			itemTitle: "",
		};

		const result = await runner.evaluateGate(
			"work-start-validation",
			context,
		);
		expect(result.result).toBe("fail");
		expect(result.reason).toContain("title");
	});

	test("fails with undefined title", async () => {
		const runner = createRunner();
		const context: TestGateContext = {
			itemId: "FEAT-1",
		};

		const result = await runner.evaluateGate(
			"work-start-validation",
			context,
		);
		expect(result.result).toBe("fail");
	});

	test("fails with whitespace-only title", async () => {
		const runner = createRunner();
		const context: TestGateContext = {
			itemId: "FEAT-1",
			itemTitle: "   ",
		};

		const result = await runner.evaluateGate(
			"work-start-validation",
			context,
		);
		expect(result.result).toBe("fail");
	});

	test("fails with invalid item type", async () => {
		const runner = createRunner();
		const context: TestGateContext = {
			itemId: "FEAT-1",
			itemTitle: "Valid title",
			itemType: "invalid_type",
		};

		const result = await runner.evaluateGate(
			"work-start-validation",
			context,
		);
		expect(result.result).toBe("fail");
		expect(result.reason).toContain("type");
	});

	test("passes with valid item types", async () => {
		const runner = createRunner();
		const validTypes = ["feature", "bug", "chore", "refactor"];

		for (const itemType of validTypes) {
			const context: TestGateContext = {
				itemId: "FEAT-1",
				itemTitle: "Valid title",
				itemType,
			};

			const result = await runner.evaluateGate(
				"work-start-validation",
				context,
			);
			expect(result.result).toBe("pass");
		}
	});

	test("passes when itemType is undefined", async () => {
		const runner = createRunner();
		const context: TestGateContext = {
			itemId: "FEAT-1",
			itemTitle: "Valid title",
		};

		const result = await runner.evaluateGate(
			"work-start-validation",
			context,
		);
		expect(result.result).toBe("pass");
	});
});

describe("work-finish-completeness gate", () => {
	function createRunner(): GateRunner {
		const runner = new GateRunner();
		const builtinGates = createBuiltinGates();
		for (const gate of builtinGates) {
			runner.register(gate.definition, gate.evaluator);
		}
		return runner;
	}

	test("passes when current state is in-progress", async () => {
		const runner = createRunner();
		const context: TestGateContext = {
			itemId: "FEAT-1",
			currentState: "in-progress",
		};

		const result = await runner.evaluateGate(
			"work-finish-completeness",
			context,
		);
		expect(result.result).toBe("pass");
		expect(result.reason).toContain("eligible");
	});

	test("fails when current state is open", async () => {
		const runner = createRunner();
		const context: TestGateContext = {
			itemId: "FEAT-1",
			currentState: "open",
		};

		const result = await runner.evaluateGate(
			"work-finish-completeness",
			context,
		);
		expect(result.result).toBe("fail");
		expect(result.reason).toContain("in-progress");
	});

	test("fails when current state is undefined", async () => {
		const runner = createRunner();
		const context: TestGateContext = {
			itemId: "FEAT-1",
		};

		const result = await runner.evaluateGate(
			"work-finish-completeness",
			context,
		);
		expect(result.result).toBe("fail");
	});

	test("fails when current state is completed", async () => {
		const runner = createRunner();
		const context: TestGateContext = {
			itemId: "FEAT-1",
			currentState: "completed",
		};

		const result = await runner.evaluateGate(
			"work-finish-completeness",
			context,
		);
		expect(result.result).toBe("fail");
	});
});

describe("state-transition-validity gate", () => {
	function createRunner(): GateRunner {
		const runner = new GateRunner();
		const builtinGates = createBuiltinGates();
		for (const gate of builtinGates) {
			runner.register(gate.definition, gate.evaluator);
		}
		return runner;
	}

	test("passes for valid transition: open -> in-progress", async () => {
		const runner = createRunner();
		const context: TestGateContext = {
			itemId: "FEAT-1",
			currentState: "open",
			targetState: "in-progress",
		};

		const result = await runner.evaluateGate(
			"state-transition-validity",
			context,
		);
		expect(result.result).toBe("pass");
		expect(result.reason).toContain("valid");
	});

	test("passes for valid transition: in-progress -> completed", async () => {
		const runner = createRunner();
		const context: TestGateContext = {
			itemId: "FEAT-1",
			currentState: "in-progress",
			targetState: "completed",
		};

		const result = await runner.evaluateGate(
			"state-transition-validity",
			context,
		);
		expect(result.result).toBe("pass");
	});

	test("passes for valid transition: in-progress -> blocked", async () => {
		const runner = createRunner();
		const context: TestGateContext = {
			itemId: "FEAT-1",
			currentState: "in-progress",
			targetState: "blocked",
		};

		const result = await runner.evaluateGate(
			"state-transition-validity",
			context,
		);
		expect(result.result).toBe("pass");
	});

	test("passes for valid transition: blocked -> in-progress", async () => {
		const runner = createRunner();
		const context: TestGateContext = {
			itemId: "FEAT-1",
			currentState: "blocked",
			targetState: "in-progress",
		};

		const result = await runner.evaluateGate(
			"state-transition-validity",
			context,
		);
		expect(result.result).toBe("pass");
	});

	test("fails for invalid transition: open -> completed", async () => {
		const runner = createRunner();
		const context: TestGateContext = {
			itemId: "FEAT-1",
			currentState: "open",
			targetState: "completed",
		};

		const result = await runner.evaluateGate(
			"state-transition-validity",
			context,
		);
		expect(result.result).toBe("fail");
		expect(result.reason).toContain("Invalid state transition");
	});

	test("fails for invalid transition: open -> blocked", async () => {
		const runner = createRunner();
		const context: TestGateContext = {
			itemId: "FEAT-1",
			currentState: "open",
			targetState: "blocked",
		};

		const result = await runner.evaluateGate(
			"state-transition-validity",
			context,
		);
		expect(result.result).toBe("fail");
	});

	test("fails for invalid transition: completed -> open", async () => {
		const runner = createRunner();
		const context: TestGateContext = {
			itemId: "FEAT-1",
			currentState: "completed",
			targetState: "open",
		};

		const result = await runner.evaluateGate(
			"state-transition-validity",
			context,
		);
		expect(result.result).toBe("fail");
	});

	test("fails when currentState is missing", async () => {
		const runner = createRunner();
		const context: TestGateContext = {
			itemId: "FEAT-1",
			targetState: "in-progress",
		};

		const result = await runner.evaluateGate(
			"state-transition-validity",
			context,
		);
		expect(result.result).toBe("fail");
		expect(result.reason).toContain("required");
	});

	test("fails when targetState is missing", async () => {
		const runner = createRunner();
		const context: TestGateContext = {
			itemId: "FEAT-1",
			currentState: "open",
		};

		const result = await runner.evaluateGate(
			"state-transition-validity",
			context,
		);
		expect(result.result).toBe("fail");
		expect(result.reason).toContain("required");
	});

	test("fails when both states are missing", async () => {
		const runner = createRunner();
		const context: TestGateContext = {
			itemId: "FEAT-1",
		};

		const result = await runner.evaluateGate(
			"state-transition-validity",
			context,
		);
		expect(result.result).toBe("fail");
	});
});
