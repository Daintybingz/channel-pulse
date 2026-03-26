import type { AnalyzeResponse, Video } from "@/lib/types";
import { daysSince, viewsPerDay } from "@/lib/metrics";
import https from "node:https";

type AnalyzeInput = {
  channelUrl: string;
  rangeDays: 7 | 30;
  now?: Date;
  apiKey?: string;
};

type YtSearchChannelResult = {
  channelId: string;
  channelTitle?: string;
};

type YtVideoRaw = {
  id: string;
  snippet: {
    title: string;
    publishedAt: string;
    thumbnails?: {
      high?: { url: string };
      medium?: { url: string };
      default?: { url: string };
    };
  };
  statistics: {
    viewCount?: string;
    likeCount?: string;
  };
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

function extractChannelLookup(channelUrl: string): { channelId?: string; query?: string } {
  try {
    const normalized = channelUrl.startsWith("http")
      ? channelUrl
      : `https://www.youtube.com/${channelUrl.replace(/^\/+/, "")}`;
    const u = new URL(normalized);
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts[0] === "channel" && parts[1]?.startsWith("UC")) return { channelId: parts[1] };
    if (parts[0]?.startsWith("@")) return { query: parts[0] };
    if (parts[0] === "@" && parts[1]) return { query: `@${parts[1]}` };
    if (parts[0] === "c" && parts[1]) return { query: parts[1] };
    if (parts[0] === "user" && parts[1]) return { query: parts[1] };
    return { query: channelUrl.trim() };
  } catch {
    return { query: channelUrl.trim() };
  }
}

function httpsGet(urlStr: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const req = https.get(urlStr, (res) => {
      let raw = "";
      res.on("data", (chunk: Buffer) => { raw += chunk.toString(); });
      res.on("end", () => {
        try {
          const json = JSON.parse(raw) as unknown;
          if (typeof res.statusCode === "number" && res.statusCode >= 400) {
            reject(new Error(`YouTube API error (${res.statusCode}): ${raw.slice(0, 200)}`));
          } else {
            resolve(json);
          }
        } catch {
          reject(new Error(`YouTube API: invalid JSON response`));
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(15000, () => { req.destroy(new Error("YouTube API request timed out")); });
  });
}

async function youtubeJson(apiKey: string, path: string, params: Record<string, string>) {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${path}`);
  url.searchParams.set("key", apiKey);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return httpsGet(url.toString());
}

async function resolveChannel(apiKey: string, channelUrl: string): Promise<YtSearchChannelResult> {
  const lookup = extractChannelLookup(channelUrl);
  if (lookup.channelId) {
    const channels = (await youtubeJson(apiKey, "channels", {
      part: "snippet",
      id: lookup.channelId,
      maxResults: "1"
    })) as { items?: Array<{ id: string; snippet?: { title?: string } }> };

    const item = channels.items?.[0];
    return {
      channelId: lookup.channelId,
      channelTitle: item?.snippet?.title
    };
  }

  // Fallback: search for the channel by provided handle/username.
  const q = lookup.query ?? channelUrl.trim();
  const search = (await youtubeJson(apiKey, "search", {
    part: "snippet",
    type: "channel",
    q,
    maxResults: "1"
  })) as { items?: Array<{ id?: { channelId?: string }; snippet?: { channelTitle?: string } }> };

  const item = search.items?.[0];
  const channelId = item?.id?.channelId;
  if (!channelId) throw new Error("Could not resolve channel ID from provided URL.");

  return { channelId, channelTitle: item.snippet?.channelTitle };
}

async function fetchRecentUploadVideoIds(apiKey: string, uploadsPlaylistId: string, rangeDays: 7 | 30, now: Date) {
  // For MVP simplicity, fetch a few pages (max 200 items) then filter by publishedAt.
  const videoIds = new Set<string>();
  const maxPages = 4;

  let pageToken: string | undefined;
  for (let page = 0; page < maxPages; page++) {
    const params: Record<string, string> = {
      part: "snippet,contentDetails",
      playlistId: uploadsPlaylistId,
      maxResults: "50",
      order: "date"
    };
    if (pageToken) params.pageToken = pageToken;

    const resp = (await youtubeJson(apiKey, "playlistItems", params)) as {
      items?: Array<{
        snippet?: { publishedAt?: string };
        contentDetails?: { videoId?: string };
      }>;
      nextPageToken?: string;
    };

    const items = resp.items ?? [];
    for (const it of items) {
      const publishedAt = it.snippet?.publishedAt;
      const vid = it.contentDetails?.videoId;
      if (!publishedAt || !vid) continue;
      if (daysSince(publishedAt, now) <= rangeDays) videoIds.add(vid);
    }

    const nextToken = resp.nextPageToken;
    if (!nextToken) break;

    // Stop early if the whole page is outside the range (depends on ordering, but works well enough).
    const allOld = items.length > 0 && items.every((it) => {
      const publishedAt = it.snippet?.publishedAt;
      if (!publishedAt) return true;
      return daysSince(publishedAt, now) > rangeDays;
    });
    if (allOld && videoIds.size > 0) break;

    pageToken = nextToken;
  }

  return [...videoIds];
}

async function fetchVideoDetails(apiKey: string, videoIds: string[]): Promise<YtVideoRaw[]> {
  const out: YtVideoRaw[] = [];
  const batches = Math.ceil(videoIds.length / 50);
  for (let i = 0; i < batches; i++) {
    const slice = videoIds.slice(i * 50, i * 50 + 50);
    if (slice.length === 0) continue;

    const resp = (await youtubeJson(apiKey, "videos", {
      part: "snippet,statistics",
      id: slice.join(","),
      maxResults: "50"
    })) as { items?: YtVideoRaw[] };

    out.push(...(resp.items ?? []));
  }
  return out;
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

  function buildMockResponse(warning?: string): AnalyzeResponse {
    const videos = makeMockVideos(channelUrl, rangeDays, now);
    const trending = [...videos].sort((a, b) => b.viewsPerDay - a.viewsPerDay).slice(0, 5);
    return {
      channelName,
      channelId,
      generatedAt: now.toISOString(),
      trending,
      videos,
      source: "mock",
      warning
    };
  }

  // Demo-friendly fallback: mock-first when no API key is configured.
  if (!apiKey) {
    return buildMockResponse();
  }

  // Real integration path (YouTube Data API v3).
  // If anything fails (quota, network, key restrictions), we fall back to mock data
  // so the demo UI never breaks.
  let resolvedName = channelName;
  let resolvedId = channelId;

  try {
    const resolved = await resolveChannel(apiKey, channelUrl);
    resolvedName = resolved.channelTitle ?? channelName;
    resolvedId = resolved.channelId;

    const channelDetails = (await youtubeJson(apiKey, "channels", {
      part: "contentDetails",
      id: resolved.channelId
    })) as {
      items?: Array<{
        contentDetails?: { relatedPlaylists?: { uploads?: string } };
      }>;
    };

    const uploadsPlaylistId =
      channelDetails.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsPlaylistId) {
      throw new Error("Could not locate uploads playlist for this channel.");
    }

    const videoIds = await fetchRecentUploadVideoIds(apiKey, uploadsPlaylistId, rangeDays, now);
    const details = await fetchVideoDetails(apiKey, videoIds);

    const videos: Video[] = details
      .map((v) => {
        const viewsRaw = Number(v.statistics.viewCount ?? 0);
        const likesRaw = Number(v.statistics.likeCount ?? 0);
        const publishedAt = v.snippet.publishedAt;
        const thumb =
          v.snippet.thumbnails?.high?.url ??
          v.snippet.thumbnails?.medium?.url ??
          v.snippet.thumbnails?.default?.url ??
          `https://placehold.co/240x135/png?text=${encodeURIComponent(v.id)}`;

        return {
          id: v.id,
          title: v.snippet.title,
          thumbnailUrl: thumb,
          views: Number.isFinite(viewsRaw) ? viewsRaw : 0,
          likes: Number.isFinite(likesRaw) ? likesRaw : 0,
          publishedAt,
          daysSinceUpload: daysSince(publishedAt, now),
          viewsPerDay: viewsPerDay(
            Number.isFinite(viewsRaw) ? viewsRaw : 0,
            publishedAt,
            now
          )
        };
      })
      .filter((v) => daysSince(v.publishedAt, now) <= rangeDays);

    videos.sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
    const trending = [...videos].sort((a, b) => b.viewsPerDay - a.viewsPerDay).slice(0, 5);

    return {
      channelName: resolvedName,
      channelId: resolvedId,
      generatedAt: now.toISOString(),
      trending,
      videos,
      source: "youtube"
    };
  } catch (err) {
    const message =
      err instanceof Error && err.message
        ? err.message
        : "YouTube API request failed.";

    // eslint-disable-next-line no-console
    console.error("YouTube integration failed; falling back to mock data:", message);

    const mock = buildMockResponse(`YouTube API unavailable: ${message}`);
    // Ensure channel identity matches resolved values when possible.
    return {
      ...mock,
      channelName: resolvedName,
      channelId: resolvedId,
      source: "mock"
    };
  }
}

