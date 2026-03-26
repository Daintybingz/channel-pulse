"use client";

import { useId } from "react";

type Props = {
  value: string;
  onChange: (next: string) => void;
  onAnalyze: () => void;
  disabled?: boolean;
  loading?: boolean;
  error?: string | null;
};

export function ChannelInput({
  value,
  onChange,
  onAnalyze,
  disabled,
  loading,
  error
}: Props) {
  const inputId = useId();

  return (
    <section className="cp-card rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-5 shadow-lg shadow-black/20">
      <label htmlFor={inputId} className="block text-sm font-semibold text-slate-100">
        YouTube channel URL
      </label>
      <p className="mt-1 text-xs text-slate-400">
        Drop a channel link or handle and we will map the top recent performers.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start">
        <input
          id={inputId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste a channel link (e.g. https://youtube.com/@creator)"
          className="min-h-12 w-full flex-1 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-50 placeholder:text-slate-400 outline-none ring-0 transition focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20"
        />
        <button
          type="button"
          onClick={onAnalyze}
          disabled={disabled || loading}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:scale-[1.01] hover:from-sky-400 hover:to-indigo-400 disabled:opacity-60 sm:w-auto"
        >
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </div>
      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
      <p className="mt-3 text-xs text-slate-400">
        We’ll compute <span className="font-medium text-slate-200">views per day</span> to
        detect trending uploads.
      </p>
    </section>
  );
}

