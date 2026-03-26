# ChannelPulse
ChannelPulse is a lightweight YouTube competitor analysis dashboard. Paste a channel URL and quickly see which recent videos are gaining momentum, ranked by **views per day**.

## MVP Features
- Channel input with basic validation
- Fetch/analyze (mock-first) with a simple contract: `POST /api/analyze`
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
2. (Optional) Environment variables:
   - For now, the app uses deterministic mock data.
   - To integrate YouTube later, set `YOUTUBE_API_KEY` when ready.

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
The backend route currently returns **mock videos** (deterministic by channel URL) so the demo always works.
The code is structured so swapping the mock generator for the YouTube Data API later is localized to:
- `src/lib/analyzeChannel.ts`

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
