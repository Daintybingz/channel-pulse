# ChannelPulse
ChannelPulse is a lightweight YouTube competitor analysis dashboard. Paste a channel URL and quickly see which recent videos are gaining momentum, ranked by **views per day**.

## MVP Features
- Channel input with basic validation
- Fetch/analyze (real API when configured) with a simple contract: `POST /api/analyze`
- Trending section (top videos by `viewsPerDay`)
- Video table with sorting:
  - `Views`
  - `Views per day`
  - `Upload date`
- Time filtering:
  - last `7` days
  - last `30` days
- Loading + empty states
- Optional enhancements (kept lightweight):
  - Performance trend chart (simple SVG)
  - Insight summary box
  - Export CSV (client-side)

## Setup
Requirements:
- Node.js 20+ (tested with 23.x)
- npm

1. Install dependencies:
   ```bash
   npm install
   ```
2. (Optional) Configure YouTube:
   - Enable the YouTube Data API v3 in your Google Cloud project.
   - Set `YOUTUBE_API_KEY` in your environment (see `.env.example`).
   - If `YOUTUBE_API_KEY` is not set, the app uses deterministic mock data so the demo still works.

3. Run in dev:
   ```bash
   npm run dev
   ```
4. Open:
   - `http://localhost:3000`

## Production
```bash
npm run build
npm run start
```

## How “Trending” Is Computed (MVP)
For each video:
- `daysSinceUpload = (now - publishedAt) in days`
- `viewsPerDay = views / max(1, daysSinceUpload)`

Trending videos are selected by:
- Filter to the chosen time window (last 7 or 30 days)
- Sort by `viewsPerDay` descending
- Return the top 3–5 videos (currently top 5)

## Current Data Approach
If `YOUTUBE_API_KEY` is set, the backend uses the YouTube Data API v3:
1. Resolve the channel ID (from `/channel/UC...` directly, otherwise via a channel search).
2. Fetch the channel's `uploads` playlist.
3. Pull recent `playlistItems` and filter by the selected time window.
4. Batch `videos.list` requests to get `views`, `likeCount`, `publishedAt`, and thumbnails.
5. Compute `viewsPerDay` and rank trending.

If `YOUTUBE_API_KEY` is not set, the app falls back to deterministic mock videos (for demo reliability).

All of this is implemented in `src/lib/analyzeChannel.ts`.

## Clean Project Structure
- `src/components/*`: UI components
  - `ChannelInput`
  - `TrendingSection`
  - `VideoTable`
  - plus small optional UI pieces
- `src/lib/*`: shared types + metrics + analysis logic
- `src/app/api/analyze/route.ts`: API handler (`POST /api/analyze`)
- `src/app/page.tsx`: page entry

## Demo Notes / Founder-Friendly Summary
ChannelPulse is designed for fast evaluation during client meetings:
- input a channel link
- instantly rank recent videos by momentum (`views per day`)
- sort/compare the full set in the table
