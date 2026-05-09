# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Basecamp is a personal homepage that aggregates content from 19+ platforms into a unified feed, plus an `/apps` catalog (carousel on home + searchable grid) and external profile pill row. Built with Next.js 16 (App Router), TypeScript, and Tailwind CSS. Hosted on **Firebase App Hosting** (Cloud Run, asia-east1, auto-deploys on push to main).

**Live site**: satory074.com (apex + www, wildcard cert)

> ⚠️ **`README.md` は古い** (Next.js 15 / Vercel と書かれているが実際は Next.js 16 / Firebase App Hosting、存在しない npm script も記載)。**この CLAUDE.md を正とする**。

## Development Commands

```bash
npm run dev      # Dev server with Turbopack (localhost:3000)
npm run build    # Production build (uses --webpack, NOT Turbopack)
npm run lint     # ESLint 9 flat config (app/ directory)
npm run start    # Start production server
```

**No test framework** is configured. `npm run build` is the only way to validate TypeScript — Cloud Run builds (Firebase App Hosting) are stricter than local dev.

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

**Feed JSON は GCS bucket `basecamp-feeds` (asia-northeast1, public-read) が source of truth**。`scripts/lib/feed-storage.ts` の `readFeed/writeFeed`、`app/lib/feed-storage.ts` の `readFeedJson` 経由で読み書きする。ローカル開発で `GCS_BUCKET` 環境変数が未設定のときだけ `public/data/` への fs フォールバックが効く（git tracking からは外している）。

`app/page.tsx` で bio / duolingo / diary / apps を直接 `readFeedJson` で取りに行くのは API ラウンドトリップを避けるため。Next.js の ISR (`revalidate: 300`) でキャッシュされる。

### API Routes (`app/api/[platform]/route.ts`)

Each API route fetches from a different source:
- **RSS** (`rss-parser`): hatena, zenn, note, hatenabookmark
- **REST APIs**: github (GitHub API), tenhou (nodocchi.moe)
- **Supabase**: naita (reads `naita` table; POST endpoint for adding entries, requires `NAITA_SECRET`)
- **HTML metadata fetcher**: `app/api/naita/metadata/route.ts` — `?url=` を受けて `<title>` / og:image を抽出して返す。naita 投稿フォームの URL プレビュー用ユーティリティ (cheerio + `fetchWithTimeout` 5s)
- **GCS-backed JSON** (read at runtime via `readFeedJson`、ISR 5分): x (`x-tweets.json`), duolingo (`duolingo-stats.json`), steam (`steam-achievements.json`), spotify (`spotify-plays.json`), booklog (`booklog-feed.json`), filmarks (`filmarks-feed.json`), ff14 (`ff14-character.json`), ff14-achievements (`ff14-achievements-feed.json`), diary (`diary-feed.json`), swarm (`swarm-checkins.json`), summaries (`summaries.json`) — すべて `gs://basecamp-feeds/`
- **No API route** (standalone pages): soundcloud (embedded iframe player), decks (static `public/data/decks.json` — git tracked)

API routes return `[]` on error to prevent downstream `map()` failures. ISR キャッシュ:
- 大半は `export const revalidate = 3600`（1 時間）
- `app/page.tsx` と `app/apps/page.tsx` は `revalidate = 300`（5 分） — Cloud Run scale-to-zero で長い revalidate window が完走しないバグ対策 (下記 "Cloud Run × ISR Gotcha" 参照)
- `app/booklog/page.tsx` と `app/filmarks/page.tsx` は `revalidate = 3600`（1 時間）
- `app/api/tenhou/route.ts` は `revalidate = 1800`（30 分）
- `app/api/naita/route.ts` のみ `dynamic = "force-dynamic"`（ユーザー投稿の即時反映が必要なため）
- 内部 GCS fetch (`readFeedJson`) は `next: { revalidate: 300 }` で 5 分窓キャッシュ

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
| `feed-storage.ts` | `readFeedJson()` — GCS から ISR 5min 窓で feed JSON を取得。`GCS_BUCKET` 未設定時は `public/data/` への fs フォールバック (ローカル開発用) |
| `spotify-auth.ts` | Spotify OAuth token management (in-memory cache, 1h TTL) |
| `shared/constants.ts` | Platform colors for all platforms (currently 19) |
| `shared/date-utils.ts` | `formatRelativeTime()` — < 24h: relative, >= 24h: absolute (`yyyy-MM-dd HH:mm`) |

## Critical Patterns

### ISR for Server-Side API Calls
```typescript
export const revalidate = 300; // ISR: 5分 (home / apps)
export const revalidate = 3600; // ISR: 1時間 (booklog / filmarks / api/*)
```
ホームと `/apps` は `revalidate = 300`、`/booklog` と `/filmarks` は `revalidate = 3600`、`/api/*` も基本 `3600`。`app/page.tsx` の `getBaseUrl()` は `NEXT_PUBLIC_BASE_URL` env var を読む (`headers()` を使うと dynamic rendering を強制してしまうため)。

### Cloud Run × ISR Gotcha (Phase 6 で実機検出した罠)

Cloud Run の scale-to-zero では、Next.js の **background revalidation が response 送信後にインスタンス kill されて完走しないケースがある**。`revalidate = 21600` (6 時間) で運用していたホームが build 直後の prerender で 60 時間以上凍結する事故が発生した。対策:

- 静的 prerender + ISR を使う場合、**`revalidate` は短め (5〜10 分)** にして通常のリクエスト処理内で完走させる
- 長い window が必要なら `dynamic = "force-dynamic"` か、GHA 等から `revalidatePath()` を叩く on-demand revalidation を実装する
- Symptom が出たら確認方法: `curl -sf "https://satory074.com/?_=$(date +%s)" -H "Cache-Control: no-cache"` で origin を直接叩いて、HTML 内の最新日付が最近の cron 結果を含んでいるか確認

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
- **Catalog-style** (no chronological feed; a curated grid + carousel) → see **Apps** in the GitHub Actions Feeds section. Apps has *no* `/api/apps/route.ts` — it's read via `readFeedJson("apps.json")` on both the home server component and `/apps` server component.
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
9. Add to `app/page.tsx` server-side fetch list
10. Add to `ProfileLinks.tsx` `links` array if the platform has an external profile (appears in home sidebar)

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
Horizontal-scroll showcase placed **above** `HomeFeed` on the homepage. Native CSS `scroll-snap-type: x mandatory`, no JS library. Hidden when `apps.length === 0`. Each card opens the live URL in a new tab; "すべて見る →" links to `/apps`. Source data: `apps.json` on GCS, read via `readFeedJson` in `app/page.tsx`.

### HomeFeed Features (`app/components/HomeFeed.tsx`)
- **Sticky search**: `SearchBar` (`value` prop で controlled) を `.feed-controls` でラップして `position: sticky; top: 0`。検索は client-side `String.includes` (title + description)。1909 件規模で実測ミリ秒以下
- **URL state persistence**: `?q=...` を `window.history.replaceState()` で 300ms debounce 同期。`useSearchParams` を使わず Suspense 不要。Next の RSC 再フェッチを避けるため `router.replace` ではなく素の History API を叩く
- **Empty / End-of-feed states**: 検索中に該当 0 件で `.feed-empty` (検索クリアボタン付き)、検索中に末尾まで到達で `.feed-end`。検索なしの通常スクロールでは末尾メッセージは出ない (フィードは時系列で常に増えていくため)
- **Date separators**: auto-inserted labels (今日/昨日/月日) between posts from different days
- **TweetConstrained**: wrapper component for X tweets that limits height to 350px with `ResizeObserver`-based overflow detection; adds fade gradient (`::after`) only when content overflows
- **Back-to-top button**: appears after 600px scroll
- **`content-visibility: auto`**: `.feed-item` に適用してオフスクリーンカードの layout/paint をスキップ。1909 件混在高さでもスクロールが軽い

> ⚠️ プラットフォーム別フィルタチップは削除済み (2026-05-09)。検索一本でいい、というユーザー判断。複数フィルタ・文脈カウント・`?p=` URL state も同時に廃止。

### AppsCarousel Spotlight Mode (`app/components/AppsCarousel.tsx`)
`apps.length === 1` のときは `.apps-carousel-spotlight` クラスを付与してカードを最大 480px に拡大、scroll-snap と「すべて見る →」リンクを無効化。プレースホルダ画像でも見栄えが良くなる。

### Sidebar Bio Toggle (`app/components/HomeSidebar.tsx`)
`HomeSidebar` は Client Component。`CollapsibleBio` で `useRef` + `ResizeObserver` で `scrollHeight > clientHeight` を判定し、溢れているときだけ「詳しく見る / 閉じる」ボタンを表示。展開時は `WebkitLineClamp: 'unset'` で全文表示。

### Rendering
- **Infinite scroll**: `IntersectionObserver`-based in `HomeFeed` (20/page), `XClient` (10/page), `BooklogClient` (20/page), `FeedPosts` (20/page)
- **react-tweet**: dynamically imported with `ssr: false` to avoid hydration issues. On home feed, wrapped in `TweetConstrained` (max-height 350px). On `/x` page, displayed at full size.

## GitHub Actions Feeds

```
GitHub Actions (every 3h cron) → API fetch → Workload Identity Federation で GCP 認証 → gs://basecamp-feeds/<feed>.json に PUT → Cloud Run が ISR 5min で次回リクエスト時に拾う
```

**もう main には commit しない**。`scripts/lib/feed-storage.ts` の `writeFeed()` が `@google-cloud/storage` SDK で直接 bucket に書き込み、5 分以内にサイトに反映される。`[skip-cd]` も daily Amplify rebuild も不要 (廃止済み)。GitHub Actions の各 workflow には `permissions: id-token: write` と `google-github-actions/auth@v2` (workload_identity_provider: `projects/130346180231/locations/global/workloadIdentityPools/github-pool/providers/github`、service_account: `gha-feed-writer@basecamp-satory074.iam.gserviceaccount.com`) のステップが入っている。

### X (Twitter)
- **Schedule**: every 3h at :20 (UTC), cron `20 */3 * * *`
- **Script**: `scripts/update-x-feed.ts` → `gs://basecamp-feeds/x-tweets.json`
- **Display**: `react-tweet` embeds with category badges (投稿/リポスト/いいね/ブックマーク). `/x` page has category filter tabs + DonutChart. Shared via `TweetEmbed.tsx`.
- OAuth 2.0 PKCE: refresh token rotates on every use, auto-updated via `gh secret set`
- **Re-authorization** (token broken): run `npx tsx scripts/x-oauth-setup.ts` (requires port 3000 free) → GitHub Actions UI → `Update X Feed` → `Run workflow` → paste token into `new_refresh_token` field
- **`GH_PAT` must have Secrets read/write permission** (Classic PAT: `repo` scope; Fine-grained: `Secrets: Read and write`). Without this, the auto-rotation of `X_REFRESH_TOKEN` fails with HTTP 401.
- GitHub Secrets: `X_CLIENT_ID`, `X_CLIENT_SECRET`, `X_REFRESH_TOKEN`, `X_USER_ID`, `GH_PAT`, `DISCORD_WEBHOOK_URL`

### Duolingo
- **Schedule**: every 3h at :25 (UTC)
- **Script**: `scripts/update-duolingo-feed.ts` → `gs://basecamp-feeds/duolingo-stats.json`
- Generates entries by comparing XP diff; milestone entries every 50 streak days. First run sets baseline only.

### Steam
- **Schedule**: every 3h at :30 (UTC)
- **Script**: `scripts/update-steam-feed.ts` → `gs://basecamp-feeds/steam-achievements.json`
- Fetches all owned games → per-game achievements → ID-based dedup merge
- **Steam Deck caveat**: Offline achievements sync when going online and launching the game; timestamps reflect sync time, not unlock time.
- GitHub Secrets: `STEAM_API_KEY`, `STEAM_USER_ID`, `DISCORD_WEBHOOK_URL`

### Spotify
- **Schedule**: every 3h at :35 (UTC), cron `35 */3 * * *`
- **Script**: `scripts/update-spotify-feed.ts` → `gs://basecamp-feeds/spotify-plays.json`
- Fetches `GET /me/player/recently-played?limit=50` → ID-based dedup merge (`spotify-played-{trackId}-{played_at}`)
- Spotify refresh token does NOT rotate (unlike X), so no auto-update needed.
- GitHub Secrets: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN`, `DISCORD_WEBHOOK_URL`
- **Requires Spotify Premium** for Web API access.

### Apps (作品カタログ)
- **Schedule**: daily at 03:15 UTC, cron `15 3 * * *`
- **Script**: `scripts/update-apps-feed.ts` → `gs://basecamp-feeds/apps.json` + `gs://basecamp-feeds/images/apps/<id>.jpg`
- **運用ルール**: 公開したい GitHub repo に topic `featured-app` を付ける（`gh repo edit <repo> --add-topic featured-app`）と自動で /apps とホーム上部カルーセルに掲載される
- 各 repo の `homepage` フィールド必須。空だと skip し warning ログ
- 各アプリの `homepage` URL から `<meta property="og:image">` を取得 → `sharp` で 1200×630 にリサイズ → `writeBinary()` 経由で `gs://basecamp-feeds/images/apps/<id>.jpg` に PUT (`scripts/lib/feed-storage.ts`)
- og:image 未設定のアプリは `placeholder.svg` をフォールバック表示し Discord で warning 通知（→ アプリ側で og:image を追加するように促す）
- repo description → app description、`topics`（`featured-app` を除く）→ tags、として自動マッピング
- API route なし: ホーム/`/apps` ともに `readFeedJson("apps.json")` で GCS 直読み
- カルーセル (`AppsCarousel.tsx`): ネイティブ横スクロール + CSS scroll-snap、JS ライブラリ不要
- `/apps` ページ: 検索 input（name/description/tags への `includes()` マッチ）+ タグフィルタチップ（OR モード）+ CSS Grid (auto-fill)
- GitHub Secrets: `GITHUB_TOKEN`（既存、Actions の自動付与で十分）, `DISCORD_WEBHOOK_URL`

### Swarm (Foursquare)
- **Trigger**: IFTTT 「Foursquare > Any new check-in」 → Webhooks action → GitHub `repository_dispatch` (event_type: `swarm-checkin`)
- **Workflow**: `.github/workflows/swarm-checkin.yml` (`on: repository_dispatch + workflow_dispatch`)
- **Script**: `scripts/append-swarm-checkin.ts` — payload を読み、blocklist 照合、座標丸め、`gs://basecamp-feeds/swarm-checkins.json` に dedup append
- **Why IFTTT (重要・同じ罠を避けるため)**: Foursquare v2 API は 2021-11-18 以降に登録した開発者アカウントには非公開（"If you added Foursquare after 11/18/21, you automatically have access to the new version (v3) of the API."）。v3 (Places API) には自分のチェックイン取得手段がない。新コンソール (`foursquare.com/developer/`) で発行した Client ID は `/oauth2/authenticate` で `Value ... is invalid for consumer key` エラーになる。**ユーザー自身のチェックイン履歴へのプログラマティックアクセス手段は新規開発者にはもう存在しない**ので、IFTTT (grandfathered) を経由している
- **IFTTT トリガーフィールドは限定的**: `Shout` / `VenueName` / `VenueUrl`（venue ページ URL、checkin permalink ではない）/ `VenueMapImageUrl` / `CheckinDate` の 5 つのみ。`VenueLat` / `VenueLng` / `VenueAddress` / `VenueCategory` は提供されない。座標は `VenueMapImageUrl`（IFTTT 独自形式 `?lat=NUM&lng=NUM`）から正規表現で抽出。dedup は `SHA-1(venueName + createdAt)` で生成（VenueUrl は同じ venue で再訪すると重複するため使えない）
- **遅延**: IFTTT polling (Free 1h, Pro 5min) + Actions (~30s) + GCS write 即時 + ISR 5min 窓 ≈ ~1h（事実上のプライバシー遅延）
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
- **Script**: `scripts/update-booklog-feed.ts` → `gs://basecamp-feeds/booklog-feed.json`
- 棚ページ `?display=image` を `?page=N` でページネーション。各 `<div class="item-wrapper shelf-item">` の `data-book` 属性に書誌・ステータス・評価 (`rank`)・読了日 (`read_at`)・カテゴリ (`category_name`)・タグ (`tags`) を JSON で全部含むので、個別書籍ページのスクレイピングは不要 (旧実装と異なる)。RSS は `dc:date` の正確なタイムスタンプ取得のみに使う。
- **識別子フォーマット**: ISBN-13（数字13桁）/ ISBN-10（末尾Xあり）/ ASIN（B始まりの英数字10桁）が混在。`extractIsbn()` の正規表現は `[\dA-Z]+/i` で全形式に対応 (`\d+` だと末尾 X / B で止まる)。
- **ステータス文字列**: `data-book.status_name` は `"いま読んでる"` を返す（`"読んでる"` ではない）。`BooklogClient.tsx` の filter/count もこの正確な文字列で照合すること。
- **CloudFront 地理キャッシュの罠 (Phase 2 で実機検出)**: Booklog は CloudFront の背後にあり、PoP (geographic edge) ごとに別キャッシュを返す。Osaka PoP (国内開発機) は `display=image` の全 27 ページを返すが、GitHub Actions ランナー (US PoP) はページ 6 で空応答になり 120 冊で打ち止め。`Cache-Control: no-cache` / Pragma / `PHPSESSID` cookie / クエリのキャッシュバスターを送る対策はコードに入っているが effective ではなく、origin 側で IP 別に応答が違う模様。
  - 帰結: GHA の定期実行は最近の 120 冊しか refresh できない (古い本のステータス・読了日は immutable なので実害は少ない)
  - 古い本のメタデータも更新したいときは **国内 IP からローカル実行 → `gsutil cp` で `gs://basecamp-feeds/booklog-feed.json` に bootstrap** する。手順は `scripts/update-booklog-feed.ts` を `GCS_BUCKET= DISCORD_DRY_RUN=1 npx tsx ...` で走らせて `public/data/booklog-feed.json` を生成 → `gsutil -h "Cache-Control:public,max-age=300,stale-while-revalidate=3600" cp ...` で上書き
- GitHub Secrets: `DISCORD_WEBHOOK_URL`

### Filmarks
- **Schedule**: every 3h at :45 (UTC), cron `45 */3 * * *`
- **Script**: `scripts/update-filmarks-feed.ts` → `gs://basecamp-feeds/filmarks-feed.json`
- 3カテゴリ(映画/ドラマ/アニメ)一覧を全ページスクレイピング（`?page=N`でページネーション） → 個別ページ日付取得
- Filmarks URLフォーマット: `#mark-{id}` (旧: `?mark_id={id}` — 両方サポート)
- キャッシュ: `gs://basecamp-feeds/filmarks-cache.json` (30日TTL)
- GitHub Secrets: `DISCORD_WEBHOOK_URL`

### FF14 Achievements
- **Schedule**: every 3h at :50 (UTC), cron `50 */3 * * *`
- **Script**: `scripts/update-ff14-achievements-feed.ts` → `gs://basecamp-feeds/ff14-achievements-feed.json`
- インクリメンタルキャッシュ: アチーブメントは不変データ、キャッシュ済みページで停止
- キャッシュ: `gs://basecamp-feeds/ff14-achievements-cache.json` (期限なし)
- GitHub Secrets: `DISCORD_WEBHOOK_URL`

### FF14 Character
- **Schedule**: every 3h at :55 (UTC), cron `55 */3 * * *`
- **Script**: `scripts/update-ff14-feed.ts` → `gs://basecamp-feeds/ff14-character.json`
- Lodestone キャラクターページ + クラス/ジョブページの2ページスクレイピング
- GitHub Secrets: `DISCORD_WEBHOOK_URL`

### Diary (AI-generated daily diary)
- **Schedule**: daily at 23:30 JST (14:30 UTC), cron `30 14 * * *`
- **Script**: `scripts/update-diary-feed.ts` → `gs://basecamp-feeds/diary-feed.json`
- 過去24hの全プラットフォーム活動データ（Spotify/X/Steam/Duolingo/Booklog/Filmarks/FF14）を収集 → Gemini API で二人称の日本語日記を生成
- Model: `gemini-2.5-flash` (思考型モデル、`maxOutputTokens: 4096` 必要)
- `TARGET_DATE=YYYY-MM-DD` 環境変数で過去日付の日記を後から生成可能
- **エントリ日付**: 常に対象日の `23:59:59 JST` (`14:59:59 UTC`) に設定。これによりホームフィードでその日の先頭に表示される。実行時刻を使うとフィード下部に埋もれるため注意。
- **cron遅延対策**: JST 0:00〜4:59 に実行された場合は前日扱い（`jstHour` チェック）
- **ISR回避**: `app/page.tsx` では `/api/diary` を経由せず `readFeedJson("diary-feed.json")` で GCS から直接読み（API ラウンドトリップを省く）
- GitHub Secrets: `GEMINI_API_KEY`, `DISCORD_WEBHOOK_URL`

### Bio (AI-generated profile)
- **Schedule**: weekly (Sunday 09:00 JST)
- **Script**: `scripts/update-bio.ts` → `gs://basecamp-feeds/bio.json`
- Reads feed JSON from GCS → Gemini API → 100-150 char Japanese bio. Model: `gemini-2.0-flash-lite`.
- GitHub Secrets: `GEMINI_API_KEY`, `DISCORD_WEBHOOK_URL`

### Daily Digest (集約通知)
- **Schedule**: daily 23:00 JST (14:00 UTC), cron `0 14 * * *`
- **Script**: `scripts/send-daily-digest.ts`（GCS から `readFeed` で集約、外部 API フェッチなし）
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

共通: 15s timeout, リトライ3回 (指数バックオフ + ジッター)。

- **Booklog**: 棚 `?display=image` の `data-book` JSON 属性で全フィールドが取れるため、個別ページ並列フェッチもキャッシュも不要 (27 ページ × 1 req)。
- **Filmarks / FF14 / FF14 Achievements**: 個別ページの並列フェッチ (`BATCH_SIZE = 5`) + `gs://basecamp-feeds/*-cache.json` への増分キャッシュ。ページネーション対応スクリプトは全ページキャッシュ済みで停止するインクリメンタル方式。
- **FF14 Achievements**: アチーブメントは不変なのでキャッシュは無期限。完全にキャッシュ済みのページに当たると停止。

## Environment Variables

```bash
GITHUB_TOKEN=...              # Enhanced GitHub API access
GEMINI_API_KEY=...            # AI summary generation
NEXT_PUBLIC_BASE_URL=...      # Site URL (set in apphosting.yaml)
GCS_BUCKET=basecamp-feeds     # Feed JSON bucket; unset locally to fall back to public/data fs reads

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

- **Hosting**: Firebase App Hosting (Cloud Run, asia-east1, auto-deploys on push to main, ~5min build)
- **Backend**: `basecamp-web` (project `basecamp-satory074`)、live branch `main`
- **Domain**: satory074.com (apex) + www.satory074.com、wildcard cert (Google CA)
- **DNS**: Route 53 hosted zone `Z0716810FXBCKCNXIT0Q`、A レコード `35.219.200.48` (Firebase 静的 IP)
- **Always run `npm run build` locally before pushing**

### GCP インフラ (Phase 1 で構築)

- **GCS bucket** `basecamp-feeds` (asia-northeast1, public-read, default Cache-Control: `public, max-age=300, stale-while-revalidate=3600`) — フィード JSON & 増分キャッシュ & apps の og:image (`images/apps/*.jpg`)
- **Workload Identity Federation** for GitHub Actions:
  - Pool/provider: `projects/130346180231/locations/global/workloadIdentityPools/github-pool/providers/github`
  - Service account: `gha-feed-writer@basecamp-satory074.iam.gserviceaccount.com` (`roles/storage.objectAdmin` on bucket)
  - Repo restriction: `repository_owner == 'satory074'` + `repo == 'satory074/basecamp'`
- **Secret Manager**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NAITA_SECRET` — `apphosting.yaml` で `availability: BUILD/RUNTIME` 指定。compute SA `firebase-app-hosting-compute@basecamp-satory074.iam.gserviceaccount.com` に `roles/secretmanager.secretAccessor` 付与
- **Cloud Run**: scale-to-zero (minInstances: 0)、512MiB RAM、CPU 1、concurrency 80、maxInstances 3
- **コスト**: Firebase 無料枠内（月 360 build-min / 10GB egress / 1.5M req）+ GCS \< 0.01\$ ≈ **月 \$0.01 以下**

### Firebase live branch の切替

```bash
# 現在の live branch を確認
curl -s "https://firebaseapphosting.googleapis.com/v1beta/projects/basecamp-satory074/locations/asia-east1/backends/basecamp-web/traffic" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" | jq '.rolloutPolicy.codebaseBranch'

# 切替 (例: feature ブランチで preview を試したいとき)
curl -s -X PATCH "https://firebaseapphosting.googleapis.com/v1beta/projects/basecamp-satory074/locations/asia-east1/backends/basecamp-web/traffic?updateMask=rolloutPolicy.codebaseBranch" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  -d '{"rolloutPolicy":{"codebaseBranch":"feat/xxx"}}'

# 手動 rollout (live branch 変更後すぐデプロイ)
firebase apphosting:rollouts:create basecamp-web --project=basecamp-satory074 --git-branch main --force
```

### ロールバック

過去ビルドの URL は `firebase apphosting:backends:get basecamp-web` で確認可能。問題があれば旧 build の rollout を `firebase apphosting:rollouts:create` で復元、または前 commit に revert して push。

## Summaries Feature

AI-generated summaries on `gs://basecamp-feeds/summaries.json`. Generated via `npm run generate-summaries` (requires `GEMINI_API_KEY`). When adding a platform: update `lib/types.ts` `Post.platform`, `lib/formatters.ts` `convertUrlToCustomSchema`, and `generate-summaries.js` `fetchPosts`.

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

**Note**: ルートの `README.md` は古い（Next.js 15 / Vercel 表記、`create-admin` / `check-supabase` / `test-auth` など実在しない npm script を列挙）。CLAUDE.md を正とする。`package.json` の実 scripts は `dev` / `build` / `start` / `lint` / `generate-summaries` のみ。
