import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { formatCompactTokenCount, type UiMessage } from "@pi-desktop/shared";
import type { LatestTurnContextInspector } from "../lib/latest-turn-context";
import { calculateSessionStats } from "../lib/session-stats";
import { IconClock, IconDatabase } from "./icons";
import { ContextUsageInspector } from "./ContextUsageInspector";

type SessionStatsBarProps = {
  messages: UiMessage[];
  inspector?: LatestTurnContextInspector;
};

/**
 * One quiet row under the composer summarising the loaded session window:
 * turns/steps/throughput, total tokens with the cache hit rate, and the
 * context inspector ring, which opens the same context popover on click.
 */
export function SessionStatsBar({ messages, inspector }: SessionStatsBarProps) {
  const { t } = useTranslation();
  const stats = useMemo(() => calculateSessionStats(messages), [messages]);

  const hasTimingGroup =
    stats.turns > 0 || stats.steps > 0 || stats.throughput !== undefined;
  if (!hasTimingGroup && stats.totalTokens === 0 && !inspector) return null;

  return (
    <div className="session-stats-bar" role="status">
      {hasTimingGroup ? (
        <span className="session-stats-group">
          <IconClock size={12} aria-hidden="true" />
          {stats.turns > 0 ? (
            <span>{t("chat.sessionStatsTurns", { count: stats.turns })}</span>
          ) : null}
          {stats.steps > 0 ? (
            <span>{t("chat.sessionStatsSteps", { count: stats.steps })}</span>
          ) : null}
          {stats.throughput !== undefined ? (
            <span>{t("chat.sessionStatsThroughput", { count: stats.throughput })}</span>
          ) : null}
        </span>
      ) : null}
      {stats.totalTokens > 0 ? (
        <span className="session-stats-group">
          <IconDatabase size={12} aria-hidden="true" />
          <span>
            {t("chat.sessionStatsTokens", {
              value: formatCompactTokenCount(stats.totalTokens),
            })}
          </span>
          {stats.cacheRate !== undefined ? (
            <>
              <span className="session-stats-sep" aria-hidden="true">·</span>
              <span>
                {t("chat.sessionStatsCacheHit", { percent: stats.cacheRate })}
              </span>
            </>
          ) : null}
        </span>
      ) : null}
      {inspector ? (
        <ContextUsageInspector {...inspector} />
      ) : null}
    </div>
  );
}
