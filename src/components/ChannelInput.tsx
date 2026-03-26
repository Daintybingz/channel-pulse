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
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-sm">
      <label htmlFor={inputId} className="block text-sm font-medium text-slate-200">
        YouTube channel URL
      </label>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start">
        <input
          id={inputId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste a channel link (e.g. https://youtube.com/@creator)"
          className="w-full flex-1 rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-400 outline-none ring-0 focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20"
        />
        <button
          type="button"
          onClick={onAnalyze}
          disabled={disabled || loading}
          className="inline-flex w-full justify-center rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500 disabled:opacity-60 sm:w-auto"
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

