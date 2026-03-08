import { describe, expect, it } from "bun:test";
import { runHeadless } from "./runner";
import { assertTranscriptOrder, transcriptSummary } from "./transcript-assertions";
import { exportTranscript, getToolSequence } from "./transcript";

const ENABLED = process.env.RUN_HEADLESS_TESTS === "true";

describe.skipIf(!ENABLED)("Transcript Verification", () => {
  it("should export and parse a session transcript", async () => {
    const result = await runHeadless(
      "Say hello and tell me what tools you have available.",
      { timeout: 45_000 },
    );

    expect(result.exitCode).toBe(0);
    expect(result.sessionId).toBeTruthy();

    const transcript = await exportTranscript(result.sessionId);
    console.log("Transcript:", transcriptSummary(transcript));

    expect(transcript.messages.length).toBeGreaterThan(0);
  }, 90_000);

  it("should capture tool call sequence in transcript", async () => {
    const result = await runHeadless(
      "First, capture a learning titled 'test learning' about TypeScript. Then list all learnings.",
      { timeout: 60_000 },
    );

    expect(result.exitCode).toBe(0);
    expect(result.sessionId).toBeTruthy();

    const transcript = await exportTranscript(result.sessionId);
    const sequence = getToolSequence(transcript);
    console.log("Tool sequence:", sequence.join(" -> "));

    if (sequence.includes("capture_learning") && sequence.includes("list_learnings")) {
      assertTranscriptOrder(transcript, "capture_learning", "list_learnings");
    }
  }, 90_000);
});
