import { describe, expect, it } from "bun:test";
import { assertContains, assertNoErrors, summarize } from "../assertions";
import { runHeadless } from "../runner";

const ENABLED = process.env.RUN_HEADLESS_TESTS === "true";

describe.skipIf(!ENABLED)("TDD: learning skill", () => {
  describe("capture learning", () => {
    it("should acknowledge a learning capture request", async () => {
      const result = await runHeadless(
        "I just learned something important: when using Bun's test framework, " +
          "you need to use 'bun:test' imports not 'vitest'. The problem was that " +
          "imports were failing silently. The solution is to always check the " +
          "test framework's import path. Please capture this learning.",
        { timeout: 60_000 },
      );

      console.log("Capture learning:", summarize(result));
      assertNoErrors(result);

      const output = result.messages.map((m) => m.content).join("\n").toLowerCase();
      expect(
        output.includes("learn") ||
          output.includes("captured") ||
          output.includes("noted") ||
          output.includes("recorded"),
      ).toBe(true);
    }, 90_000);
  });

  describe("pressure: competing priorities", () => {
    it("should still capture learnings even when asked to do other things", async () => {
      const result = await runHeadless(
        "I need you to help me with two things: " +
          "1. Capture a learning about proper error handling in async TypeScript " +
          "(problem: unhandled promise rejections crash the process, " +
          "solution: always use try/catch with specific error types). " +
          "2. Also explain what async/await is. " +
          "Make sure you do both tasks.",
        { timeout: 60_000 },
      );

      console.log("Competing priorities:", summarize(result));
      assertNoErrors(result);

      const output = result.messages.map((m) => m.content).join("\n").toLowerCase();
      expect(output.includes("learn") || output.includes("error handling")).toBe(true);
      expect(output.includes("async") || output.includes("await")).toBe(true);
    }, 90_000);
  });

  describe("pressure: ambiguous learning request", () => {
    it("should recognize implicit learning capture requests", async () => {
      const result = await runHeadless(
        "TIL that you can use Bun.serve() for HTTP servers instead of Express. " +
          "It's way faster and doesn't need any dependencies. " +
          "I wish I had known this earlier.",
        { timeout: 60_000 },
      );

      console.log("Implicit learning:", summarize(result));
      assertNoErrors(result);

      const output = result.messages.map((m) => m.content).join("\n").toLowerCase();
      expect(output.includes("bun") || output.includes("server") || output.includes("learn")).toBe(true);
      assertContains(result, "bun");
    }, 90_000);
  });
});
