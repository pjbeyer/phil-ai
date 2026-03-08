import { describe, expect, it } from "bun:test";
import { assertNoErrors, assertToolCalled, summarize } from "../assertions";
import { runHeadless } from "../runner";

const ENABLED = process.env.RUN_HEADLESS_TESTS === "true";
const TEMPLATE_READY = false;
const SKILL_NAME = "my_skill";

describe.skipIf(!ENABLED || !TEMPLATE_READY)(`TDD: ${SKILL_NAME} skill`, () => {
  describe("baseline (without skill)", () => {
    it("captures baseline behavior for a skill-dependent prompt", async () => {
      const result = await runHeadless("CHANGE: Your test prompt here", {
        timeout: 60_000,
      });

      console.log("Baseline:", summarize(result));
      expect(result.exitCode).toBe(0);
    }, 90_000);
  });

  describe("with skill installed", () => {
    it("invokes the skill tool for relevant prompts", async () => {
      const result = await runHeadless("CHANGE: Your test prompt here", {
        timeout: 60_000,
      });

      console.log("With skill:", summarize(result));
      assertNoErrors(result);
      assertToolCalled(result, SKILL_NAME);
    }, 90_000);
  });

  describe("pressure scenarios", () => {
    it("handles ambiguous prompts", async () => {
      const result = await runHeadless(
        "CHANGE: Ambiguous prompt that might or might not need the skill",
        { timeout: 60_000 },
      );

      console.log("Ambiguous:", summarize(result));
      assertNoErrors(result);
      expect(result.exitCode).toBe(0);
    }, 90_000);
  });
});
