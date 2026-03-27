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

---

## Self Interview

**What was my thought process going in?**

I started by defining the single most useful metric a creator or competitor researcher would want — not just raw views, but *views per day*. That one formula (views ÷ days since upload) drives every ranked list in the app. Once that was clear, the component structure followed naturally: input → fetch → trending board → keyword cloud → table.

**What trade-offs did I make?**

- **Mock-first, API-second.** I built deterministic mock data before wiring the YouTube API. This meant the UI was always demo-able even when the API was broken or rate-limited — important for a founder showing a client on short notice.
- **Client-side keyword extraction.** Rather than adding a second API call (YouTube Search or NLP service), I extract keywords directly from video titles on the client. Less accurate than a real NLP model, but zero cost, zero latency, and works offline.
- **No database.** Every analysis is stateless and re-fetched on demand. Keeps the infra at zero cost for an MVP, at the expense of no history or caching.

**What would I do differently?**

Cache results server-side (Redis or Vercel KV) so repeat analyses are instant and quota-friendly. I'd also pull *tags* from the YouTube API directly instead of mining titles — much cleaner signal for the keyword feature.

---

## Product Thinking

**What problem does this solve?**

Content creators and marketing teams spend hours manually scrolling competitor channels trying to guess what's working. ChannelPulse replaces that with a 10-second answer: paste a URL, see exactly which videos are gaining momentum right now, and what topics they keep betting on.

**What would i build next?**

1. **Multi-channel comparison** — analyze two or three channels side by side on the same screen, with overlapping keyword and performance charts.
2. **Saved channel watchlist** — let users bookmark channels and get a weekly digest of what surged.
3. **Keyword gap analysis** — show keywords a competitor uses that you haven't touched yet.
4. **Alerts** — notify when a tracked channel posts a video that's trending within 24 hours.

**How would i scale to paid users?**

- Free tier: 5 analyses per day, 30-day window.
- Pro ($10/mo): unlimited analyses, 90-day window, multi-channel comparison, CSV export, email digests.
- Team ($49/mo): shared watchlists, Slack/Notion integration, API access.

Acquisition: SEO-optimised public channel report pages (e.g. `/channel/MrBeast`) that rank in Google and funnel organic traffic into signups.

---

## How I Used AI

I used Cursor (Claude) as a pair programmer throughout the entire build — not just for boilerplate, but for architectural decisions.

**Scaffolding:** Rather than using `create-next-app`, I described the project structure I wanted and had the AI generate all config files, types, and component shells in one pass. This saved roughly an hour of setup.

**Logic design:** The `viewsPerDay` metric, the mock data generator (deterministic by channel URL so it's stable across reloads), and the keyword extraction stop-word list were all written collaboratively — I described the behaviour I wanted and reviewed and edited the output.

**Debugging:** When the YouTube API kept returning `ENOTFOUND`, I used the AI to run live diagnostics, identify that Next.js's webpack was polyfilling `https` with a browser stub, and apply the `node:https` fix. A bug that could have taken hours was resolved in minutes.

**UI iteration:** I described the colour direction (mimosa, amber, orange) and the layout I had in mind (sticky left panel, right content area), and iterated on the Tailwind classes through conversation rather than trial-and-error in the browser.

**What I did myself:** Every product decision — what metric matters, what the keyword feature should actually tell a user, the UX hierarchy — was mine. The AI was the implementation partner, not the product thinker.
