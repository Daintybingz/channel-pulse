"use client";

import { useMemo, useState } from "react";
import type { Video } from "@/lib/types";
import { formatDate, formatNumber } from "@/lib/format";
import { Thumbnail } from "@/components/Thumbnail";

function escapeCsvCell(value: string): string {
  const v = value ?? "";
  if (/[,"\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export function VideoTable({
  videos,
  loading
}: {
  videos: Video[];
  loading?: boolean;
}) {
  const [sortKey, setSortKey] = useState<"views" | "viewsPerDay" | "uploadDate">(
    "viewsPerDay"
  );

  const sorted = useMemo(() => {
    const copy = [...videos];
    copy.sort((a, b) => {
      if (sortKey === "views") return b.views - a.views;
      if (sortKey === "viewsPerDay") return b.viewsPerDay - a.viewsPerDay;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });
    return copy;
  }, [videos, sortKey]);

  function exportCsv() {
    const header = [
      "Title",
      "Thumbnail",
      "Views",
      "Likes",
      "Upload date",
      "Views per day"
    ];

    const rows = sorted.map((v) => [
      v.title,
      v.thumbnailUrl,
      String(v.views),
      String(v.likes),
      v.publishedAt,
      String(v.viewsPerDay)
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => escapeCsvCell(String(cell))).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "channelpulse-videos.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="cp-card rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-100">Video table</h2>
          <p className="text-xs text-slate-400">Sort and compare performance signals</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs text-slate-300">
            Sort by{" "}
            <select
              value={sortKey}
              onChange={(e) =>
                setSortKey(e.target.value as "views" | "viewsPerDay" | "uploadDate")
              }
              className="ml-1 rounded-lg border border-white/10 bg-slate-900/40 px-2 py-1 text-xs text-slate-100 outline-none transition focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="views">Views</option>
              <option value="viewsPerDay">Views per day</option>
              <option value="uploadDate">Upload date</option>
            </select>
          </label>

          <button
            type="button"
            onClick={exportCsv}
            disabled={loading || videos.length === 0}
            className="rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2 text-xs font-semibold text-slate-100 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-900/60 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
        {loading ? (
          <div className="p-4">
            <div className="h-8 w-2/5 animate-pulse rounded bg-slate-700/40" />
            <div className="mt-3 h-64 animate-pulse rounded bg-slate-700/30" />
          </div>
        ) : videos.length === 0 ? (
          <div className="p-4 text-sm text-slate-300">
            No videos found for this time window. Try a different range.
          </div>
        ) : (
          <table className="min-w-[680px] w-full border-separate border-spacing-0 sm:min-w-[760px]">
            <thead className="bg-slate-900/40">
              <tr>
                <th className="w-20 px-4 py-3 text-left text-xs font-semibold text-slate-300">
                  Thumbnail
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">
                  Title
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-300">
                  Views
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-300">
                  Likes
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-300">
                  Upload date
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-300">
                  Views/day
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 bg-slate-950/10">
              {sorted.map((v) => (
                <tr key={v.id} className="transition hover:bg-slate-900/20">
                  <td className="px-4 py-3">
                    <Thumbnail
                      src={v.thumbnailUrl}
                      alt={v.title}
                      className="h-14 w-20"
                      fallbackText="CP"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <p className="line-clamp-2 text-sm font-medium text-slate-100">
                      {v.title}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-slate-100">
                    {formatNumber(v.views)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-slate-100">
                    {formatNumber(v.likes)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-slate-200">
                    {formatDate(v.publishedAt)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-amber-200">
                    {formatNumber(v.viewsPerDay)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

