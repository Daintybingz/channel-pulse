"use client";

import { useMemo } from "react";
import type { Video } from "@/lib/types";

export function ViewsPerDayChart({ videos }: { videos: Video[] }) {
  const series = useMemo(() => {
    const sorted = [...videos].sort(
      (a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
    );
    return sorted.slice(0, 12);
  }, [videos]);

  const points = useMemo(() => {
    if (series.length === 0) return { path: "", max: 0 };
    const max = Math.max(...series.map((v) => v.viewsPerDay));
    const w = 520;
    const h = 160;
    const padX = 12;
    const padY = 10;
    const innerW = w - padX * 2;
    const innerH = h - padY * 2;

    const getX = (i: number) =>
      padX + (series.length === 1 ? innerW / 2 : (i / (series.length - 1)) * innerW);
    const getY = (vpd: number) => {
      const t = max > 0 ? vpd / max : 0;
      return padY + (1 - t) * innerH;
    };

    const coords = series.map((v, i) => `${getX(i).toFixed(1)},${getY(v.viewsPerDay).toFixed(1)}`);
    return { path: coords.join(" "), max };
  }, [series]);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-5">
      <h2 className="text-base font-semibold text-slate-100">Performance trend</h2>
      <p className="mt-1 text-xs text-slate-400">Views per day across recent uploads</p>

      <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-slate-950/20">
        {series.length === 0 ? (
          <div className="p-4 text-sm text-slate-300">No data to plot.</div>
        ) : (
          <svg viewBox="0 0 520 160" className="h-[150px] w-full sm:h-[160px]">
            <defs>
              <linearGradient id="cpLine" x1="0" x2="1">
                <stop offset="0%" stopColor="#facc15" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#fb923c" stopOpacity="0.95" />
              </linearGradient>
            </defs>

            <polyline
              points={points.path}
              fill="none"
              stroke="url(#cpLine)"
              strokeWidth="3"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {series.map((v, i) => {
              const max = Math.max(...series.map((x) => x.viewsPerDay));
              const w = 520;
              const h = 160;
              const padX = 12;
              const padY = 10;
              const innerW = w - padX * 2;
              const innerH = h - padY * 2;
              const x =
                padX +
                (series.length === 1 ? innerW / 2 : (i / (series.length - 1)) * innerW);
              const t = max > 0 ? v.viewsPerDay / max : 0;
              const y = padY + (1 - t) * innerH;

              return (
                <g key={v.id}>
                  <circle cx={x} cy={y} r="5" fill="#0b1220" stroke="#facc15" strokeWidth="2" />
                </g>
              );
            })}
          </svg>
        )}
      </div>
    </section>
  );
}

