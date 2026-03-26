/* eslint-disable @next/next/no-img-element */
"use client";

export function Thumbnail({
  src,
  alt,
  className,
  fallbackText
}: {
  src?: string;
  alt?: string;
  className?: string;
  fallbackText?: string;
}) {
  const hasSrc = Boolean(src && src.trim().length > 0);

  if (!hasSrc) {
    return (
      <div
        className={[
          "flex items-center justify-center rounded bg-gradient-to-br from-amber-900 to-orange-900 text-[11px] font-semibold text-slate-200 ring-1 ring-white/10",
          className ?? ""
        ].join(" ")}
        aria-label={alt ?? "Thumbnail"}
      >
        {fallbackText ?? "No thumbnail"}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt ?? ""}
      className={["rounded object-cover transition-transform duration-500 group-hover:scale-[1.03]", className ?? ""].join(" ")}
      loading="lazy"
    />
  );
}

