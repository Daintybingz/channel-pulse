const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function daysSince(isoDate: string, now = new Date()): number {
  const d = new Date(isoDate);
  const ms = now.getTime() - d.getTime();
  if (!Number.isFinite(ms)) return 0;
  return ms / MS_PER_DAY;
}

export function viewsPerDay(views: number, isoDate: string, now = new Date()): number {
  const days = Math.max(1, daysSince(isoDate, now)); // avoid huge numbers for fresh uploads
  return views / days;
}

