import { expect } from "bun:test";
import type { HeadlessResult } from "./runner";

export function assertToolCalled(result: HeadlessResult, toolName: string): void {
  const found = result.toolCalls.some((tc) => tc.name === toolName);
  expect(found).toBe(true);
}

export function assertToolArgs(
  result: HeadlessResult,
  toolName: string,
  expectedArgs: Record<string, unknown>,
): void {
  const call = result.toolCalls.find((tc) => tc.name === toolName);
  expect(call).toBeDefined();
  for (const [key, value] of Object.entries(expectedArgs)) {
    expect(call?.args[key]).toEqual(value);
  }
}

export function assertContains(result: HeadlessResult, text: string): void {
  const allContent = result.messages.map((m) => m.content).join("\n");
  expect(allContent).toContain(text);
}

export function assertOrder(result: HeadlessResult, ...toolNames: string[]): void {
  const calledTools = result.toolCalls.map((tc) => tc.name);
  let lastIndex = -1;
  for (const name of toolNames) {
    const index = calledTools.indexOf(name, lastIndex + 1);
    expect(index).toBeGreaterThan(lastIndex);
    lastIndex = index;
  }
}

export function assertNoErrors(result: HeadlessResult): void {
  expect(result.exitCode).toBe(0);
  expect(result.error).toBeUndefined();
}

export function assertToolNotCalled(result: HeadlessResult, toolName: string): void {
  const found = result.toolCalls.some((tc) => tc.name === toolName);
  expect(found).toBe(false);
}

export function assertDuration(result: HeadlessResult, maxMs: number): void {
  expect(result.duration).toBeLessThanOrEqual(maxMs);
}

export function summarize(result: HeadlessResult): string {
  return [
    `Exit: ${result.exitCode}`,
    `Duration: ${result.duration}ms`,
    `Messages: ${result.messages.length}`,
    `Tool calls: ${result.toolCalls.map((tc) => tc.name).join(", ") || "none"}`,
    result.error ? `Error: ${result.error}` : "",
  ]
    .filter(Boolean)
    .join(" | ");
}
