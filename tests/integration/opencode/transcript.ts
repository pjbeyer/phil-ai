import { spawn } from "node:child_process";

export interface TranscriptMessage {
  role: "user" | "assistant";
  content: string;
  toolCalls?: TranscriptToolCall[];
  timestamp?: string;
}

export interface TranscriptToolCall {
  name: string;
  args: Record<string, unknown>;
  result?: string;
}

export interface TranscriptData {
  sessionId: string;
  messages: TranscriptMessage[];
  toolCalls: TranscriptToolCall[];
  metadata?: Record<string, unknown>;
}

interface ExportMessage {
  info?: {
    role?: string;
    time?: {
      created?: number;
    };
  };
  parts?: ExportPart[];
}

interface ExportPart {
  type?: string;
  text?: string;
  tool?: string;
  name?: string;
  toolName?: string;
  input?: unknown;
  args?: unknown;
  arguments?: unknown;
  output?: unknown;
  result?: unknown;
}

interface ExportTranscript {
  info?: {
    id?: string;
  };
  messages?: ExportMessage[];
}

export async function exportTranscript(sessionId: string): Promise<TranscriptData> {
  return new Promise((resolve, reject) => {
    let output = "";
    let errorOutput = "";
    const proc = spawn("opencode", ["export", sessionId]);

    proc.stdout.on("data", (data: Buffer) => {
      output += data.toString();
    });

    proc.stderr.on("data", (data: Buffer) => {
      errorOutput += data.toString();
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`opencode export failed with code ${code}: ${errorOutput.trim()}`));
        return;
      }
      resolve(parseTranscript(output, sessionId));
    });

    proc.on("error", reject);
  });
}

function parseTranscript(raw: string, sessionId: string): TranscriptData {
  const jsonPayload = extractJsonPayload(raw);
  const data = JSON.parse(jsonPayload) as ExportTranscript;

  const messages: TranscriptMessage[] = [];
  const toolCalls: TranscriptToolCall[] = [];

  for (const entry of data.messages ?? []) {
    const role = entry.info?.role === "assistant" ? "assistant" : "user";
    const timestamp = toIsoTimestamp(entry.info?.time?.created);
    const messageToolCalls: TranscriptToolCall[] = [];
    const textParts: string[] = [];

    for (const part of entry.parts ?? []) {
      if (typeof part.text === "string" && part.text.length > 0) {
        textParts.push(part.text);
      }

      if (isToolCallPart(part)) {
        const result = stringifyValue(part.result ?? part.output);
        const call: TranscriptToolCall = {
          name: getToolName(part),
          args: getToolArgs(part),
          ...(result !== undefined ? { result } : {}),
        };
        messageToolCalls.push(call);
        toolCalls.push(call);
      }
    }

    const message: TranscriptMessage = {
      role,
      content: textParts.join("\n"),
      ...(messageToolCalls.length > 0 ? { toolCalls: messageToolCalls } : {}),
      ...(timestamp !== undefined ? { timestamp } : {}),
    };
    messages.push(message);
  }

  const metadata = data.info ? ({ info: data.info } as Record<string, unknown>) : undefined;

  return {
    sessionId: data.info?.id ?? sessionId,
    messages,
    toolCalls,
    ...(metadata !== undefined ? { metadata } : {}),
  };
}

function extractJsonPayload(raw: string): string {
  const firstBrace = raw.indexOf("{");
  if (firstBrace < 0) {
    throw new Error("No JSON object found in opencode export output");
  }
  return raw.slice(firstBrace);
}

function toIsoTimestamp(unixMs: number | undefined): string | undefined {
  if (typeof unixMs !== "number") {
    return undefined;
  }
  return new Date(unixMs).toISOString();
}

function isToolCallPart(part: ExportPart): boolean {
  const type = part.type ?? "";
  if (type.includes("tool")) {
    return true;
  }
  return typeof part.tool === "string" || typeof part.name === "string" || typeof part.toolName === "string";
}

function getToolName(part: ExportPart): string {
  const name = part.toolName ?? part.tool ?? part.name;
  return typeof name === "string" && name.length > 0 ? name : "unknown_tool";
}

function getToolArgs(part: ExportPart): Record<string, unknown> {
  const candidate = part.input ?? part.args ?? part.arguments;
  return toRecord(candidate);
}

function toRecord(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value === "string" && value.length > 0) {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return { value };
    }
  }
  return {};
}

function stringifyValue(value: unknown): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value === "string") {
    return value;
  }
  return JSON.stringify(value);
}

export function getToolSequence(transcript: TranscriptData): string[] {
  return transcript.toolCalls.map((tc) => tc.name);
}

export function getTokenUsage(transcript: TranscriptData): {
  total: number;
  input: number;
  output: number;
} | null {
  const info = transcript.metadata?.info;
  if (typeof info !== "object" || info === null) {
    return null;
  }

  const tokens = (info as Record<string, unknown>).tokens;
  if (typeof tokens !== "object" || tokens === null) {
    return null;
  }

  const tokenRecord = tokens as Record<string, unknown>;
  const input = toNumber(tokenRecord.input);
  const output = toNumber(tokenRecord.output);
  const total = toNumber(tokenRecord.total) || input + output;

  return { total, input, output };
}

function toNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
