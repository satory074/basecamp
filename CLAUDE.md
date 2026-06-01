# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Basecamp is a personal homepage that aggregates content from multiple platforms (current count: see `app/lib/shared/constants.ts` `platformColors`) into a unified feed, plus an `/apps` catalog (carousel on home + searchable grid) and external profile pill row. Built with Next.js 16 (App Router), TypeScript, and Tailwind CSS. **Static-exported** (`output: 'export'`) and hosted on **GitHub Pages** (Fastly CDN, auto-deploys via GitHub Actions on push to main + daily cron rebuild for feed refresh).

**Live site**: satory074.com (apex + www, Let's Encrypt 経由で GitHub Pages が自動発行)

> ⚠️ ルートの `README.md` は古い。**この CLAUDE.md を正とする** (詳細は末尾の Note 参照)。

## Development Commands

```bash
npm run dev      # Dev server with Turbopack (localhost:3000)
npm run build    # Production build (uses --webpack, NOT Turbopack)
npm run lint     # ESLint 9 flat config (app/ directory)
npm run start    # Start production server
```

**No test framework** is configured. `npm run build` is the only way to validate TypeScript. Build produces a fully static site in `out/` thanks to `output: 'export'` in `next.config.ts`.

**Port 3000 が他プロジェクト (例: tenhoulog) で常駐していることがある**。`lsof -ti:3000` で確認し、占有されていたら `PORT=3100 npm run dev` 等で別ポートに逃がす。

**ESLint**: `@typescript-eslint/no-explicit-any` is an **error** (never use `any`). Config is `eslint.config.mjs` (flat config, NOT `.eslintrc.json`).

### Local setup

`.env.local` (gitignore 済) に必要 secret を入れて `npm run dev`。代表的な値の入手元は **Environment Variables** 節を参照。

**重要**: `public/data/` は git tracked から外しているので、`GCS_BUCKET` 未設定で `npm run dev` しても feed が空になる。ローカルで実データを使いたいときは:

```bash
GCS_BUCKET=basecamp-feeds npm run dev    # 本番と同じく GCS public URL から読む (推奨)
```

ローカルで GitHub Actions スクリプトを試したい場合は `npx tsx scripts/<script>.ts` で直接実行可能（`DISCORD_DRY_RUN=1` を付けると Discord に POST しない）。

## Security / Pre-commit

Gitleaks runs locally as a pre-commit hook + monthly as a GitHub Action across multiple sibling repos.

```bash
pre-commit install   # one-time per clone — installs the gitleaks v8.30.1 hook
```

- Hook config: `.pre-commit-config.yaml` (gitleaks v8.30.1 only)
- Allowlist: `.gitleaks.toml` (リポジトリルート) — false positive 除外用。現在は `ff14-achievement` (platform key 文字列、`HomeFeed.tsx@f4ed640b` で `generic-api-key` ルールに誤検知された) のみ allowlist 済み。新規 false positive を追加するときは `regexTarget = "match"` で `regexes` に文字列パターンを足す
- Monthly audit: `.github/workflows/monthly-secret-audit.yml` — cron `0 0 1 * *` + `workflow_dispatch`, scans **basecamp + odekaketenki + uranai** via gitleaks against full git history. Findings ping Discord. (Annasui は private repo で `GH_PAT` のアクセス権がないため matrix から除外、2026-06-01)

Never use `--no-verify` to skip the hook; if it flags something, rotate the secret instead of suppressing.

## Architecture

### Core Pattern: Server Component + Client Wrapper

Each platform page follows this pattern because functions cannot be passed from Server to Client components:

- **`app/[platform]/page.tsx`** — Server Component with `metadata` export, renders `Sidebar` + `*Client`
- **`app/[platform]/*Client.tsx`** — Client Component (`"use client"`) that manages state, fetches data, and renders feed

The homepage (`app/page.tsx`) is special: a server component that fetches all APIs and passes aggregated data to `HomeFeed` (client component with infinite scroll).

### Three Client Patterns

1. **Standard fetch-from-route** (most platforms): `*Client.tsx` does `fetch('/api/<platform>')` in `useEffect` and passes results to `FeedPosts` which handles state/scroll. `/api/*` は build 時に static JSON 化されているので実態は単なる静的 fetch。
2. **Filter/dashboard pattern** (X): Client は filter tab + DonutChart + `IntersectionObserver` 等のカスタム UI を自前で持つ。`fetch('/api/x')` で取得後ローカル state で filter。
3. **Server-prefiltered prop pattern** (Booklog, Filmarks): Server Component 側で `getXPosts()` を呼んで前処理 (例: `rating === 5` の絞り込み) し、Client には絞り込み後の配列を **props で渡す**。Client は表示のみ。

どのパターンも最終的には `RichFeedCard` → `FeedCard` シェル (`app/components/shared/FeedCard.tsx`) を render する。X だけは `HomeFeed.tsx` の専用分岐で `react-tweet` を直接埋め込む例外。

### Data Flow

```
External APIs/RSS/Scraping → app/lib/feeds/[platform].ts → Server Component (build time)
                                                              ↓
                                       Static HTML in out/ + static /api/* (force-static)
                                                              ↓
                                            Client (*Client.tsx) fetches /api/* at runtime
```

ホームページ (`app/page.tsx`) は build 時に **`app/lib/feeds/*.ts`** から全フィードを直接読み取って HTML に焼き込む。Platform page (`app/[platform]/page.tsx`) も同様に Server Component で `getXPosts()` 等を直接呼ぶ。Client Component (`*Client.tsx`) は `fetch('/api/x')` を打ち続けるが、これは build 時に materialize された **静的 JSON ファイル** (`out/api/x` 等) を引くだけ。

**Feed JSON は GCS bucket `basecamp-feeds` (asia-northeast1, public-read) が source of truth**。書き込みは引き続き GitHub Actions (`scripts/update-*-feed.ts` + `scripts/lib/feed-storage.ts`) が行い、site の build 時には `app/lib/feed-storage.ts` の `readFeedJson` で公開 URL から読む (`GCS_BUCKET` 未設定時は `public/data/` への fs フォールバック)。

### Build-time feed library (`app/lib/feeds/`)

各プラットフォームのデータ取得ロジックは `app/lib/feeds/<platform>.ts` に集約 (17 ファイル):

- **GCS readers** (booklog, diary, duolingo, ff14, ff14-achievements, filmarks, spotify, steam, summaries, swarm, x): `readFeedJson()` で GCS JSON を読み、`Post[]` 形式に整形
- **Live fetchers** (github, hatena, hatenabookmark, note, zenn, tenhou): 各種 RSS / REST API を build 時に叩く

これらは Server Component と route handler の両方から import される。Route handler (`app/api/<platform>/route.ts`) は `force-static` の薄いラッパで `NextResponse.json(await getXPosts())` を返すだけ。Build 時に評価され、出力は `out/api/<platform>` という静的ファイルになる。

**No API route** (standalone pages): soundcloud (embedded iframe player), decks (static `public/data/decks.json` — git tracked)

When adding a new platform with external images, the `images.unoptimized: true` setting means the browser loads originals directly — no `remotePatterns` config needed.

### Layout System

Fixed sidebar + scrollable content (`.split-layout`, `.sidebar`, `.main-content` in `globals.css`). Responsive: stacked on mobile, side-by-side on desktop.

### Type System (`app/lib/types.ts`)

- `BasePost` → platform-specific types (`GitHubPost`, `HatenaPost`, etc.) → `PlatformPost` union
- `Post` — legacy type still used in most code (backward compatible)

## Key Utilities (`app/lib/`)

| File | Purpose |
|---|---|
| `config.ts` | Central config: all platform usernames + profile URLs |
| `types.ts` | `BasePost` → platform-specific types → `PlatformPost` union。多くのコードは legacy な `Post` interface (loose な後方互換型) を使う |
| `fetch-with-timeout.ts` | `fetchWithTimeout()` with AbortController (default 10s) — `feeds/*.ts` の live fetch 用 |
| `feed-storage.ts` | `readFeedJson()` — Build 時に GCS の公開 URL から feed JSON を取得。`GCS_BUCKET` 未設定時は `public/data/` への fs フォールバック (ローカル開発用)。Static export では build 1 回ごとに評価される |
| `feeds/*.ts` | Each platform's data transformation (read GCS / live RSS / live API) → `Post[]`. Imported by both Server Components and route handlers |
| `shared/constants.ts` | Platform colors (`platformColors`) — single source of truth for the platform list |
| `shared/date-utils.ts` | `formatRelativeTime()` — < 24h: relative, >= 24h: absolute (`yyyy-MM-dd HH:mm`) |
| `shared/html-utils.ts` | `stripHtmlTags()`, `extractThumbnailFromContent()` — RSS feed parsing helpers |

その他 `app/lib/` には旧 architecture 由来の orphan ファイル (`api-errors.ts`, `spotify-auth.ts`, `posts.ts`, `formatters.ts`, `jsonld.ts`, `summaries.ts`, `subscriptions.ts`, `api.ts`, `tenhouParser.ts`) が残っている。GitHub Pages 移行で参照が切れたもので、削除候補。

`app/hooks/` の `useMagneticButton.ts` / `useRipple.ts` と `app/components/MagneticButton.tsx` は実装済みだがどのページからも import されていない (試作 → 不採用)。削除候補。

`app/design-mockups/` は本番ナビには載っていないデザイン探索 playground (bento / brutal / category-tabs / dashboard / glass / minimal / split-screen / timeline の 8 案 + 入口 `page.tsx`)。新しいホームレイアウト試作用で feed 系コードからは独立しているので、ここを編集しても本番フィードには影響しない。Sidebar に追加しないこと。

## Critical Patterns

### Static export と build cadence

全ページは `output: 'export'` で build 時に HTML 化される。ISR は使わない。フィード反映は GitHub Actions の `.github/workflows/deploy-pages.yml` が daily cron (JST 09:00 / 21:00) で site rebuild することで実現される。Push to main でも build がトリガーされる。

Route handler (`app/api/*/route.ts`) は `export const dynamic = "force-static"` で、build 時に評価され `out/api/<route>` という静的 JSON ファイルになる。Client Component の `fetch('/api/x')` はこの静的ファイルを引く。

`readFeedJson()` 内の `fetch()` は **`cache` オプションを指定しない**こと (Next.js のデフォルト build-cache に任せる)。`cache: "no-store"` を渡すと `force-static` と矛盾して空配列に化ける罠あり。

### TypeScript: null → undefined Conversion
External APIs return `string | null` but types expect `string | undefined`:
```typescript
language: repo.language ?? undefined,
```

### Image HTTP → HTTPS
```typescript
imgUrl.replace(/^http:/, "https:")
```
Required in all feed lib functions to avoid mixed content errors. `next.config.ts` uses `images.unoptimized: true` (static export requirement), so `<img>` / `next/image` load originals directly — no `remotePatterns` config needed.

### Platform Key vs Display Name
Platform keys (CSS classes, `platformColors`) are lowercase: `hatenabookmark`, `ff14-achievement`. But `*Client.tsx` `source` props use display names: `"Hatena Bookmark"`. Mappings exist in:
- `FeedPosts.tsx` `sourceToKey`: display name → platform key
- `feedCardAdapters.ts` `platformLabels`: platform key → display name (single source of truth for the unified shell)

### Sidebar Platform Lists Must Stay in Sync
- `app/components/Sidebar.tsx` — used on individual platform pages
- `app/components/HomeSidebar.tsx` — used on the homepage

Both sidebars use **category groups** (`platformGroups` array): 開発, ブログ・記事, SNS, 語学・音楽, 読書・映画, 日記, ゲーム. When adding a platform, place it in the correct group in both files.

**Sidebar `activePlatform` matching**: Uses `platform.path.slice(1)` (e.g. `"/diary"` → `"diary"`), NOT `platform.name.toLowerCase()`. Pass the URL path segment (e.g. `activePlatform="diary"`).

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
- Skipped on internal-only pages (`/diary`, `/decks`)

### Adding a New Platform Checklist

**Note**: This checklist applies to **standard feed platforms** (chronological item list). For non-standard cases see the dedicated sections:
- **Catalog-style** (no chronological feed; a curated grid + carousel) → see **Apps** in the GitHub Actions Feeds section. Apps has *no* `/api/apps/route.ts` — it's read via `readFeedJson("apps.json")` on both the home server component and `/apps` server component.
- **External-trigger ingest** (push from third-party service via webhook) → see **Swarm**. The pattern is `repository_dispatch` event_type → workflow → script that appends one item at a time to the static JSON. No periodic cron polling.
- **AI-generated content** → see **Diary** (timestamp pinned to 23:59 JST so it sorts to top of day).

For a standard feed platform:
1. Create `app/lib/feeds/[platform].ts` with a `getXPosts(): Promise<Post[]>` function (transform GCS JSON / live RSS / API to `Post[]`)
2. Create `app/api/[platform]/route.ts` — thin wrapper: `export const dynamic = "force-static"; export async function GET() { return NextResponse.json(await getXPosts()); }`
3. Create `app/[platform]/page.tsx` + `*Client.tsx`
   - Add `<ExternalProfileLink platform="..." platformLabel="..." />` next to the `<h1>` if the platform has an external profile
4. Add platform color to `globals.css` AND `constants.ts`
5. Add to both `Sidebar.tsx` and `HomeSidebar.tsx` (in correct category group)
6. Add the platform key to `feedCardAdapters.ts` (`platformLabels`、必要なら `resolveBadge` / `resolveStatPills` / `portraitPlatforms` / `platformsWithoutDescription`) — `RichFeedCard` は `FeedCard` シェルに直接ディスパッチするので variant ファイルの追加は不要
7. Add `.feed-item-featured.platform-{key}` グラデと `.feed-item.platform-{key}` の resting border-left + hover border を `globals.css` に追加 (light + dark)
8. Add to `config.ts` `profiles` if the platform has an external profile
9. Add to `app/page.tsx` `fetchPosts()`: import the new `getXPosts` and add to Promise.all (do NOT call `/api/*` from Server Component — call lib function directly)
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
Pure SVG (no external library)。`DonutChart` の内側円は dark mode 対応のため `fill="var(--color-background)"` を使う点だけ注意。

### Unified Feed Card Shell (`app/components/shared/`)

`RichFeedCard` は薄いラッパで、`FeedCard` シェル + `feedCardAdapters.ts` の adapter に処理を委譲する:

```
RichFeedCard → adaptPost(post, platform) → <FeedCard {...props} />
```

`FeedCard.tsx` が単一の DOM 構造を生成し、すべての非 X カードが同じ要素順 (header → title → description → stat pills → meta pills) で render される。Platform 差分は adapter (`feedCardAdapters.ts`) に集約:

- `platformLabels` — platform key → 表示名 (Hatena, Booklog, etc.)
- `resolveBadge` — header 内に表示する小チップのラベル + 色 (記事 / 読了 / 1着 / いいね 等)
- `resolveStatPills` — Tenhou の score/room、Duolingo の XP/streak
- `portraitPlatforms` — booklog / filmarks のみ portrait サムネ (80×112)、それ以外は square 80×80
- `platformsWithoutDescription` — booklog / spotify / filmarks / steam (description は meta pill 側で出すので隠す)
- `platformsWithFullDescription` — diary は全文表示 (line-clamp なし)

X (Twitter) は唯一の例外として `HomeFeed.tsx` (lines 338-355) で `react-tweet` 埋め込みをそのまま使う。badge 部分のみ `.feed-item-badge-chip-icon` クラスを共有して同じシステムに乗せている。

Meta pill (GitHub の language/stars、Booklog の rating/status/tags、Filmarks の rating/contentType 等) は `FeedItemMeta.tsx` がそのまま生成し、shell の `metaPills` slot に注入される。

### Apps Carousel (`app/components/AppsCarousel.tsx`)
Horizontal-scroll showcase placed **above** `HomeFeed` on the homepage. **Client Component** with JS-driven auto-advance (3 sec/slide via `setInterval` + `scrollTo({behavior:"smooth"})`). Hidden when `apps.length === 0`. Each card opens the live URL in a new tab; "すべて見る →" links to `/apps`. Source data: `apps.json` on GCS, read via `readFeedJson` in `app/page.tsx`.

**Auto-advance pattern** (multi-app, not spotlight):
- Track renders cards twice (originals + `aria-hidden` clones) so the loop is seamless: when `scrollLeft` reaches `track.scrollWidth / 2`, an `instant` snap-back to the equivalent position in the first half is queued via `requestAnimationFrame`, then the smooth advance continues.
- Round-trip pause: native DOM `mouseenter` / `mouseleave` / `focusin` / `focusout` listeners flip `pausedRef`; interval body bails when `pausedRef.current || reducedMotionRef.current`.
- **React-state vs ref for pause**: `pausedRef` is intentionally a ref, NOT state, so the interval doesn't tear down and rebuild on every pause toggle. Keep the interval's deps to `[isSpotlight, step]` only.
- Prev / next buttons are absolutely positioned at the viewport's left/right edges (`.apps-carousel-edge`), vertically aligned over the thumbnail. The viewport itself is `tabIndex=0` with `onKeyDown` handling ArrowLeft / ArrowRight for keyboard nav.
- `prefers-reduced-motion: reduce` disables auto-advance; manual prev/next still works.

**Card sizing pitfall** (`.app-carousel-card`): Must keep `min-width: 0` alongside `flex: 0 0 280px`. Without `min-width: 0` (the flex-item default `auto` resolves to intrinsic min-content), `.app-carousel-card-desc { white-space: nowrap }` makes longer descriptions stretch the card past its flex-basis, breaking thumbnail height consistency (`aspect-ratio: 1200/630`).

### HomeFeed Features (`app/components/HomeFeed.tsx`)
- **WAI-ARIA Feed Pattern**: `<section role="feed" aria-busy={isLoadingMore}>` 内に `<article aria-posinset={n} aria-setsize={total}>` を並べる。先頭にスキップリンク (`フィードをスキップしてフッタへ`)、`/` キーで検索フォーカス、新規ロード件数を `role="status" aria-live="polite"` で告知
- **Sticky search**: `SearchBar` (`value` prop で controlled) を `.feed-controls` でラップして `position: sticky; top: 0`。検索は client-side `String.includes` (title + description)。~2000 件規模で実測ミリ秒以下
- **URL state persistence**: `?q=...` を `window.history.replaceState()` で 300ms debounce 同期。`useSearchParams` を使わず Suspense 不要。Next の RSC 再フェッチを避けるため `router.replace` ではなく素の History API を叩く
- **Empty / End-of-feed states**: 検索中に該当 0 件で `.feed-empty` (検索クリアボタン付き)、検索中に末尾まで到達で `.feed-end`。検索なしの通常スクロールでは末尾メッセージは出ない (フィードは時系列で常に増えていくため)
- **Date separators**: auto-inserted labels (今日/昨日/月日) between posts from different days
- **TweetConstrained**: wrapper component for X tweets that limits height to 350px with `ResizeObserver`-based overflow detection; adds fade gradient (`::after`) only when content overflows
- **Back-to-top button**: appears after 600px scroll
- **`content-visibility: auto`**: `.feed-item` に適用してオフスクリーンカードの layout/paint をスキップ。~2000 件混在高さでもスクロールが軽い

> ⚠️ プラットフォーム別フィルタチップは削除済み (2026-05-09)。検索一本でいい、というユーザー判断。複数フィルタ・文脈カウント・`?p=` URL state も同時に廃止。

### AppsCarousel Spotlight Mode (`app/components/AppsCarousel.tsx`)
`apps.length === 1` のときは `.apps-carousel-spotlight` クラスを付与し、auto-advance / prev-next / clone duplication / mask フェード / "すべて見る →" リンクを全て無効化。カードの寸法 (280px) と本文スタイルは multi-app と共通 — レイアウト統一のため意図的に **カードを拡大しない**。

### Sidebar Bio Toggle (`app/components/HomeSidebar.tsx`)
`HomeSidebar` は Client Component。`CollapsibleBio` で `useRef` + `ResizeObserver` で `scrollHeight > clientHeight` を判定し、溢れているときだけ「詳しく見る / 閉じる」ボタンを表示。展開時は `WebkitLineClamp: 'unset'` で全文表示。

### Rendering
- **Infinite scroll**: `IntersectionObserver`-based. `HomeFeed` ページネーションは **日単位** (`DAYS_PER_PAGE = 1`) — `getDayKey()` (`app/components/HomeFeed.tsx`) で `filteredPosts` を日付バケットに grouping し、スクロールごとに 1 日分まるごと追加する (日の途中で切れない)。`feed-progress` は「N件 / 全件 · M日目 / 全日」を表示。他は件数単位: `XClient` (10/page), `BooklogClient` (20/page), `FeedPosts` (20/page)
- **react-tweet**: dynamically imported with `ssr: false` to avoid hydration issues. On home feed, wrapped in `TweetConstrained` (max-height 350px). On `/x` page, displayed at full size.

## GitHub Actions Feeds

```
GitHub Actions (every 3h cron) → API fetch → Workload Identity Federation で GCP 認証 → gs://basecamp-feeds/<feed>.json に PUT → daily site rebuild (deploy-pages.yml) で取り込まれて GitHub Pages に反映
```

GHA の各 feed-writer workflow は GCS に書き込むだけ。Site への反映は `.github/workflows/deploy-pages.yml` が JST 09:00 / 21:00 cron で build & deploy することで起きる (= フィード更新が site に反映されるまで最大 ~12h ラグあり)。`scripts/lib/feed-storage.ts` の `writeFeed()` が `@google-cloud/storage` SDK で直接 bucket に書き込む。各 workflow には `permissions: id-token: write` と `google-github-actions/auth@v2` (workload_identity_provider: `projects/130346180231/locations/global/workloadIdentityPools/github-pool/providers/github`、service_account: `gha-feed-writer@basecamp-satory074.iam.gserviceaccount.com`) のステップが入っている。

### X (Twitter)
- **Schedule**: every 3h at :20 (UTC), cron `20 */3 * * *`
- **Script**: `scripts/update-x-feed.ts` → `gs://basecamp-feeds/x-tweets.json`
- **Display**: `react-tweet` embeds with category badges (投稿/リポスト/いいね/ブックマーク). `/x` page has category filter tabs + DonutChart. Shared via `TweetEmbed.tsx`.
- OAuth 2.0 PKCE: refresh token rotates on every use, auto-updated via `gh secret set`
- **Re-authorization** (token broken): run `npx tsx scripts/x-oauth-setup.ts` (requires port 3000 free) → GitHub Actions UI → `Update X Feed` → `Run workflow` → paste token into `new_refresh_token` field
- **`GH_PAT` must have Secrets read/write permission** (Classic PAT: `repo` scope; Fine-grained: `Secrets: Read and write`). Without this, the auto-rotation of `X_REFRESH_TOKEN` fails with HTTP 401.
- **Manual backfill**: `workflow_dispatch` inputs `fetch_pages` (default 2) と `max_results` (1 ページあたり最大 100) を増やせば取りこぼし回収できる。GitHub Actions UI → `Update X Feed` → `Run workflow` で値を入れて起動。
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
- **手動で og:image を作る場合**: 1200×630 PNG を SVG → `sharp` 経由で生成 → repo の `public/og-image.png` に置き、framework の metadata head に配線する (Vite なら `index.html` の `<meta property="og:image" content="https://satory074.github.io/<repo>/og-image.png" />`、Next.js なら `metadata.openGraph.images` + `twitter.card: summary_large_image`)。次回 `update-apps-feed.yml` 実行で自動取り込み。
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
- **CloudFront 地理キャッシュの罠**: Booklog は CloudFront の背後にあり、PoP (geographic edge) ごとに別キャッシュを返す。Osaka PoP (国内開発機) は `display=image` の全 27 ページを返すが、GitHub Actions ランナー (US PoP) はページ 6 で空応答になり 120 冊で打ち止め。`Cache-Control: no-cache` / Pragma / `PHPSESSID` cookie / クエリのキャッシュバスターを送る対策はコードに入っているが effective ではなく、origin 側で IP 別に応答が違う模様。
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
- Reads feed JSON from GCS → Gemini API → 100-150 char Japanese bio. Model: `gemini-2.5-flash-lite` (`GEMINI_MODEL` env で上書き可)。**注**: `gemini-2.0-flash-lite` は 2026-06-01 に shutdown され 404 を返す。`gemini-pro` も同様に廃止済み。Google の Gemini モデル lifecycle は速いので、deprecation ページ (https://ai.google.dev/gemini-api/docs/deprecations) を時々確認すること
- GitHub Secrets: `GEMINI_API_KEY`, `DISCORD_WEBHOOK_URL`

### Apple Health (削除済み)

Apple Health 連携は GitHub Pages 移行 (2026-05-18) で削除済み。`gs://basecamp-feeds/applehealth-feed.json` は GCS に残存しているがどこからも参照されていない。旧仕様は `git log -- app/api/applehealth/` で復元可能。

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

サイト build 時に必要なもの (`.github/workflows/deploy-pages.yml` で渡している):

```bash
GCS_BUCKET=basecamp-feeds     # Feed JSON bucket。未設定時は public/data/ への fs フォールバック (ローカル開発用)
NEXT_PUBLIC_BASE_URL=...      # Site URL (本番では https://satory074.com)
GITHUB_TOKEN=...              # GitHub API rate-limit 緩和用 (GHA は ${{ secrets.GITHUB_TOKEN }} で自動付与)
```

GHA feed-writer scripts (`scripts/update-*-feed.ts`) で必要なもの:

```bash
GEMINI_API_KEY=...            # AI summary / diary / bio generation

SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
SPOTIFY_REFRESH_TOKEN=...

STEAM_API_KEY=...
STEAM_USER_ID=...

X_CLIENT_ID=... / X_CLIENT_SECRET=... / X_REFRESH_TOKEN=... / X_USER_ID=...   # OAuth 一式 (`X_REFRESH_TOKEN` は使用ごとにローテートし script が自動更新)
GH_PAT=...                                                                    # X_REFRESH_TOKEN の自動更新用 (Secrets R/W 権限必要、詳細: docs/oauth-setup.md)

DISCORD_WEBHOOK_URL=...        # GitHub Actions notifications

SWARM_BLOCKED_VENUES_LOCAL=... # Swarm blocklist の local master (JSON 配列、.env.local のみ)
                               # `scripts/swarm-blocklist.ts` で更新 → `SWARM_BLOCKED_VENUES` Secret に sync
```

GitHub Pages 移行で **以下は不要**になった:
- `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY` (Naita 廃止)
- `NAITA_SECRET` (Naita 廃止)
- `HEALTHKIT_INGEST_SECRET` (Apple Health 廃止)

## Deployment

- **Hosting**: GitHub Pages (Fastly CDN), 静的サイト
- **Build/Deploy**: `.github/workflows/deploy-pages.yml` — push to main + daily cron (JST 09:00 / 21:00) + manual `workflow_dispatch`
- **Domain**: satory074.com (apex) + www.satory074.com → GitHub Pages 自動 Let's Encrypt
- **DNS**: Route 53 hosted zone `Z0716810FXBCKCNXIT0Q`、A レコード 4 本 (`185.199.108-111.153`) + AAAA レコード 4 本 (`2606:50c0:8000-8003::153`)
- **CNAME**: `public/CNAME` ファイルに `satory074.com`
- **Always run `npm run build` locally before pushing**

### デプロイ後の検証

GitHub Pages はデフォルトで `Cache-Control: max-age=600` を返す。CDN は request の `no-cache` を honor しないので、cache-bust には **URL クエリパラメータ** を変えるのが確実:

```bash
# 直接 GitHub Pages origin を叩く (キャッシュ回避)
curl -sf "https://satory074.com/?cb=$RANDOM$RANDOM" | grep -oE 'feed-item-[a-z-]+' | sort -u

# HTTPS 証明書 (Let's Encrypt)
echo | openssl s_client -servername satory074.com -connect satory074.com:443 2>/dev/null | openssl x509 -noout -issuer

# DNS が GitHub Pages を指しているか
dig satory074.com +short    # → 185.199.10[8-11].153 のいずれか
```

GitHub Actions の build status は `gh run list --workflow=deploy-pages.yml --limit=5` で確認。

### GCP インフラ (feed-writer 用、引き続き残す)

- **GCS bucket** `basecamp-feeds` (asia-northeast1, public-read, default Cache-Control: `public, max-age=300, stale-while-revalidate=3600`) — フィード JSON & 増分キャッシュ & apps の og:image (`images/apps/*.jpg`)
- **Workload Identity Federation** for GitHub Actions feed-writers:
  - Pool/provider: `projects/130346180231/locations/global/workloadIdentityPools/github-pool/providers/github`
  - Service account: `gha-feed-writer@basecamp-satory074.iam.gserviceaccount.com` (`roles/storage.objectAdmin` on bucket)
  - Repo restriction: `repository_owner == 'satory074'` + `repo == 'satory074/basecamp'`
- **コスト**: GitHub Pages 無料 + GCS 月 \< $0.01 ≈ **ほぼ無料**

### ロールバック

問題があれば前 commit に revert して main に push すれば再 build & deploy が走る。あるいは `gh workflow run deploy-pages.yml` で手動再デプロイ。

## Summaries Feature

AI-generated summaries on `gs://basecamp-feeds/summaries.json`. Generated via `npm run generate-summaries` (requires `GEMINI_API_KEY`). Model: `gemini-2.5-flash-lite` (`GEMINI_MODEL` env で上書き可)。When adding a platform: update `lib/types.ts` `Post.platform`, `lib/formatters.ts` `convertUrlToCustomSchema`, and `generate-summaries.js` `fetchPosts`.

## Auxiliary Scripts (non-scheduled)

- `scripts/x-oauth-setup.ts` — X 初回 OAuth 2.0 PKCE 認可フロー (port 3000 必須)。`X_REFRESH_TOKEN` が失効したとき実行
- `scripts/spotify-oauth-setup.ts` — Spotify 初回 OAuth 認可フロー。`SPOTIFY_REFRESH_TOKEN` をセットアップ／再発行するとき実行 (Spotify はリフレッシュトークンが回らないので通常は一度きり)
- `scripts/swarm-blocklist.ts` — Swarm checkin の blocklist 管理 CLI (`list|add|sync|redact`)
- `scripts/generate-favicon.ts` — ファビコン/アイコン再生成
- `generate-summaries.js` — ルート直下の `.js`（他スクリプトは `.ts`）、`npm run generate-summaries` から呼ばれる

## Detailed Implementation Docs (`docs/`)

細かい実装ガイドは `docs/` にあり、CLAUDE.md のサマリより深い情報を持つ:
- `oauth-setup.md` — X/Spotify OAuth セットアップ手順
- `tenhou-integration.md`, `tenhou-automation.md`, `tenhou-realtime-guide.md` — Tenhou 関連
- `SUMMARIES.md` — Summaries 機能の詳細

**陳腐化済み (削除候補)**:
- `microblog-setup.md`, `microblog-best-practices.md`, `troubleshooting-microblog.md` — Naita (Supabase) — 廃止済み (2026-05-18)
- `supabase-user-setup.md` — Naita 廃止で陳腐化
- `index.md`, `README.md`, `API.md`, `COMPONENTS.md`, `CUSTOMIZATION.md` — 旧 architecture (Firebase App Hosting / Supabase / Naita 前提) で書かれた初期ドキュメント。CLAUDE.md を正とする

**Note**: ルートの `README.md` は古い (Firebase App Hosting / Supabase / Naita 等まだ生きている前提で書かれている)。CLAUDE.md を正とする。`package.json` の実 scripts は `dev` / `build` / `start` / `lint` / `generate-summaries` のみ。

`docs/` の `microblog-*.md`, `supabase-user-setup.md` も 2026-05-18 の Naita 廃止で陳腐化済み (削除候補)。
