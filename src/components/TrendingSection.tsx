/* eslint-disable @next/next/no-img-element */
"use client";

import type { Video } from "@/lib/types";
import { formatNumber } from "@/lib/format";

export function TrendingSection({
  videos,
  loading
}: {
  videos: Video[];
  loading?: boolean;
}) {
  if (loading) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-base font-semibold text-slate-100">Trending now</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div
              key={idx}
              className="animate-pulse rounded-xl border border-white/10 bg-slate-900/30 p-3"
            >
              <div className="h-28 w-full rounded-lg bg-slate-700/40" />
              <div className="mt-3 h-4 w-3/4 rounded bg-slate-700/40" />
              <div className="mt-2 h-4 w-1/2 rounded bg-slate-700/40" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-100">Trending now</h2>
        <p className="text-xs text-slate-400">Top uploads by views per day</p>
      </div>

      {videos.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-white/10 bg-slate-900/20 p-4 text-sm text-slate-300">
          No videos found for this time window.
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {videos.slice(0, 5).map((v) => (
            <article
              key={v.id}
              className="group relative overflow-hidden rounded-xl border border-white/10 bg-slate-900/20 p-3"
            >
              <div className="absolute right-3 top-3 rounded-full bg-rose-500/15 px-2 py-1 text-[11px] font-semibold text-rose-200 ring-1 ring-rose-500/30">
                Trending
              </div>
              <img
                src={v.thumbnailUrl}
                alt={v.title}
                className="h-28 w-full rounded-lg object-cover"
              />
              <h3 className="mt-3 line-clamp-2 text-sm font-medium text-slate-100">
                {v.title}
              </h3>
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-xs text-slate-400">Views</p>
                <p className="text-xs font-semibold text-slate-100">
                  {formatNumber(v.views)}
                </p>
              </div>
              <div className="mt-1 flex items-center justify-between gap-2">
                <p className="text-xs text-slate-400">Views/day</p>
                <p className="text-xs font-semibold text-sky-200">
                  {formatNumber(v.viewsPerDay)}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

