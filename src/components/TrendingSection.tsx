"use client";

import type { Video } from "@/lib/types";
import { formatNumber } from "@/lib/format";
import { Thumbnail } from "@/components/Thumbnail";

export function TrendingSection({
  videos,
  loading
}: {
  videos: Video[];
  loading?: boolean;
}) {
  if (loading) {
    return (
      <section className="cp-card rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-5">
        <h2 className="text-base font-semibold text-slate-100">Trending board</h2>
        <div className="mt-4 grid auto-rows-[72px] gap-3 sm:auto-rows-[80px] sm:gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div
              key={idx}
              className={[
                "rounded-2xl border border-white/10 bg-slate-900/30 p-3",
                idx === 0 ? "row-span-3 lg:col-span-3" : "row-span-2 lg:col-span-3"
              ].join(" ")}
            >
              <div className="h-28 w-full animate-pulse rounded-lg bg-slate-700/40" />
              <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-slate-700/40" />
              <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-slate-700/40" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="cp-card rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-100">Trending board</h2>
        <p className="text-xs text-slate-400">Visual ranking by views per day</p>
      </div>

      {videos.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-slate-900/20 p-4 text-sm text-slate-300">
          No videos found for this time window.
        </div>
      ) : (
        <div className="mt-4 grid auto-rows-[84px] gap-3 sm:auto-rows-[90px] sm:gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {videos.slice(0, 5).map((v, idx) => (
            <article
              key={v.id}
              className={[
                "cp-card cp-card-hover group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900/40 to-slate-950/20 p-3",
                idx === 0 ? "row-span-4 lg:col-span-3" : "row-span-3 lg:col-span-3"
              ].join(" ")}
            >
              <div className="absolute right-3 top-3 rounded-full bg-rose-500/20 px-2 py-1 text-[11px] font-semibold text-rose-100 ring-1 ring-rose-500/30 backdrop-blur">
                Trending
              </div>
              <Thumbnail
                src={v.thumbnailUrl}
                alt={v.title}
                className={idx === 0 ? "h-40 w-full rounded-xl sm:h-44" : "h-28 w-full rounded-xl sm:h-32"}
                fallbackText="ChannelPulse"
              />
              <h3 className="mt-3 line-clamp-2 text-sm font-semibold text-slate-100">
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

