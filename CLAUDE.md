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

各プラットフォームのデータ取得ロジックは `app/lib/feeds/<platform>.ts` に集約 (18 ファイル):

- **GCS readers** (booklog, diary, duolingo, ff14, ff14-achievements, filmarks, playstation, spotify, steam, summaries, swarm, x): `readFeedJson()` で GCS JSON を読み、`Post[]` 形式に整形
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

Both sidebars use **category groups** (`platformGroups` array): 開発, ブログ・記事, SNS, 語学・音楽, 読書・映画, 日記 (日記 + 飲酒記録), 場所, ゲーム, スポーツ (野球), 作品. When adding a platform, place it in the correct group in both files. ゲーム は本人が*プレイ*するもの、スポーツ は*観戦*するもの、という切り分け。

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
- **Reference / state page** (chronological feed が存在せず、外部の「今の状態」を見せるだけ) → see **NPB**. API route は作らず、Server Component 1 枚 + 表で完結させる。順位表 (状態) はホームフィードに流さない。試合結果だけは `getNpbPosts()` (`buildNpbDayPosts`) で **1 試合日 = 1 カード** に丸めて流す (試合単位では流さない)。
- **External-trigger ingest** (push from third-party service via webhook) → see **Swarm**. The pattern is `repository_dispatch` event_type → workflow → script that appends one item at a time to the static JSON. No periodic cron polling.
- **AI-generated content** → see **Diary** (計算した事実だけを LLM に渡す。timestamp は 23:59 JST 固定でその日の先頭に並ぶ)。
- **端末ローカルのデータを外部アプリから push** → see **alco-diary**。ポーリング元になるサーバが無いので、アプリ側の明示操作 → `repository_dispatch` → **dayKey 単位の upsert** で取り込む。

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
9. Add to `app/page.tsx` `fetchPosts()`: import the new `getXPosts`, add to the destructured array + `Promise.all` (`settled(...)`), add the merge spread (`...x.map((p) => ({ ...p, platform: "x" }))`), and add a `platformDisplayNames` entry. Do NOT call `/api/*` from the Server Component — call the lib function directly
10. Add to `ProfileLinks.tsx` `links` array if the platform has an external profile (appears in home sidebar)
11. **GHA writer script を持つ activity feed の場合** (Steam / PlayStation / Spotify など、書き込みを定期実行する系): `scripts/send-daily-digest.ts` の `FEEDS` 配列にもエントリを追加し、stale 検知の対象にする (NPSSO 失効・トークン切れ・workflow 停止を Daily Digest の "⚠️ Stale feeds" が拾えるように)
12. **本人の活動を表す feed の場合**: `scripts/lib/diary/collect.ts` に collector、`facts.ts` に検出器 (first / milestone / creation / … の文と stat ピル) を足し、`app/lib/diary-types.ts` の `DiaryFacts` に型を追加する。これをしないとデイリーログ (日記) にその活動が出ない

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
- `platformsWithFullDescription` — diary / baseball は全文表示 (line-clamp なし)。baseball は description が `\n` 区切りの複数行なので `globals.css` で `.feed-item.platform-baseball .feed-item-description { white-space: pre-line }` を併用
- `dateOnlyPlatforms` — swarm / baseball は時刻を伏せて日付だけ表示 (Swarm はチェックイン時刻を公開しない、野球は 22:00 JST の代表時刻でしかない)

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
- **Manual backfill**: `workflow_dispatch` inputs `fetch_pages` (default 2) と `max_results` (1 ページあたり最大 100) を増やせば取りこぼし回収できる。GitHub Actions UI → `Update X Feed` → `Run workflow` で値を入れて起動。CLI なら `gh workflow run update-x-feed.yml -R satory074/basecamp -f fetch_pages=5 -f fetch_max_results=100`。
- **クレジット枯渇 (HTTP 402 `CreditsDepleted`)**: X API の月間読み取りクレジットには上限があり、現行 cadence (60 read/run × 8 run/日 ≈ 14,400 read/月) は上限ギリギリで**毎月使い切るとほぼ確実に枯渇する**。枯渇すると全エンドポイントが 402 を返し取得が止まる(2026‑06‑18 に発生 → feed が 6/17 で凍結した事例あり)。`update-x-feed.ts` は枯渇を検知すると **Discord に status:error の明確なアラートを送り、`process.exitCode = 1` で run を赤くする**(旧実装は 402 を `break` で握り潰して緑のまま埋もれていた)。**復旧はクレジットがリセットされてからのみ可能** — リセット後に上記 backfill で空白を回収する(通常 run でも dedup で新着は自動再開)。枯渇が頻発するなら cron を 6h ごとに落とすか既定ページ数を減らして read 量を抑える。
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

### PlayStation (Trophies)
- **Schedule**: every 3h at :10 (UTC), cron `10 */3 * * *`
- **Script**: `scripts/update-playstation-feed.ts` → `gs://basecamp-feeds/playstation-trophies.json`
- 非公式の **`psn-api`** ライブラリを使用。Sony は公開 trophy API も安定した API キーも提供していないため、ブラウザから取得する **NPSSO トークン** で認証する（X の OAuth と同じく壊れやすい系統）
- `getUserTitles("me")`（最近トロフィー獲得したタイトル順）→ 上位 15 タイトルについて `getTitleTrophies`（名前/アイコン/種別）+ `getUserTrophiesEarnedForTitle`（獲得日/レア度）を `trophyId` でマージ → `earned` のみ → `playstation-${npCommunicationId}-${trophyId}` で dedup。トロフィー1個 = フィード1件（Steam 実績と同様）
- カード: trophyName=title、gameName=description（表示）、trophyType（bronze/silver/gold/platinum）= `post.category` → 段位色バッジ（`feedCardAdapters.ts` の `trophyTypeBadges`）。`/playstation` ダッシュボードは総トロフィー数 / ゲーム数 / プラチナ数 + ゲーム別 Top10
- 外部プロフィールは PSNProfiles（Sony に公開プロフィールページが無いため）。`config.ts` `profiles.playstation.username` が PSNProfiles のスラッグ（`satory074`）
- **NPSSO は ~2 ヶ月で失効**する。失効すると `exchangeNpssoForAccessCode` が throw → fatal catch が Discord にエラー通知 + Daily Digest の "⚠️ Stale feeds" に出る。**再認可手順**: playstation.com にログインした状態で <https://ca.account.sony.com/api/v1/ssocookie> を開き JSON の 64 文字 `npsso` をコピー → `gh secret set PSN_NPSSO -R satory074/basecamp` → 必要なら GitHub Actions UI → `Update PlayStation Feed` → `Run workflow`
- GitHub Secrets: `PSN_NPSSO`, `DISCORD_WEBHOOK_URL`

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
- **逆リンクバー必須**: featured-app にするアプリには satory074.com/apps へ戻る固定バックリンクバーを設置する。正準スニペット・仕様・チェックリストは `docs/app-backlink.md`（全アプリ `app-backlink-bar` クラス付きで横断 grep 可能。2026-08 に全 8 アプリ統一済み）
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
- **Script**: `scripts/append-swarm-checkin.ts` — payload を読み、blocklist 照合、座標丸め、時刻丸め、`gs://basecamp-feeds/swarm-checkins.json` に append
- **Why IFTTT (重要・同じ罠を避けるため)**: Foursquare v2 API は 2021-11-18 以降に登録した開発者アカウントには非公開（"If you added Foursquare after 11/18/21, you automatically have access to the new version (v3) of the API."）。v3 (Places API) には自分のチェックイン取得手段がない。新コンソール (`foursquare.com/developer/`) で発行した Client ID は `/oauth2/authenticate` で `Value ... is invalid for consumer key` エラーになる。**ユーザー自身のチェックイン履歴へのプログラマティックアクセス手段は新規開発者にはもう存在しない**ので、IFTTT (grandfathered) を経由している
- **IFTTT トリガーフィールドは限定的**: `Shout` / `VenueName` / `VenueUrl`（venue ページ URL、checkin permalink ではない）/ `VenueMapImageUrl` / `CheckinDate` の 5 つのみ。`VenueLat` / `VenueLng` / `VenueAddress` / `VenueCategory` は提供されない。座標は `VenueMapImageUrl`（IFTTT 独自形式 `?lat=NUM&lng=NUM`）から正規表現で抽出。id は `SHA-1(venueName + 丸め後の日付)` で生成（VenueUrl は同じ venue で再訪すると重複するため使えない。時刻をハッシュ入力に含めると総当たりで時刻が復元できるので含めない）
- **遅延**: IFTTT polling (Free 1h, Pro 5min) + Actions (~30s) + GCS write 即時 + ISR 5min 窓 ≈ ~1h（事実上のプライバシー遅延）
- **プライバシーフィルタ（実装済み）**:
    - **時刻丸め**: チェックイン時刻は公開しない。`toCoarseDate()` が **JST 暦日に丸め、その日の 12:00 JST (= 03:00 UTC) に固定**して保存する。公開 JSON にも id にも正確な時刻は残らない（表示側も `feedCardAdapters.ts` の `dateOnlyPlatforms` で日付のみ表示にしている。フィード内の並び位置からの推測も、同日エントリが全て同時刻になることで潰れる）。同一 venue・同一日で id が衝突したら連番サフィックス (`-2`) を付けて**両方残す**（同じ payload の再送は重複エントリになる → `swarm-blocklist.ts redact` で削除）
    - 既存エントリは書き込みのたびに `normalizeExisting()` が丸め直す（冪等）。GCS 上のデータを一括で丸め直したいときは `gh workflow run swarm-checkin.yml -R satory074/basecamp -f migrate_only=true`（= `SWARM_MIGRATE_ONLY=1`、payload なしで正規化のみ実行）
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

### alco-diary (飲酒記録)
- **Trigger**: alco-diary (Vercel, `https://alco-diary.vercel.app`) の設定画面で「公開」→ `POST /api/publish` → GitHub `repository_dispatch` (event_type: `alco-diary-sync`)
- **Workflow**: `.github/workflows/alco-diary-sync.yml` (`on: repository_dispatch + workflow_dispatch`)
- **Script**: `scripts/append-alco-entries.ts` → `gs://basecamp-feeds/alco-drinks.json`
- **Why push (重要)**: alco-diary のデータは端末の IndexedDB (Dexie) にしか無く、サーバ側に実体が無い。
  cron でポーリングする対象が存在しないので Swarm と同じ push 型にしている。GitHub の PAT は
  alco-diary 側 (Vercel env `BASECAMP_DISPATCH_TOKEN`) に置き、ブラウザには共有キー (`PUBLISH_KEY`) しか渡さない
- **dayKey 単位の upsert (append ではない)**: payload に含まれる `dayKey` は既存レコードを丸ごと差し替える。
  `items: []` は「その日は記録なし(休肝日)」の意味。**追記だけにすると、アプリ側で消した記録が
  satory074.com に残り続ける**ため、必ず日単位の全置換にすること。アプリは毎回直近14日分を送るので
  過去の修正・削除もそのとき反映される
- **自動送信**: alco-diary 側は記録の追加・編集・削除のたびに自動で送る (`lib/record.ts` の
  `addEntries` / `updateEntry` / `removeEntries` でフック)。payload に `auto: true` が付いており、
  **その場合は Discord 通知しない** (1杯ごとに鳴らないように)。エラー通知は auto でも送る
- **時刻は公開する** (2026-08 に方針変更): 各アイテムが `at` (ISO 8601) を持ち、`app/lib/feeds/alco.ts` が
  `Post.date` にそのまま使う。`feedCardAdapters.ts` の `dateOnlyPlatforms` に `alco` は**入れない**。
  `at` を持たない旧アイテムは `day.date` (dayKey の 12:00 JST) にフォールバックする
    - ⚠️ **深夜の記録はホームフィードの日付グループが `dayKey` とズレる**。alco-diary は朝4時を日境界に
      しているので 0:00〜3:59 の1杯は前日の `dayKey` に入るが、ホームフィードは `date` で日付バケットを
      作るため翌日側に出る。`/alco` の休肝日・週次集計は `dayKey` ベースなので影響しない
    - id は alco-diary 側で `sha1(dayKey|at|銘柄|容量|度数)` の先頭12桁として生成する
- **公開しないもの**: **金額 (`price`)・商品画像 (`imageUrl`)・バーコードは payload に載らない**。
  除外リストは alco-diary の `lib/publish.ts` (`PublishItem`) が single source of truth
- `/alco` ページは `metadata.robots = { index: false }`
- **保持期間**: 直近 400 日。超過分は切り捨てて件数をログに出す
- **Discord 通知**: 件数のみ (銘柄名は載せない)
- **手動テスト**: `gh workflow run alco-diary-sync.yml -R satory074/basecamp -f payload='{...}'`。
  ローカルなら `GCS_BUCKET= DISCORD_DRY_RUN=1 ALCO_PAYLOAD='{...}' npx tsx scripts/append-alco-entries.ts`
- **stale 検知の対象外**: push 駆動で更新間隔が不定なため `send-daily-digest.ts` の `FEEDS` には入れない (Swarm と同じ)
- GitHub Secrets: `DISCORD_WEBHOOK_URL` のみ (受け口側に専用シークレットは不要)

### NPB (プロ野球 順位表・全試合結果)
- **Schedule**: JST 08:30 / 20:30 (cron `30 23 * * *` と `30 11 * * *`)。`deploy-pages.yml` の cron 直前に置いてある
- **Script**: `scripts/update-npb-feed.ts` → `gs://basecamp-feeds/npb-standings.json` + `gs://basecamp-feeds/npb-games.json`
- **ページ**: `/baseball` (順位表 + 直近3日の結果 + 月別ナビ) と `/baseball/[month]` (その月の全試合、`generateStaticParams` で 3〜10 月を静的生成)。月別ページの各日 `<section>` は `id="day-YYYY-MM-DD"` を持ち、ホームフィードのカードから `/baseball/MM/#day-YYYY-MM-DD` でリンクされる
- **Server Component のみ**。`/api/baseball` route は作っていない (Client fetch しないため)
- **ホームフィードには 1 試合日 = 1 カード** (`getNpbPosts()` → `buildNpbDayPosts()`、platform key は既存の `baseball`)。試合単位だと年 860 件でフィードを飲み込むので日単位に丸める。順位表は「状態」なので流さない
    - カード化するのは **final を 1 つ以上含み、scheduled が残っていない日** (= 結果が出揃った日) のみ。20:30 JST スクレイプ時点ではナイターが scheduled のままなので、その日のカードは 21:00 build には出ず翌 09:00 build で出る (日記と同じタイミング)。`(予備日)` 行は行にしない
    - `id` は `npb-day-<date>`、`date` は `<date>T22:00:00+09:00` 固定 (bare `YYYY-MM-DD` は UTC 深夜扱いになり `HomeFeed.getDayKey()` で TZ により前日にバケットされる。13:00 UTC なら build と JST クライアントで一致)。表示は `dateOnlyPlatforms` で時刻を伏せる
    - 1 行 = 1 試合 `阪神 3 - 1 巨人（甲子園）` / `ロッテ 中止 楽天（ZOZOマリン）` を `\n` で join。球場名の `神 宮` `横 浜` の内側スペースは検索一致のため除去する
    - `url` は末尾スラッシュ付き `/baseball/MM/#day-<date>` (`trailingSlash: true` + `FeedCard` が素の `<a>` なので GitHub Pages の 301 を避ける)
- **データ元**:
    - 順位表 `https://npb.jp/bis/<year>/stats/std_c.html` / `std_p.html`。1 ページに `table.tablefix2` が 2 つ (0=チーム勝敗表, 1=交流戦チーム勝敗表)。**順位列は存在せず行順が順位**。`***`=自チーム, `--`=首位のゲーム差, `27-25<BR>(1)` の `(1)` が引分数 (`<BR>` は大文字)
    - 試合結果 `https://npb.jp/games/<year>/schedule_MM_detail.html` (03〜11)。全 `<tr>` が `id="dateMMDD"` を持つので rowspan 追跡は不要。**`team1` = ホーム(主催)、`team2` = ビジター** (2026年8月の全 86 件で本拠地と一致、反例 0)
- **`<td class="match">` は 3 形態のみ**: `a > score1/state/score2` = final、`a > div.cancel` = cancelled、`<a>` 無し = scheduled。`div.state` は本文表では常に `-`、`div.comment` は常に空なのでステータス判定に使わない。`div.cancel` のテキストは `中止` / `ノーゲーム` / `(予備日)` の 3 種で意味が違うので `note` にそのまま保持する
- **除外される行** (warning ではなく正常): 移動日 (4セルとも `&nbsp;`)、ポストシーズン枠 (`div.commentLong` の「日本シリーズ」)、オールスター (team1/team2 が `セ・リーグ`/`パ・リーグ`)。11 月は公式戦 0 件なので月ナビにも出さない
- **インクリメンタル**: 確定した過去月は不変。通常 run は当月+前月の 2 ページだけ取得し、残りは既存 JSON から引き継ぐ。全月取り直しは `gh workflow run update-npb-feed.yml -R satory074/basecamp -f full_rescrape=true`
- **`recentGames()` の罠**: 9〜10 月に `(予備日)` の cancelled 行が置かれており日付が 8 月の実試合より新しい。「直近」は必ず **final を含む日**を基準に選ぶこと (`app/lib/feeds/npb.ts`)
- **チーム名は 4 系統**: 正式名 (順位表) / 略称 (日程表) / 対○ の 1 文字 (対戦成績列) / URL コード。`app/lib/npb-teams.ts` の `resolveTeam()` がすべてを 1 つの `NpbTeamId` に解決する single source of truth
- **オフシーズン**: 順位表が空なら既存データを保持して `lastUpdated` だけ更新する。これにより `send-daily-digest.ts` の stale 検知 (24h) が冬に誤爆しない
- **ローカル実行**: `GCS_BUCKET= DISCORD_DRY_RUN=1 npx tsx scripts/update-npb-feed.ts`。`TARGET_SEASON=2025` で年を上書き、`NPB_FULL_RESCRAPE=1` で全月取得
- ⚠️ **`generateStaticParams()` が空配列を返すと `output: export` はサイト全体のビルドが落ちる** (`Page "/baseball/[month]" is missing "generateStaticParams()"`)。GCS にフィードがまだ無い状態 (新シーズン初回・バケット障害) で実際に踏んだ。空のときは `SEASON_MONTHS` を返して空ページを出す。ローカルは `public/data/*.json` があると再現しないので、**`public/data/npb-*.json` を退避してビルドする**のが再現手順
- GitHub Secrets: `DISCORD_WEBHOOK_URL` のみ

### Diary (デイリーログ v2)
- **Schedule**: daily 00:55 JST (15:55 UTC), cron `55 15 * * *`。**前日分**を生成する (スクリプトは JST 0〜4 時の実行を前日扱いにする)。15:xx UTC の feed-writer (X :20 / Duolingo :25 / Steam :30 / Spotify :35 / Booklog :40 / Filmarks :45) が全部終わってから走るので、当日 21:30〜24:00 JST の活動を取りこぼさない。反映は 09:00 JST の site rebuild
- **Script**: `scripts/update-diary-feed.ts` → `gs://basecamp-feeds/diary-feed.json`。実体は `scripts/lib/diary/` の 4 ファイル:
    - `day.ts` — 対象ウィンドウは **JST 暦日 [00:00, 24:00)** (旧実装の「now − 24h」ローリングは廃止)。`resolveTargetDayKey()` / `parseJpDate()`
    - `collect.ts` — 13 ソースから対象日の数値を集めて `DiaryFacts` にする。GCS 系は `readFeed` で JSON を読み**同じ JSON の履歴**から 28 日平均・90 日最大・「初めて」を計算。live 系は GitHub events + commits API、Zenn/Hatena/note RSS (`app/lib/feeds/*` を import)、天鳳 nodocchi。ソースごとに try/catch し、落ちたソースは「記録なし」扱いで続行
    - `facts.ts` — `DiaryFacts` → ハイライト候補 (`kind`: `first` 100 > `milestone` 90 > `creation` 80 > `record` 70 > `delta` 60 > `routine` 10) と stat ピル。消費系の first (初めて聴いたアーティスト / 初チェックイン) は 75、自分の X 投稿は 50 に下げてある
    - `compose.ts` — 上位 5 件を選抜、Gemini 用の事実テキスト、プロンプト、**grounding チェック**、テンプレ見出し
- **Gemini の役割は見出し 1 行 + 導入 1〜2 文だけ** (`gemini-2.5-flash`, temperature 0.2, JSON mode)。材料は `buildFactsText()` が作る事実テキストのみ。出力に事実に無い「」引用・数値・カタカナ/ラテン語トークン、または禁止表現 (疑問文・賞賛・推測・二人称・絵文字・です/ます) が混ざると `checkGrounding()` が落として `templateHeadline()` (上位 2 件の連結) にフォールバック → `ledeSource: "template"`。**Gemini が死んでもエントリは必ず出る**
- **載せないもの**: X のいいね / ブックマーク本文 (件数だけ)、コミットメッセージ、チェックイン時刻・座標、野球・はてブ (他人のコンテンツ)。Booklog / Filmarks の自動シェア投稿 (`#ブクログ` 等) は読了ハイライトと二重なので X 投稿から除外
- **空の日**: ハイライト 0 件なら `empty: true` の最小エントリ (`headline: "記録なし"`, `content: ""`, 継続ピルのみ)。Gemini は呼ばない
- **JSON v2** (`app/lib/diary-types.ts` の `DiaryEntry`): `title` = headline、`content` = 導入 + 「icon text」の箇条書き (`\n` 区切り) で v1 と同じ読み方ができる。加えて `version: 2`, `highlights[]`, `stats[]`, `thumbnail` (最上位ハイライトの表紙/アイコン), `facts` (ソース別の生メトリクス、週次ロールアップ用に保存するだけで表示しない)。2026-01〜08 の **v1 エントリ (`version` なし) はそのまま残してある**
- **表示**: `app/lib/feeds/diary.ts` が v2 を `url: "/diary/"`, `category: "day" | "empty"`, `data.stats` 付きの `Post` にする。`feedCardAdapters.ts` の `resolveStatPills` が `data.stats` を stat ピルに、`globals.css` で `.platform-diary .feed-item-description { white-space: pre-line }` (野球と同じ)。カードは単一 `<a>` なのでハイライト個別リンクは未表示 (`highlights[].url` に保存はしている)
- **Booklog の読了判定は `finishedDate`** (「2026年8月13日」) で行う。`date` は棚追加日で読了時に動かない
- **GitHub**: public events API の `PushEvent.payload` には commit 数が入らない (`before/head/push_id/ref/repository_id` のみ) ので、当日 push した repo ごとに `/repos/<repo>/commits?author&since&until&sha=<branch>` で数える。公開 repo のみ・90 日分。`GITHUB_TOKEN` 必須 (無いと 60 req/h)
- **バックフィル**: `gh workflow run update-diary-feed.yml -R satory074/basecamp -f target_date=YYYY-MM-DD -f regenerate=true`。`regenerate` (= `DIARY_FORCE=1`) が無いと既存 v2 はスキップ (v1 は無条件で置換)。workflow は `concurrency: diary-feed` で直列化されるので連続 dispatch してよい。Spotify のベースラインに 28 日、GitHub events に 90 日の履歴上限があるので遡るのはその範囲まで
- **ローカル確認**: `public/data/*.json` に GCS の JSON を落としてから `GCS_BUCKET= DISCORD_DRY_RUN=1 DIARY_NO_LLM=1 DIARY_DRY_RUN=1 DIARY_FORCE=1 TARGET_DATE=2026-08-28 GITHUB_TOKEN=$(gh auth token) npx tsx scripts/update-diary-feed.ts` (`DIARY_DRY_RUN` は書き込まず entry JSON を stdout に出す、`DIARY_NO_LLM` はテンプレ見出し)
- GitHub Secrets: `GEMINI_API_KEY`, `DISCORD_WEBHOOK_URL` (+ 自動付与の `GITHUB_TOKEN`)

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
- 当日分の活動を集約し、1通の Discord embed で送信 (Diary は翌 00:55 JST に別途走る)
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

PSN_NPSSO=...                  # PlayStation トロフィー取得用の NPSSO トークン (~2ヶ月で失効、ブラウザから取り直し)

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
- `app-backlink.md` — 掲載アプリ共通のバックリンクバー正準仕様（featured-app 化するアプリに必須）
- `tenhou-integration.md`, `tenhou-automation.md`, `tenhou-realtime-guide.md` — Tenhou 関連
- `SUMMARIES.md` — Summaries 機能の詳細

**陳腐化済み (削除候補)**:
- `microblog-setup.md`, `microblog-best-practices.md`, `troubleshooting-microblog.md` — Naita (Supabase) — 廃止済み (2026-05-18)
- `supabase-user-setup.md` — Naita 廃止で陳腐化
- `index.md`, `README.md`, `API.md`, `COMPONENTS.md`, `CUSTOMIZATION.md` — 旧 architecture (Firebase App Hosting / Supabase / Naita 前提) で書かれた初期ドキュメント。CLAUDE.md を正とする

**Note**: ルートの `README.md` は古い (Firebase App Hosting / Supabase / Naita 等まだ生きている前提で書かれている)。CLAUDE.md を正とする。`package.json` の実 scripts は `dev` / `build` / `start` / `lint` / `generate-summaries` のみ。

`docs/` の `microblog-*.md`, `supabase-user-setup.md` も 2026-05-18 の Naita 廃止で陳腐化済み (削除候補)。
