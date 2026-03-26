import type { AnalyzeResponse, Video } from "@/lib/types";
import { daysSince, viewsPerDay } from "@/lib/metrics";

type AnalyzeInput = {
  channelUrl: string;
  rangeDays: 7 | 30;
  now?: Date;
  apiKey?: string;
};

function hashString(input: string): number {
  // Simple deterministic hash for mock data.
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededRandom(seed: number) {
  let t = seed + 0x6d2b79f5;
  return () => {
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function extractChannelKey(channelUrl: string): string {
  try {
    const normalized = channelUrl.startsWith("http")
      ? channelUrl
      : `https://www.youtube.com/${channelUrl.replace(/^\/+/, "")}`;
    const u = new URL(normalized);
    const parts = u.pathname.split("/").filter(Boolean);
    // /channel/UCxxxx or /c/Name or /@handle
    if (parts[0] === "channel" && parts[1]) return `channel:${parts[1]}`;
    if (parts[0] === "@" && parts[1]) return `handle:${parts[1]}`;
    if (parts[0]?.startsWith("@")) return `handle:${parts[0]}`;
    return u.hostname + u.pathname;
  } catch {
    return channelUrl.trim();
  }
}

function makeISODateDaysAgo(daysAgo: number, now: Date): string {
  const d = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  // Use ISO string; drop milliseconds for stable UI.
  return d.toISOString();
}

function makeMockVideos(channelUrl: string, rangeDays: 7 | 30, now: Date): Video[] {
  const key = extractChannelKey(channelUrl);
  const seed = hashString(key);
  const rand = seededRandom(seed);

  const baseViews = 50_000 + Math.floor(rand() * 250_000);
  const baseLikes = 500 + Math.floor(rand() * 10_000);

  // Generate videos in last ~90 days so filtering feels real.
  const totalCandidates = 18;
  const candidates: Omit<Video, "viewsPerDay" | "daysSinceUpload">[] = [];

  for (let i = 0; i < totalCandidates; i++) {
    const daysAgo = Math.floor(rand() * 90); // 0..89
    const ageWeight = Math.max(0.35, 1 - daysAgo / 120);

    const views = Math.floor(baseViews * ageWeight * (0.65 + rand() * 1.6));
    const likes = Math.floor(baseLikes * ageWeight * (0.7 + rand() * 2.0));

    // Keep thumbnails simple; MVP doesn't require real thumbnails.
    const thumbText = `CP-${seed.toString(16).slice(0, 6)}-${i}`;
    const thumbnailUrl = `https://placehold.co/240x135/png?text=${encodeURIComponent(thumbText)}`;

    candidates.push({
      id: `mock_${seed.toString(16)}_${i}`,
      title: `ChannelPulse Mock Video ${i + 1}`,
      thumbnailUrl,
      views,
      likes,
      publishedAt: makeISODateDaysAgo(daysAgo, now)
    });
  }

  // Apply filter window first.
  const filtered = candidates.filter((v) => daysSince(v.publishedAt, now) <= rangeDays);

  // Sort newest first for consistent table ordering defaults.
  filtered.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  return filtered.map((v) => {
    const d = daysSince(v.publishedAt, now);
    const vpd = viewsPerDay(v.views, v.publishedAt, now);
    return {
      ...v,
      daysSinceUpload: d,
      viewsPerDay: vpd
    };
  });
}

export async function analyzeChannel(input: AnalyzeInput): Promise<AnalyzeResponse> {
  const { channelUrl, rangeDays, now = new Date(), apiKey } = input;

  const channelKey = extractChannelKey(channelUrl);
  const channelId = channelKey.replace(/^(channel:|handle:)/, "");
  const channelName = `Channel ${channelId.slice(0, 8)}`;

  // MVP: default to mock until we have the YouTube API flow fully wired.
  if (!apiKey) {
    const videos = makeMockVideos(channelUrl, rangeDays, now);
    const trending = [...videos].sort((a, b) => b.viewsPerDay - a.viewsPerDay).slice(0, 5);
    return {
      channelName,
      channelId,
      generatedAt: now.toISOString(),
      trending,
      videos
    };
  }

  // Future: YouTube Data API integration (kept as a TODO for the MVP).
  // For now, keep returning mock data to ensure the demo is always functional.
  const videos = makeMockVideos(channelUrl, rangeDays, now);
  const trending = [...videos].sort((a, b) => b.viewsPerDay - a.viewsPerDay).slice(0, 5);
  return {
    channelName,
    channelId,
    generatedAt: now.toISOString(),
    trending,
    videos
  };
}

