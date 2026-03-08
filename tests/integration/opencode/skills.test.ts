import { beforeAll, describe, expect, it } from "bun:test";
import { assertNoErrors, summarize } from "./assertions";
import { runHeadless } from "./runner";

const ENABLED = process.env.RUN_HEADLESS_TESTS === "true";

describe.skipIf(!ENABLED)("OpenCode Plugin Skill Tests", () => {
  beforeAll(() => {
    console.log("Running skill-level headless tests...");
  });

  describe("learning skill", () => {
    it(
      "should invoke capture_learning when asked to capture a learning",
      async () => {
        const result = await runHeadless(
          "Capture a learning: title='TypeScript generics are powerful', problem='Needed to create type-safe utility functions', solution='Used generic constraints with extends keyword'",
          { timeout: 60_000 },
        );

        console.log("Learning capture:", summarize(result));
        assertNoErrors(result);

        const output = result.messages
          .map((message) => message.content)
          .join("\n")
          .toLowerCase();

        expect(
          output.includes("learning") || output.includes("captured") || output.includes("typescript"),
        ).toBe(true);
      },
      90_000,
    );
  });

  describe("docs skill", () => {
    it(
      "should acknowledge documentation capabilities",
      async () => {
        const result = await runHeadless(
          "What documentation tools do you have available? Can you write docs?",
          { timeout: 45_000 },
        );

        console.log("Docs skill:", summarize(result));
        assertNoErrors(result);
      },
      60_000,
    );
  });
});
