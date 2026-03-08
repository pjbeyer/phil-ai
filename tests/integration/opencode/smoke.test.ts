import { beforeAll, describe, expect, it } from "bun:test";
import { assertContains, assertNoErrors, summarize } from "./assertions";
import { runHeadless } from "./runner";

const ENABLED = process.env.RUN_HEADLESS_TESTS === "true";

describe.skipIf(!ENABLED)("OpenCode Plugin Smoke Tests", () => {
  beforeAll(() => {
    console.log("Running headless tests with real API calls...");
    console.log("Model: anthropic/claude-sonnet-4-6");
  });

  it(
    "should complete a basic prompt without errors",
    async () => {
      const result = await runHeadless("Say 'hello world' and nothing else.", {
        timeout: 30_000,
      });

      console.log("Smoke test:", summarize(result));
      assertNoErrors(result);
      assertContains(result, "hello");
    },
    60_000,
  );

  it(
    "should have access to phil-ai-dev skills",
    async () => {
      const result = await runHeadless(
        "List all available skills. Include any phil-ai or phil-ai-dev skills you can see.",
        { timeout: 45_000 },
      );

      console.log("Skills test:", summarize(result));
      assertNoErrors(result);

      const output = result.messages
        .map((message) => message.content)
        .join("\n")
        .toLowerCase();

      expect(
        output.includes("phil-ai") || output.includes("learning") || output.includes("skill"),
      ).toBe(true);
    },
    60_000,
  );
});
