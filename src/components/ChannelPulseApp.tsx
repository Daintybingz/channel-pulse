"use client";

import { useMemo, useState } from "react";
import type { AnalyzeResponse } from "@/lib/types";
import { ChannelInput } from "@/components/ChannelInput";
import { TrendingSection } from "@/components/TrendingSection";
import { VideoTable } from "@/components/VideoTable";
import { InsightsBox } from "@/components/InsightsBox";
import { ViewsPerDayChart } from "@/components/ViewsPerDayChart";

type RangeDays = 7 | 30;

function isProbablyYouTubeChannel(input: string): boolean {
  const v = input.trim();
  if (!v) return false;
  if (v.startsWith("@")) return true;
  return /youtube\.com\/(channel\/|@)/i.test(v) || /youtu\.be\//i.test(v);
}

export function ChannelPulseApp() {
  const [channelUrl, setChannelUrl] = useState("");
  const [activeChannelUrl, setActiveChannelUrl] = useState<string | null>(null);
  const [rangeDays, setRangeDays] = useState<RangeDays>(30);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyzeResponse | null>(null);

  async function analyze(nextChannelUrl: string, nextRangeDays: RangeDays) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ channelUrl: nextChannelUrl, rangeDays: nextRangeDays }),
        cache: "no-store"
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || `Request failed (${res.status}).`);
      }

      const json = (await res.json()) as AnalyzeResponse;
      setData(json);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to analyze channel.";
      setError(msg);
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  const filterSummary = useMemo(() => {
    const d = rangeDays === 7 ? "last 7 days" : "last 30 days";
    return d;
  }, [rangeDays]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-300">
            ChannelPulse
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white">
            Find YouTube videos with real momentum
          </h1>
          <p className="mt-2 max-w-xl text-sm text-slate-300">
            Paste a channel URL and instantly get a trending shortlist based on{" "}
            <span className="font-semibold text-slate-100">views per day</span>.
          </p>
        </div>

        {activeChannelUrl ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-xs text-slate-400">Analyzing</p>
            <p className="text-sm font-semibold text-slate-100 line-clamp-1">
              {activeChannelUrl}
            </p>
          </div>
        ) : null}
      </header>

      <div className="grid gap-5 lg:grid-cols-[1fr_430px]">
        <div className="space-y-5 lg:order-2">
          <ChannelInput
            value={channelUrl}
            onChange={setChannelUrl}
            disabled={loading}
            loading={loading}
            error={error}
            onAnalyze={() => {
              const v = channelUrl.trim();
              if (!isProbablyYouTubeChannel(v)) {
                setError("Please paste a valid YouTube channel URL (or @handle).");
                setData(null);
                return;
              }
              setActiveChannelUrl(v);
              void analyze(v, rangeDays);
            }}
          />

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-100">Time filter</h2>
                <p className="mt-1 text-xs text-slate-400">Currently: {filterSummary}</p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    const next = 7 as RangeDays;
                    setRangeDays(next);
                    if (activeChannelUrl) void analyze(activeChannelUrl, next);
                  }}
                  className={[
                    "rounded-xl border px-3 py-2 text-xs font-semibold transition",
                    rangeDays === 7
                      ? "border-sky-500/60 bg-sky-500/15 text-sky-200"
                      : "border-white/10 bg-slate-900/30 text-slate-200 hover:bg-slate-900/40"
                  ].join(" ")}
                >
                  Last 7 days
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    const next = 30 as RangeDays;
                    setRangeDays(next);
                    if (activeChannelUrl) void analyze(activeChannelUrl, next);
                  }}
                  className={[
                    "rounded-xl border px-3 py-2 text-xs font-semibold transition",
                    rangeDays === 30
                      ? "border-sky-500/60 bg-sky-500/15 text-sky-200"
                      : "border-white/10 bg-slate-900/30 text-slate-200 hover:bg-slate-900/40"
                  ].join(" ")}
                >
                  Last 30 days
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5 lg:order-1">
          {data ? (
            <>
              <TrendingSection videos={data.trending} loading={loading} />
              <ViewsPerDayChart videos={data.videos} />
              <InsightsBox videos={data.videos} rangeDays={rangeDays} />
            </>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
              <h2 className="text-base font-semibold text-slate-100">
                Ready when you are
              </h2>
              <p className="mt-2 text-sm text-slate-300">
                Paste a channel link and hit <span className="font-semibold">Analyze</span>. We’ll compute{" "}
                <span className="font-semibold text-slate-100">views per day</span> and show trending uploads.
              </p>
              <div className="mt-5 rounded-xl border border-dashed border-white/10 bg-slate-950/20 p-4">
                <p className="text-xs text-slate-400">
                  Tip: For best results, use a channel URL like:
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-100">
                  https://www.youtube.com/channel/UC...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-5">
        <VideoTable videos={data?.videos ?? []} loading={loading} />
      </div>
    </div>
  );
}

