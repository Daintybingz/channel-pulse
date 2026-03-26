"use client";

import { useMemo } from "react";
import type { Video } from "@/lib/types";

type Props = {
  videos: Video[];
};

const STOP_WORDS = new Set([
  "a","an","the","and","or","but","in","on","at","to","for","of","with",
  "by","from","as","is","it","its","be","was","are","were","been","has",
  "have","had","do","does","did","will","would","could","should","may",
  "might","shall","can","not","no","nor","so","yet","both","either",
  "this","that","these","those","my","your","his","her","our","their",
  "i","we","he","she","they","you","me","him","us","them","what","how",
  "when","where","why","who","which","if","then","than","just","also",
  "up","out","get","got","all","new","more","about","into","over",
  "after","before","during","through","too","very","s","t","re","ve",
  "ll","d","vs","ft","ep","pt","full","part","official","video",
]);

type Keyword = { word: string; count: number; weight: number };

function extractKeywords(videos: Video[]): Keyword[] {
  const freq = new Map<string, number>();

  for (const v of videos) {
    const words = v.title
      .toLowerCase()
      .replace(/[^a-z0-9'\s-]/g, " ")
      .split(/\s+/)
      .map((w) => w.replace(/^['-]+|['-]+$/g, ""))
      .filter((w) => w.length >= 3 && !STOP_WORDS.has(w) && !/^\d+$/.test(w));

    const seen = new Set<string>();
    for (const w of words) {
      if (!seen.has(w)) {
        freq.set(w, (freq.get(w) ?? 0) + 1);
        seen.add(w);
      }
    }
  }

  const max = Math.max(1, ...Array.from(freq.values()));

  return Array.from(freq.entries())
    .map(([word, count]) => ({ word, count, weight: count / max }))
    .filter(({ count }) => count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
}

function tagClass(weight: number): string {
  if (weight >= 0.8)
    return "bg-amber-400/25 text-amber-100 ring-amber-400/40 text-sm font-bold";
  if (weight >= 0.5)
    return "bg-amber-400/15 text-amber-200 ring-amber-400/25 text-xs font-semibold";
  return "bg-white/5 text-slate-300 ring-white/10 text-xs font-medium";
}

export function TopKeywords({ videos }: Props) {
  const keywords = useMemo(() => extractKeywords(videos), [videos]);

  if (keywords.length === 0) return null;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-100">Top Keywords</h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Most-used words across video titles — signals what this channel bets on
          </p>
        </div>
        <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-300 ring-1 ring-amber-500/30">
          {keywords.length}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {keywords.map(({ word, count, weight }) => (
          <div
            key={word}
            title={`${count} video${count !== 1 ? "s" : ""}`}
            className={[
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 ring-1 transition-all duration-200 hover:-translate-y-px hover:brightness-110",
              tagClass(weight),
            ].join(" ")}
          >
            <span>{word}</span>
            <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-bold tabular-nums leading-none text-white/70">
              {count}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-4 text-[11px] text-slate-500">
        Size and brightness indicate how frequently a keyword appears. Hover for exact count.
      </p>
    </div>
  );
}
