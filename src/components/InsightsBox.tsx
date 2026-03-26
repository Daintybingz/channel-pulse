"use client";

import { useMemo } from "react";
import type { Video } from "@/lib/types";
import { formatNumber } from "@/lib/format";

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function InsightsBox({
  videos,
  rangeDays
}: {
  videos: Video[];
  rangeDays: 7 | 30;
}) {
  const insights = useMemo(() => {
    if (videos.length === 0) return null;

    const avgVpdAll = average(videos.map((v) => v.viewsPerDay));
    const last7 = videos.filter((v) => v.daysSinceUpload <= 7);
    const older = videos.filter((v) => v.daysSinceUpload > 7);

    if (rangeDays === 7) {
      const top = [...videos].sort((a, b) => b.viewsPerDay - a.viewsPerDay)[0];
      return {
        title: "Signal summary (last 7 days)",
        lines: [
          `Average pace: ${formatNumber(avgVpdAll)} views/day`,
          top ? `Best performer: ${top.title}` : ""
        ].filter(Boolean)
      };
    }

    const avgLast7 = average(last7.map((v) => v.viewsPerDay));
    const avgOlder = average(older.map((v) => v.viewsPerDay));

    const ratio =
      avgOlder > 0 ? avgLast7 / avgOlder : avgLast7 > 0 ? Infinity : 0;

    let pattern = "Similar momentum";
    if (ratio >= 1.2) pattern = "Recent uploads are outperforming older ones";
    if (ratio <= 0.83) pattern = "Older uploads are keeping stronger momentum";

    return {
      title: "Momentum insight (7 vs 8–30 days)",
      lines: [
        `Last 7 days avg: ${formatNumber(avgLast7)} views/day`,
        `8–30 days avg: ${formatNumber(avgOlder)} views/day`,
        pattern
      ]
    };
  }, [videos, rangeDays]);

  if (!insights) return null;

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-5">
      <h2 className="text-base font-semibold text-slate-100">{insights.title}</h2>
      <ul className="mt-3 space-y-2">
        {insights.lines.map((line, idx) => (
          <li key={idx} className="text-sm text-slate-200">
            {line}
          </li>
        ))}
      </ul>
    </section>
  );
}

