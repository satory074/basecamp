# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Basecamp is a personal homepage that aggregates content from 15 platforms into a unified feed. Built with Next.js 16 (App Router), TypeScript, and Tailwind CSS. Hosted on AWS Amplify (auto-deploys on push to main).

**Live site**: satory074.com

## Development Commands

```bash
npm run dev      # Dev server with Turbopack (localhost:3000)
npm run build    # Production build (uses --webpack, NOT Turbopack)
npm run lint     # ESLint 9 flat config (app/ directory)
npm run start    # Start production server
```

**No test framework** is configured. Validate changes with `npm run build` (catches TypeScript errors and Amplify-incompatible code).

## ESLint

Uses ESLint 9 flat config (`eslint.config.mjs`, NOT `.eslintrc.json`). Scoped to `app/**/*.{ts,tsx}`:
- `@typescript-eslint/no-explicit-any`: **error** — never use `any`
- `@typescript-eslint/no-empty-object-type`: warn
- `@typescript-eslint/no-unused-vars`: warn
- `@next/next/no-img-element`: warn — prefer `next/image`
- `@next/next/no-page-custom-font`: warn

## Architecture

### Core Pattern: Server Component + Client Wrapper

Each platform page follows this pattern because functions cannot be passed from Server to Client components:

- **`app/[platform]/page.tsx`** — Server Component with `metadata` export, renders `Sidebar` + `*Client`
- **`app/[platform]/*Client.tsx`** — Client Component (`"use client"`) that defines fetch function inline and passes to `FeedPosts`

The homepage (`app/page.tsx`) is special: a server component that fetches all APIs and passes aggregated data to `HomeFeed` (client component with infinite scroll).

### Data Flow

```
External APIs/RSS/Scraping → /app/api/[platform]/route.ts → JSON response
                                                              ↓
                              *Client.tsx fetch() → FeedPosts component
```

Homepage: Server-side fetch of all `/api/*` → aggregate + sort → `HomeFeed` (client, infinite scroll)

### API Routes (`app/api/[platform]/route.ts`)

Each API route fetches from a different source:
- **RSS** (`rss-parser`): hatena, zenn, note, booklog, hatenabookmark
- **HTML scraping** (`cheerio`): filmarks, ff14, ff14-achievements
- **REST APIs**: github (GitHub API), spotify (Spotify Web API), tenhou (nodocchi.moe)
- **Static JSON**: x (`public/data/x-tweets.json`), duolingo (`public/data/duolingo-stats.json`), summaries (`public/data/summaries.json`)

API routes return `[]` on error to prevent downstream `map()` failures. All routes use `export const revalidate = 21600` (ISR: 6 hours) and set `Cache-Control` headers (5 min for live APIs, 1 hr for static JSON, 30 min for scraping).

### Layout System

Fixed sidebar + scrollable content (`.split-layout`, `.sidebar`, `.main-content` in `globals.css`). Responsive: stacked on mobile, side-by-side on desktop.

### Type System (`app/lib/types.ts`)

- `BasePost` → platform-specific types (`GitHubPost`, `HatenaPost`, etc.) → `PlatformPost` union
- `Post` — legacy type still used in most code (backward compatible)

## Key Utilities (`app/lib/`)

| File | Purpose |
|---|---|
| `api-errors.ts` | `ApiError` class, `createErrorResponse()`, `validateEnvVar()` |
| `fetch-with-timeout.ts` | `fetchWithTimeout()` with AbortController (default 10s) |
| `cache-utils.ts` | File-based JSON cache for Filmarks/Booklog/FF14 Achievements (30-day TTL) |
| `rate-limit.ts` | In-memory rate limiter (per IP, configurable window) |
| `spotify-auth.ts` | Spotify OAuth token management (in-memory cache, 1h TTL) |
| `shared/constants.ts` | Platform colors for all 15 platforms |
| `shared/date-utils.ts` | `formatRelativeTime()` (Japanese relative time) |
| `shared/html-utils.ts` | `stripHtmlTags()`, `extractThumbnailFromContent()` |
| `formatters.ts` | `convertUrlToCustomSchema()` for summaries feature |

## Critical Patterns

### `force-dynamic` for Server-Side API Calls
Amplify fails at build time when pages call localhost APIs. Pages that fetch server-side need:
```typescript
export const dynamic = "force-dynamic";
```
Currently required: `app/page.tsx`, `app/filmarks/page.tsx`

### TypeScript: null → undefined Conversion
External APIs return `string | null` but types expect `string | undefined`:
```typescript
language: repo.language ?? undefined,
```
Amplify builds are stricter than local — always verify with `npm run build`.

### Image HTTP → HTTPS
API routes convert HTTP image URLs to HTTPS to avoid mixed content:
```typescript
imgUrl.replace(/^http:/, "https:")
```

### File-Based Caching
Filmarks/Booklog/FF14 Achievements use `public/data/*-cache.json` (git-committed) to avoid scraping on every request. New entries are fetched; existing ones read from cache.

### RSS Thumbnail Quirks
Each platform stores thumbnails differently in RSS. When adding RSS parsing, always check the actual feed structure first and use `rss-parser` `customFields`. RDF-format feeds (Booklog, Hatena Bookmark) need standard fields added to `customFields` explicitly.

## GitHub Actions Feeds

Some platforms use GitHub Actions for daily batch fetches instead of live API calls:
```
GitHub Actions (daily cron) → API fetch → public/data/*.json → git push → Amplify deploy
```

### X (Twitter)
- **Schedule**: daily 12:20 JST
- **Script**: `scripts/update-x-feed.ts` → `public/data/x-tweets.json`
- **Workflow**: `.github/workflows/update-x-feed.yml`
- **Display**: `react-tweet` embeds (dynamically imported, SSR disabled) with colored icon badges (Post/Repost/Like/Bookmark) — used on both Home feed and `/x` page via shared `TweetEmbed.tsx`
- **Pagination**: IntersectionObserver loads 10 tweets at a time (`TWEETS_PER_PAGE = 10`)
- OAuth 2.0 PKCE: refresh token rotates on every use, auto-updated via `gh secret set`
- GitHub Secrets: `X_CLIENT_ID`, `X_CLIENT_SECRET`, `X_REFRESH_TOKEN`, `X_USER_ID`, `GH_PAT`, `DISCORD_WEBHOOK_URL`

### Duolingo
- **Schedule**: daily 12:25 JST (5 min after X)
- **Script**: `scripts/update-duolingo-feed.ts` → `public/data/duolingo-stats.json`
- **Workflow**: `.github/workflows/update-duolingo-feed.yml`
- **Display**: Stats card (streak, XP, courses) + entry list with category badges (daily/milestone)
- No auth required (public profile API), no extra GitHub Secrets needed
- Generates entries by comparing XP diff from previous run; milestone entries every 50 streak days

## Performance

### Caching Strategy
- **API routes**: `Cache-Control` headers with `stale-while-revalidate` (see API Routes section)
- **Static data files** (`/data/*`): 1hr cache, 24hr stale-while-revalidate (via `next.config.ts` headers)
- **Next.js static assets** (`/_next/static/*`): 1yr immutable cache
- **Images**: AVIF/WebP formats, 30-day `minimumCacheTTL`

### Shared Components (`app/components/shared/`)
- **`TweetEmbed.tsx`**: `TweetWithFallback`, `CategoryBadge`, `getTweetId` — shared by `XClient` and `HomeFeed` for tweet embed rendering
- **`Thumbnail.tsx`**: `Thumbnail` (with error fallback), `PlaceholderThumbnail` — used in feed cards

### Rendering
- **Infinite scroll**: `IntersectionObserver`-based in `HomeFeed` (20/page), `XClient` (10/page), and `FeedPosts` (20/page)
- **react-tweet**: dynamically imported with `ssr: false` to avoid hydration issues; X posts render as tweet embeds on both Home and `/x` pages
- **Header scroll**: throttled with `requestAnimationFrame`
- **Feed posts**: CSS `content-visibility: auto` for paint containment

## Scraping Optimization

Filmarks and Booklog require per-item page fetches. Optimized with:
- **Batch concurrency**: 5 simultaneous requests (`BATCH_SIZE = 5`)
- **Timeout**: 10s for Filmarks, 5s for Booklog
- **File cache**: 30-day TTL in `public/data/*-cache.json` (git-committed for instant deploy performance)

## Environment Variables

```bash
# Core (optional — graceful degradation if missing)
GITHUB_TOKEN=...              # Enhanced GitHub API access
GEMINI_API_KEY=...            # AI summary generation
NEXT_PUBLIC_BASE_URL=...      # Server-side API base URL

# Spotify OAuth
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
SPOTIFY_REFRESH_TOKEN=...

# Supabase (microblog/auth features)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Deployment

- **Hosting**: AWS Amplify (auto-deploys on push to main, ~2-3 min)
- **Domain**: satory074.com
- **Cache busting**: append `?v=freshN` to URL
- **Always run `npm run build` locally before pushing** — Amplify builds are strict

## Summaries Feature

AI-generated summaries stored in `public/data/summaries.json`. Generated via `npm run generate-summaries` (requires `GEMINI_API_KEY`). Target 100-200 chars per summary. When adding a new platform: update `lib/types.ts` `Post.platform`, `lib/formatters.ts` `convertUrlToCustomSchema`, and `generate-summaries.js` `fetchPosts`.

## Technology Stack

- **Next.js 16** (App Router, Turbopack dev / Webpack build, React 19)
- **TypeScript 5** (strict mode)
- **Tailwind CSS 3.4**
- **ESLint 9** (flat config)
- **Key libs**: cheerio, rss-parser, date-fns, react-tweet
