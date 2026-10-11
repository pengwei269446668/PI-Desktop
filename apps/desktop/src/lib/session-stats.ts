import type { UiMessage } from "@pi-desktop/shared";
import { calculateCacheRate, calculateTokenRate, usageTokenTotal } from "./context-usage";

export type SessionStats = {
  /** Visible user turns in the loaded window (steering/system rows excluded). */
  turns: number;
  /** Tool executions in the loaded window. */
  steps: number;
  /** Sum of provider-reported totals across assistant turns. */
  totalTokens: number;
  /** Average output throughput across turns that reported timing. */
  throughput?: number;
  /** Aggregate prompt cache hit rate, when any turn reported cache reads. */
  cacheRate?: number;
};

function positive(value: number | undefined): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.round(value)
    : 0;
}

/**
 * Aggregate session statistics for the composer stats bar. The renderer holds
 * a windowed transcript, so totals describe the loaded window rather than the
 * full durable session.
 */
export function calculateSessionStats(messages: UiMessage[]): SessionStats {
  let turns = 0;
  let steps = 0;
  let totalTokens = 0;
  let outputTokens = 0;
  let durationMs = 0;
  let inputTokens = 0;
  let cacheReadTokens = 0;
  let hasCacheData = false;

  for (const message of messages) {
    if (message.role === "user" && !message.modelSystem && !message.steering) {
      turns += 1;
    }
    if (message.role === "tool") steps += 1;

    const usage = message.usage;
    if (!usage) continue;
    totalTokens += usageTokenTotal(usage);
    outputTokens += positive(message.responseOutputTokens) || positive(usage.outputTokens);
    inputTokens += positive(usage.inputTokens);
    if (
      typeof usage.cacheReadTokens === "number" &&
      Number.isFinite(usage.cacheReadTokens) &&
      usage.cacheReadTokens >= 0
    ) {
      cacheReadTokens += usage.cacheReadTokens;
      hasCacheData = true;
    }
    if (
      typeof message.responseDurationMs === "number" &&
      Number.isFinite(message.responseDurationMs) &&
      message.responseDurationMs > 0
    ) {
      durationMs += message.responseDurationMs;
    }
  }

  return {
    turns,
    steps,
    totalTokens,
    throughput: calculateTokenRate(outputTokens, durationMs),
    // Cache reads are only meaningful once at least one turn reported them.
    cacheRate: hasCacheData ? calculateCacheRate(inputTokens, cacheReadTokens) : undefined,
  };
}
