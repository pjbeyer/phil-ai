import { expect } from "bun:test";
import type { TranscriptData } from "./transcript";
import { getToolSequence } from "./transcript";

export function assertTranscriptToolCalled(
  transcript: TranscriptData,
  toolName: string,
): void {
  const found = transcript.toolCalls.some((tc) => tc.name === toolName);
  expect(found).toBe(true);
}

export function assertTranscriptOrder(
  transcript: TranscriptData,
  ...toolNames: string[]
): void {
  const sequence = getToolSequence(transcript);
  let lastIndex = -1;

  for (const name of toolNames) {
    const index = sequence.indexOf(name, lastIndex + 1);
    expect(index).toBeGreaterThan(lastIndex);
    lastIndex = index;
  }
}

export function assertTranscriptToolCount(
  transcript: TranscriptData,
  toolName: string,
  count: number,
): void {
  const actual = transcript.toolCalls.filter((tc) => tc.name === toolName).length;
  expect(actual).toBe(count);
}

export function assertTranscriptToolNotCalled(
  transcript: TranscriptData,
  toolName: string,
): void {
  const found = transcript.toolCalls.some((tc) => tc.name === toolName);
  expect(found).toBe(false);
}

export function transcriptSummary(transcript: TranscriptData): string {
  const sequence = getToolSequence(transcript);
  return [
    `Session: ${transcript.sessionId}`,
    `Messages: ${transcript.messages.length}`,
    `Tool calls: ${sequence.join(" -> ") || "none"}`,
  ].join(" | ");
}
