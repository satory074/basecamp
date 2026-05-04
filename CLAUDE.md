# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Basecamp is a personal homepage that aggregates content from 19+ platforms into a unified feed, plus an `/apps` catalog (carousel on home + searchable grid) and external profile pill row. Built with Next.js 16 (App Router), TypeScript, and Tailwind CSS. Hosted on AWS Amplify (auto-deploys on push to main).

**Live site**: satory074.com

## Development Commands

```bash
npm run dev      # Dev server with Turbopack (localhost:3000)
npm run build    # Production build (uses --webpack, NOT Turbopack)
npm run lint     # ESLint 9 flat config (app/ directory)
npm run start    # Start production server
```

**No test framework** is configured. `npm run build` is the only way to validate TypeScript — Amplify builds are stricter than local dev.

**ESLint**: `@typescript-eslint/no-explicit-any` is an **error** (never use `any`). Config is `eslint.config.mjs` (flat config, NOT `.eslintrc.json`).

## Architecture

### Core Pattern: Server Component + Client Wrapper

Each platform page follows this pattern because functions cannot be passed from Server to Client components:

- **`app/[platform]/page.tsx`** — Server Component with `metadata` export, renders `Sidebar` + `*Client`
- **`app/[platform]/*Client.tsx`** — Client Component (`"use client"`) that manages state, fetches data, and renders feed

The homepage (`app/page.tsx`) is special: a server component that fetches all APIs and passes aggregated data to `HomeFeed` (client component with infinite scroll).

### Two Client Patterns

**Standard** (most platforms): `*Client.tsx` defines `fetchPosts` and passes it to `FeedPosts`, which handles fetch/state/scroll internally.

**XClient pattern** (X, Booklog): Client manages everything directly — `useState`/`useEffect` for fetch, filter tabs with count badges, `IntersectionObserver` for infinite scroll, `RichFeedCard` rendered directly. Use this pattern when filter tabs or custom dashboard logic are needed.

### Data Flow

```
External APIs/RSS/Scraping → /app/api/[platform]/route.ts → JSON response
                                                              ↓
                  Standard: *Client.tsx fetchPosts() → FeedPosts → RichFeedCard
                  XClient:  *Client.tsx useEffect fetch → filter → RichFeedCard
```

Homepage: Server-side fetch of all `/api/*` (15s timeout per endpoint via AbortController) → aggregate → **sort by date descending (strict chronological, no platform balancing)** → `HomeFeed` → `RichFeedCard` (non-X) / `CategoryBadge` + `TweetWithFallback` wrapped in `TweetConstrained` (X)

**ISR file-read pattern**: Platforms with static JSON (bio, duolingo streak, diary) are read directly via `fs.readFileSync()` in `app/page.tsx` instead of HTTP fetch. This avoids circular fetch issues during Amplify ISR builds where `NEXT_PUBLIC_BASE_URL` points to the live site that may not yet have the new API routes.

### API Routes (`app/api/[platform]/route.ts`)

Each API route fetches from a different source:
- **RSS** (`rss-parser`): hatena, zenn, note, hatenabookmark
- **REST APIs**: github (GitHub API), tenhou (nodocchi.moe)
- **Supabase**: naita (reads `naita` table; POST endpoint for adding entries, requires `NAITA_SECRET`)
- **Static JSON**: x (`public/data/x-tweets.json`), duolingo (`public/data/duolingo-stats.json`), steam (`public/data/steam-achievements.json`), spotify (`public/data/spotify-plays.json`), booklog (`public/data/booklog-feed.json`), filmarks (`public/data/filmarks-feed.json`), ff14 (`public/data/ff14-character.json`), ff14-achievements (`public/data/ff14-achievements-feed.json`), diary (`public/data/diary-feed.json`), summaries (`public/data/summaries.json`)
- **No API route** (standalone pages): soundcloud (embedded iframe player), decks (static `public/data/decks.json`)

API routes return `[]` on error to prevent downstream `map()` failures. All routes use `export const revalidate = 3600` (ISR: 1 hour). **Exceptions**: `app/api/tenhou/route.ts` uses `export const dynamic = "force-dynamic"`.

When adding a new platform with external images, add its hostname to `remotePatterns` in `next.config.ts`.

### Layout System

Fixed sidebar + scrollable content (`.split-layout`, `.sidebar`, `.main-content` in `globals.css`). Responsive: stacked on mobile, side-by-side on desktop.

### Type System (`app/lib/types.ts`)

- `BasePost` → platform-specific types (`GitHubPost`, `HatenaPost`, etc.) → `PlatformPost` union
- `Post` — legacy type still used in most code (backward compatible)

## Key Utilities (`app/lib/`)

| File | Purpose |
|---|---|
| `config.ts` | Central config: all platform usernames, profile URLs, and API endpoint paths |
| `api-errors.ts` | `ApiError` class, `createErrorResponse()`, `validateEnvVar()` |
| `fetch-with-timeout.ts` | `fetchWithTimeout()` with AbortController (default 10s) |
| `cache-utils.ts` | File-based JSON cache for Filmarks/Booklog/FF14 Achievements (30-day TTL) |
| `spotify-auth.ts` | Spotify OAuth token management (in-memory cache, 1h TTL) |
| `shared/constants.ts` | Platform colors for all platforms (currently 19) |
| `shared/date-utils.ts` | `formatRelativeTime()` — < 24h: relative, >= 24h: absolute (`yyyy-MM-dd HH:mm`) |

## Critical Patterns

### ISR for Server-Side API Calls
```typescript
export const revalidate = 3600; // ISR: 1時間キャッシュ
```
Currently used: `app/page.tsx`, `app/filmarks/page.tsx`, `app/booklog/page.tsx`. Homepage `getBaseUrl()` uses `NEXT_PUBLIC_BASE_URL` env var (not `headers()`) to avoid forcing dynamic rendering.

### TypeScript: null → undefined Conversion
External APIs return `string | null` but types expect `string | undefined`:
```typescript
language: repo.language ?? undefined,
```

### Image HTTP → HTTPS
```typescript
imgUrl.replace(/^http:/, "https:")
```
Required in all API routes to avoid mixed content errors.

### Platform Key vs Display Name
Platform keys (CSS classes, `platformColors`) are lowercase: `hatenabookmark`, `ff14-achievement`. But `*Client.tsx` `source` props use display names: `"Hatena Bookmark"`. Mappings exist in:
- `FeedPosts.tsx` `sourceToKey`: display name → platform key
- `FeedItemCard.tsx` `platformDisplayNames`: platform key → display name
- Individual card components (`ArticleCard`, `MediaCard`, `StatCard`): each has its own `platformDisplayNames`

### Sidebar Platform Lists Must Stay in Sync
- `app/components/Sidebar.tsx` — used on individual platform pages
- `app/components/HomeSidebar.tsx` — used on the homepage

Both sidebars use **category groups** (`platformGroups` array): 開発, ブログ・記事, SNS, 語学・音楽, 読書・映画, 日記, ゲーム. When adding a platform, place it in the correct group in both files.

**Sidebar `activePlatform` matching**: Uses `platform.path.slice(1)` (e.g. `"/diary"` → `"diary"`), NOT `platform.name.toLowerCase()`. Pass the URL path segment (e.g. `activePlatform="diary"`, `activePlatform="naita"`).

### Platform Colors: CSS + constants.ts Must Stay in Sync
- `globals.css`: CSS variables (`--color-hatena`, etc.) + dark mode overrides
- `constants.ts`: `platformColors` object (used by JS components)

**Dark mode**: Do NOT add `bg-white text-black` to `<body>` in `layout.tsx` — CSS variables in `globals.css` handle all colors. Platform name spans use `color: var(--color-text-secondary)` (via `.feed-item-platform`), NOT `${colors.text}`.

### RSS Thumbnail Quirks
Each platform stores thumbnails differently in RSS. Always check the actual feed structure first. RDF-format feeds (Booklog, Hatena Bookmark) need standard fields added to `rss-parser` `customFields` explicitly.

### External Profile Links (`ExternalProfileLink` / `ProfileLinks`)
Two-variant component in `app/components/shared/ExternalProfileLink.tsx` reads `config.profiles[platform]` and renders an external profile link with WCAG-compliant `aria-label`（"◯◯の◯◯のプロフィールを新しいタブで開く"）, `target="_blank"` + `rel="noopener noreferrer"`, and `aria-hidden` on the icon.
- `variant="icon"` (default): icon-only ↗, used next to the `<h1>` on each platform page
- `variant="pill"`: text + ↗ using existing `platform-tag` class, used by `ProfileLinks.tsx` row in `HomeSidebar`
- **FF14 special case**: `config.profiles.ff14` uses `lodestoneUrl` + `characterName` instead of `url` + `username`; component branches on `"lodestoneUrl" in profile`
- `ProfileLinks.tsx` hardcodes the order and visible labels (e.g. "はてブ" instead of "Hatena Bookmark") — keep in sync with `config.profiles` keys
- Skipped on internal-only pages (`/naita`, `/diary`, `/decks`)

### Adding a New Platform Checklist

**Note**: This checklist applies to **standard feed platforms** (chronological item list). For non-standard cases see the dedicated sections:
- **Catalog-style** (no chronological feed; a curated grid + carousel) → see **Apps** in the GitHub Actions Feeds section. Apps has *no* `/api/apps/route.ts` — it's read via `fs.readFileSync` on both the home server component and `/apps` server component.
- **External-trigger ingest** (push from third-party service via webhook) → see **Swarm**. The pattern is `repository_dispatch` event_type → workflow → script that appends one item at a time to the static JSON. No periodic cron polling.
- **AI-generated content** → see **Diary** (timestamp pinned to 23:59 JST so it sorts to top of day).

For a standard feed platform:
1. Create `app/api/[platform]/route.ts`
2. Create `app/[platform]/page.tsx` + `*Client.tsx`
   - Add `<ExternalProfileLink platform="..." platformLabel="..." />` next to the `<h1>` if the platform has an external profile
3. Add platform color to `globals.css` AND `constants.ts`
4. Add to both `Sidebar.tsx` and `HomeSidebar.tsx` (in correct category group)
5. Add to `RichFeedCard` dispatch or use existing card variant
6. Add display name ↔ key mapping in `FeedPosts.tsx` and `FeedItemCard.tsx`
7. Add hostname to `remotePatterns` in `next.config.ts` (if external images)
8. Add to `config.ts` `profiles` (powers `ExternalProfileLink`) and `apiEndpoints`
9. Add to `HomeFeed.tsx` `filterPlatforms` array (for filter chips)
10. Add to `app/page.tsx` server-side fetch list
11. Add to `ProfileLinks.tsx` `links` array if the platform has an external profile (appears in home sidebar)

## Component System

### Platform Dashboard (`app/components/dashboard/PlatformDashboard.tsx`)
Stats strip above each platform's feed:
```tsx
<PlatformDashboard platform="github" stats={[{ label: "リポジトリ", value: 5 }]} />
```
- `FeedPosts` accepts `renderDashboard?: (posts: Post[]) => ReactNode`
- Duolingo, X, Booklog, Tenhou, FF14 implement the dashboard directly in the Client component (not via `FeedPosts`)

### Chart Components (`app/components/charts/`)
Pure SVG — no external library. `DonutChart` and `BarChart` (vertical/horizontal). Inner circle uses `fill="var(--color-background)"` for dark mode.

### Adaptive Rich Card System (`app/components/shared/`)

`RichFeedCard` dispatches to platform-specific card variants:

| Variant | Platforms |
|---------|-----------|
| **`ArticleCard`** | hatena, zenn, note, hatenabookmark |
| **`MediaCard`** | booklog, filmarks, spotify, naita |
| **`GitHubCard`** | github |
| **`StatCard`** | tenhou, duolingo |
| **`FeedItemCard`** | ff14, ff14-achievement, soundcloud, steam, diary, swarm |
| **`TweetWithFallback`** | x (separate path in `HomeFeed`, not via `RichFeedCard`) |

### Apps Carousel (`app/components/AppsCarousel.tsx`)
Horizontal-scroll showcase placed **above** `HomeFeed` on the homepage. Native CSS `scroll-snap-type: x mandatory`, no JS library. Hidden when `apps.length === 0`. Each card opens the live URL in a new tab; "すべて見る →" links to `/apps`. Source data: `public/data/apps.json`, read via `fs.readFileSync` in `app/page.tsx`.

### HomeFeed Features (`app/components/HomeFeed.tsx`)
- **Platform filter chips**: toggleable buttons per platform with count badges; list defined in `filterPlatforms` array
- **Date separators**: auto-inserted labels (今日/昨日/月日) between posts from different days
- **TweetConstrained**: wrapper component for X tweets that limits height to 350px with `ResizeObserver`-based overflow detection; adds fade gradient (`::after`) only when content overflows
- **Back-to-top button**: appears after 600px scroll

### Rendering
- **Infinite scroll**: `IntersectionObserver`-based in `HomeFeed` (20/page), `XClient` (10/page), `BooklogClient` (20/page), `FeedPosts` (20/page)
- **react-tweet**: dynamically imported with `ssr: false` to avoid hydration issues. On home feed, wrapped in `TweetConstrained` (max-height 350px). On `/x` page, displayed at full size.

## GitHub Actions Feeds

```
GitHub Actions (every 3h cron) → API fetch → public/data/*.json → git push → Amplify deploy
```

### X (Twitter)
- **Schedule**: every 3h at :20 (UTC), cron `20 */3 * * *`
- **Script**: `scripts/update-x-feed.ts` → `public/data/x-tweets.json`
- **Display**: `react-tweet` embeds with category badges (投稿/リポスト/いいね/ブックマーク). `/x` page has category filter tabs + DonutChart. Shared via `TweetEmbed.tsx`.
- OAuth 2.0 PKCE: refresh token rotates on every use, auto-updated via `gh secret set`
- **Re-authorization** (token broken): run `npx tsx scripts/x-oauth-setup.ts` (requires port 3000 free) → GitHub Actions UI → `Update X Feed` → `Run workflow` → paste token into `new_refresh_token` field
- **`GH_PAT` must have Secrets read/write permission** (Classic PAT: `repo` scope; Fine-grained: `Secrets: Read and write`). Without this, the auto-rotation of `X_REFRESH_TOKEN` fails with HTTP 401.
- GitHub Secrets: `X_CLIENT_ID`, `X_CLIENT_SECRET`, `X_REFRESH_TOKEN`, `X_USER_ID`, `GH_PAT`, `DISCORD_WEBHOOK_URL`

### Duolingo
- **Schedule**: every 3h at :25 (UTC)
- **Script**: `scripts/update-duolingo-feed.ts` → `public/data/duolingo-stats.json`
- Generates entries by comparing XP diff; milestone entries every 50 streak days. First run sets baseline only.

### Steam
- **Schedule**: every 3h at :30 (UTC)
- **Script**: `scripts/update-steam-feed.ts` → `public/data/steam-achievements.json`
- Fetches all owned games → per-game achievements → ID-based dedup merge
- **Steam Deck caveat**: Offline achievements sync when going online and launching the game; timestamps reflect sync time, not unlock time.
- GitHub Secrets: `STEAM_API_KEY`, `STEAM_USER_ID`, `DISCORD_WEBHOOK_URL`

### Spotify
- **Schedule**: every 3h at :35 (UTC), cron `35 */3 * * *`
- **Script**: `scripts/update-spotify-feed.ts` → `public/data/spotify-plays.json`
- Fetches `GET /me/player/recently-played?limit=50` → ID-based dedup merge (`spotify-played-{trackId}-{played_at}`)
- Spotify refresh token does NOT rotate (unlike X), so no auto-update needed.
- GitHub Secrets: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN`, `DISCORD_WEBHOOK_URL`
- **Requires Spotify Premium** for Web API access.

### Apps (作品カタログ)
- **Schedule**: daily at 03:15 UTC, cron `15 3 * * *`
- **Script**: `scripts/update-apps-feed.ts` → `public/data/apps.json` + `public/images/apps/<id>.jpg`
- **運用ルール**: 公開したい GitHub repo に topic `featured-app` を付ける（`gh repo edit <repo> --add-topic featured-app`）と自動で /apps とホーム上部カルーセルに掲載される
- 各 repo の `homepage` フィールド必須。空だと skip し warning ログ
- 各アプリの `homepage` URL から `<meta property="og:image">` を取得 → `sharp` で 1200×630 にリサイズして `public/images/apps/<id>.jpg` にコミット
- og:image 未設定のアプリは `placeholder.svg` をフォールバック表示し Discord で warning 通知（→ アプリ側で og:image を追加するように促す）
- repo description → app description、`topics`（`featured-app` を除く）→ tags、として自動マッピング
- API route なし: ホーム/`/apps` ともに `fs.readFileSync` で `public/data/apps.json` 直読み
- カルーセル (`AppsCarousel.tsx`): ネイティブ横スクロール + CSS scroll-snap、JS ライブラリ不要
- `/apps` ページ: 検索 input（name/description/tags への `includes()` マッチ）+ タグフィルタチップ（OR モード）+ CSS Grid (auto-fill)
- GitHub Secrets: `GITHUB_TOKEN`（既存、Actions の自動付与で十分）, `DISCORD_WEBHOOK_URL`

### Swarm (Foursquare)
- **Trigger**: IFTTT 「Foursquare > Any new check-in」 → Webhooks action → GitHub `repository_dispatch` (event_type: `swarm-checkin`)
- **Workflow**: `.github/workflows/swarm-checkin.yml` (`on: repository_dispatch + workflow_dispatch`)
- **Script**: `scripts/append-swarm-checkin.ts` — payload を読み、blocklist 照合、座標丸め、`public/data/swarm-checkins.json` に dedup append
- **Why IFTTT (重要・同じ罠を避けるため)**: Foursquare v2 API は 2021-11-18 以降に登録した開発者アカウントには非公開（"If you added Foursquare after 11/18/21, you automatically have access to the new version (v3) of the API."）。v3 (Places API) には自分のチェックイン取得手段がない。新コンソール (`foursquare.com/developer/`) で発行した Client ID は `/oauth2/authenticate` で `Value ... is invalid for consumer key` エラーになる。**ユーザー自身のチェックイン履歴へのプログラマティックアクセス手段は新規開発者にはもう存在しない**ので、IFTTT (grandfathered) を経由している
- **IFTTT トリガーフィールドは限定的**: `Shout` / `VenueName` / `VenueUrl`（venue ページ URL、checkin permalink ではない）/ `VenueMapImageUrl` / `CheckinDate` の 5 つのみ。`VenueLat` / `VenueLng` / `VenueAddress` / `VenueCategory` は提供されない。座標は `VenueMapImageUrl`（IFTTT 独自形式 `?lat=NUM&lng=NUM`）から正規表現で抽出。dedup は `SHA-1(venueName + createdAt)` で生成（VenueUrl は同じ venue で再訪すると重複するため使えない）
- **遅延**: IFTTT polling (Free 1h, Pro 5min) + Actions (~30s) + Amplify (~3min) ≈ ~1h（事実上のプライバシー遅延）
- **プライバシーフィルタ（実装済み）**:
    - 座標丸め: lat/lng を小数3桁（約100m精度）に丸める
    - **ビルトイン blocklist**: 鉄道駅カテゴリ (`Train Station`, `Subway`, `Metro Station`, `Light Rail Station`, `Tram Station`, `Platform`, `Train`) と venue 名末尾が `駅` / `Station` のものを自動スキップ。Foursquare はバイリンガル表記 `English Station (日本語駅)` を多用するため、名前パターンは末尾 `)` を許容する（regex `/(駅|Station)\s*\)?\s*$/i`）。`駅前` / `駅ビル` などは末尾が 駅/Station ではないので素通り
    - **ユーザー定義 blocklist**: `SWARM_BLOCKED_VENUES` GitHub Secret に JSON 配列で登録。`name` / `address` (部分一致), `category` (完全一致), `lat-lng` (半径指定) の 4 種類の照合タイプ
- **Blocklist 管理 CLI**: `npx tsx scripts/swarm-blocklist.ts <list|add|sync|redact>`
    - `add name "自宅"` で追加 → `.env.local` の `SWARM_BLOCKED_VENUES_LOCAL` (single source of truth) を更新 + `gh secret set SWARM_BLOCKED_VENUES` で GitHub に同期
    - `redact` で直近の checkins から削除候補を選択 → JSON から削除 + その venue 名を blocklist 追加
- **手動テスト**: `gh workflow run swarm-checkin.yml -R satory074/basecamp -f payload='{...}'` で payload 注入動作確認
- **IFTTT セットアップ**: IFTTT applet で Webhooks action から `https://api.github.com/repos/satory074/basecamp/dispatches` に POST、Authorization header に fine-grained PAT。トリガーは Foursquare `Any new check-in`、event_type は `swarm-checkin`
- GitHub Secrets: `SWARM_BLOCKED_VENUES`（オプション、空配列 `[]` でも可）, `DISCORD_WEBHOOK_URL`

### Booklog
- **Schedule**: every 3h at :40 (UTC), cron `40 */3 * * *`
- **Script**: `scripts/update-booklog-feed.ts` → `public/data/booklog-feed.json`
- ブログ表示の全ページをスクレイピング（`?page=N`でページネーション） + RSS（正確なタイムスタンプ用）
- 個別書籍ページスクレイピング（ステータス/評価/読了日/タグ/カテゴリ）
- キャッシュ: `public/data/booklog-cache.json` (30日TTL、dedup merge)
- インクリメンタル: 全書籍がキャッシュ済みのページで停止
- リトライ: 3回、指数バックオフ + ジッター
- **URL形式の注意**: 棚ページは `/item/1/ID`、RSSは `/users/.../archives/1/ID` を返す。評価・ステータスの取得は archives 形式でのみ動作するため `toArchivesUrl()` で変換が必要。重複排除は `extractIsbn()` でIDベースで行う。
- **識別子フォーマット**: ISBN-13（数字13桁）/ ISBN-10（末尾Xあり）/ ASIN（B始まりの英数字10桁）が混在。`toArchivesUrl()` と `extractIsbn()` の正規表現は `[\dA-Z]+/i` で全形式に対応する必要がある（`\d+` だとXやBで止まり、ISBN-10末尾XやKindle本のASINで `/item/1/` 公開ページにフォールバックして status 空となる）。
- **ステータス文字列**: ブクログのHTMLは `"いま読んでる"` を返す（`"読んでる"` ではない）。クライアント側のフィルタ・カウントもこの正確な文字列でマッチさせること。
- GitHub Secrets: `DISCORD_WEBHOOK_URL`

### Filmarks
- **Schedule**: every 3h at :45 (UTC), cron `45 */3 * * *`
- **Script**: `scripts/update-filmarks-feed.ts` → `public/data/filmarks-feed.json`
- 3カテゴリ(映画/ドラマ/アニメ)一覧を全ページスクレイピング（`?page=N`でページネーション） → 個別ページ日付取得
- Filmarks URLフォーマット: `#mark-{id}` (旧: `?mark_id={id}` — 両方サポート)
- キャッシュ: `public/data/filmarks-cache.json` (30日TTL)
- GitHub Secrets: `DISCORD_WEBHOOK_URL`

### FF14 Achievements
- **Schedule**: every 3h at :50 (UTC), cron `50 */3 * * *`
- **Script**: `scripts/update-ff14-achievements-feed.ts` → `public/data/ff14-achievements-feed.json`
- インクリメンタルキャッシュ: アチーブメントは不変データ、キャッシュ済みページで停止
- キャッシュ: `public/data/ff14-achievements-cache.json` (期限なし)
- GitHub Secrets: `DISCORD_WEBHOOK_URL`

### FF14 Character
- **Schedule**: every 3h at :55 (UTC), cron `55 */3 * * *`
- **Script**: `scripts/update-ff14-feed.ts` → `public/data/ff14-character.json`
- Lodestone キャラクターページ + クラス/ジョブページの2ページスクレイピング
- GitHub Secrets: `DISCORD_WEBHOOK_URL`

### Diary (AI-generated daily diary)
- **Schedule**: daily at 23:30 JST (14:30 UTC), cron `30 14 * * *`
- **Script**: `scripts/update-diary-feed.ts` → `public/data/diary-feed.json`
- 過去24hの全プラットフォーム活動データ（Spotify/X/Steam/Duolingo/Booklog/Filmarks/FF14）を収集 → Gemini API で二人称の日本語日記を生成
- Model: `gemini-2.5-flash` (思考型モデル、`maxOutputTokens: 4096` 必要)
- `TARGET_DATE=YYYY-MM-DD` 環境変数で過去日付の日記を後から生成可能
- **エントリ日付**: 常に対象日の `23:59:59 JST` (`14:59:59 UTC`) に設定。これによりホームフィードでその日の先頭に表示される。実行時刻を使うとフィード下部に埋もれるため注意。
- **cron遅延対策**: JST 0:00〜4:59 に実行された場合は前日扱い（`jstHour` チェック）
- **ISR回避**: `app/page.tsx` ではHTTPフェッチではなく `diary-feed.json` をファイル直読み（Amplifyビルド時の循環フェッチ問題を回避）
- GitHub Secrets: `GEMINI_API_KEY`, `DISCORD_WEBHOOK_URL`

### Bio (AI-generated profile)
- **Schedule**: weekly (Sunday 09:00 JST)
- **Script**: `scripts/update-bio.ts` → `public/data/bio.json`
- Reads `public/data/*.json` → Gemini API → 100-150 char Japanese bio. Model: `gemini-2.0-flash-lite`.
- GitHub Secrets: `GEMINI_API_KEY`, `DISCORD_WEBHOOK_URL`

### Daily Digest (集約通知)
- **Schedule**: daily 23:00 JST (14:00 UTC), cron `0 14 * * *`
- **Script**: `scripts/send-daily-digest.ts`（`public/data/` 直読み、外部フェッチなし）
- Diary 実行の30分前に当日分の活動を集約し、1通の Discord embed で送信
- 各フィードの `lastUpdated` を見て、期待頻度より古ければ "⚠️ Stale feeds" 欄に列挙（GitHub Actions が静かに停止したケースを検知）

## Discord通知ポリシー

全 update スクリプトは `scripts/lib/discord-notification.ts` の共通ヘルパーを使用:
- `notifyIfNoteworthy()` — 成功かつ `newItems === 0` のとき通知抑制、エラー・警告は常送信
- `notifyDiscord()` — 無条件送信（diary/bio/digest で使用）
- `DISCORD_DRY_RUN=1` 環境変数で POST せず stdout にペイロードを出力（テスト用）

個別スクリプトの通知は「新規アイテムあり」「エラー」「警告（0件フェッチなど障害疑い）」のときのみ発火。静かな日は Daily Digest 1通のみ届く設計。

## Scraping Optimization (GitHub Actions scripts)

Booklog/Filmarks/FF14/FF14 Achievements のスクレイピングは全て GitHub Actions で実行。API routes は静的 JSON を読み込むのみ。

共通: 5 concurrent requests (`BATCH_SIZE = 5`), 15s timeout, リトライ3回 (指数バックオフ + ジッター), file cache in `public/data/*-cache.json` (git-committed). ページネーション対応スクリプトは全ページキャッシュ済みで停止するインクリメンタル方式。

FF14 Achievements: incremental caching — achievements are immutable, cached entries never expire. Stops scraping when a fully-cached page is reached.

## Environment Variables

```bash
GITHUB_TOKEN=...              # Enhanced GitHub API access
GEMINI_API_KEY=...            # AI summary generation
NEXT_PUBLIC_BASE_URL=...      # Server-side API base URL (must be set on Amplify)

SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
SPOTIFY_REFRESH_TOKEN=...

STEAM_API_KEY=...
STEAM_USER_ID=...

NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

NAITA_SECRET=...               # Auth for naita POST endpoint

X_CLIENT_ID=...
X_CLIENT_SECRET=...
X_REFRESH_TOKEN=...            # Rotates on every use (auto-updated by script)
X_USER_ID=...
GH_PAT=...                    # For auto-updating X_REFRESH_TOKEN (needs Secrets R/W)

DISCORD_WEBHOOK_URL=...        # GitHub Actions notifications

SWARM_BLOCKED_VENUES_LOCAL=... # Swarm blocklist の local master（JSON 配列、.env.local のみ）。
                               # `scripts/swarm-blocklist.ts` で更新 → 同名なし `SWARM_BLOCKED_VENUES` Secret に sync
```

## Deployment

- **Hosting**: AWS Amplify (auto-deploys on push to main, ~2-3 min)
- **Domain**: satory074.com
- **Always run `npm run build` locally before pushing**

## Summaries Feature

AI-generated summaries in `public/data/summaries.json`. Generated via `npm run generate-summaries` (requires `GEMINI_API_KEY`). When adding a platform: update `lib/types.ts` `Post.platform`, `lib/formatters.ts` `convertUrlToCustomSchema`, and `generate-summaries.js` `fetchPosts`.

## Auxiliary Scripts (non-scheduled)

- `scripts/x-oauth-setup.ts` — 初回 OAuth 2.0 PKCE 認可フロー (port 3000 必須)。`X_REFRESH_TOKEN` が失効したとき実行
- `scripts/swarm-blocklist.ts` — Swarm checkin の blocklist 管理 CLI (`list|add|sync|redact`)
- `scripts/generate-favicon.ts` — ファビコン/アイコン再生成
- `generate-summaries.js` — ルート直下の `.js`（他スクリプトは `.ts`）、`npm run generate-summaries` から呼ばれる

## Detailed Implementation Docs (`docs/`)

細かい実装ガイドは `docs/` にあり、CLAUDE.md のサマリより深い情報を持つ:
- `oauth-setup.md` — X/Spotify OAuth セットアップ手順
- `tenhou-integration.md`, `tenhou-automation.md`, `tenhou-realtime-guide.md` — Tenhou 関連
- `microblog-setup.md`, `microblog-best-practices.md`, `troubleshooting-microblog.md` — Naita (Supabase)
- `SUMMARIES.md` — Summaries 機能の詳細
- `supabase-user-setup.md` — Supabase ユーザー管理

**Note**: ルートの `README.md` は古い（Next.js 15・Vercel と書かれているが実際は 16・Amplify、存在しない npm スクリプトも記載）。CLAUDE.md を正とする。
