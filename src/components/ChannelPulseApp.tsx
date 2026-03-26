"use client";

import { useMemo, useState } from "react";
import type { AnalyzeResponse } from "@/lib/types";
import { ChannelInput } from "@/components/ChannelInput";
import { TrendingSection } from "@/components/TrendingSection";
import { VideoTable } from "@/components/VideoTable";
import { InsightsBox } from "@/components/InsightsBox";
import { ViewsPerDayChart } from "@/components/ViewsPerDayChart";
import { TopKeywords } from "@/components/TopKeywords";

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
    <div className="mx-auto w-full max-w-7xl px-3 pb-16 pt-6 sm:px-4 sm:pt-8">
      <header className="mb-5 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-amber-300/20 via-orange-400/20 to-yellow-300/20 p-5 sm:mb-6 sm:p-6">
        <div>
          <p className="text-base font-extrabold uppercase tracking-[0.22em] text-amber-200">
            ChannelPulse
          </p>
          <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
            Discover what is surging
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
            Paste a channel URL and browse top-performing uploads ranked by{" "}
            <span className="font-semibold text-slate-100">views per day</span>.
          </p>
        </div>
      </header>

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-[340px_1fr]">
        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
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

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex flex-col gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-100">Content window</h2>
                <p className="mt-1 text-xs text-slate-400">Currently: {filterSummary}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    const next = 7 as RangeDays;
                    setRangeDays(next);
                    if (activeChannelUrl) void analyze(activeChannelUrl, next);
                  }}
                  className={[
                    "min-h-11 rounded-xl border px-3 py-2 text-xs font-semibold transition",
                    rangeDays === 7
                      ? "border-amber-500/60 bg-amber-500/15 text-amber-200"
                      : "border-white/10 bg-slate-900/30 text-slate-200 hover:border-amber-500/30 hover:bg-amber-500/10"
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
                    "min-h-11 rounded-xl border px-3 py-2 text-xs font-semibold transition",
                    rangeDays === 30
                      ? "border-amber-500/60 bg-amber-500/15 text-amber-200"
                      : "border-white/10 bg-slate-900/30 text-slate-200 hover:border-amber-500/30 hover:bg-amber-500/10"
                  ].join(" ")}
                >
                  Last 30 days
                </button>
              </div>
            </div>
          </div>

          {activeChannelUrl ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs text-slate-400">Analyzing</p>
              <p className="line-clamp-2 text-sm font-semibold text-slate-100">{activeChannelUrl}</p>
            </div>
          ) : null}
        </aside>

        <section className="space-y-5">
          {data ? (
            <>
              {data.warning ? (
                <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
                  {data.warning}
                </div>
              ) : null}
              <TrendingSection videos={data.trending} loading={loading} />
              <TopKeywords videos={data.videos} />
              <ViewsPerDayChart videos={data.videos} />
              <InsightsBox videos={data.videos} rangeDays={rangeDays} />
            </>
          ) : (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
              <h2 className="text-base font-semibold text-slate-100">
                Ready when you are
              </h2>
              <p className="mt-2 text-sm text-slate-300">
                Paste a channel link and hit <span className="font-semibold">Analyze</span>. We’ll compute{" "}
                <span className="font-semibold text-slate-100">views per day</span> and show trending uploads.
              </p>
              <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-slate-950/20 p-4">
                <p className="text-xs text-slate-400">
                  Tip: For best results, use a channel URL like:
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-100">
                  https://www.youtube.com/channel/UC...
                </p>
              </div>
            </div>
          )}
        </section>
      </div>

      <div className="mt-5">
        <VideoTable videos={data?.videos ?? []} loading={loading} />
      </div>
    </div>
  );
}

