# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Basecamp is a personal homepage that aggregates content from multiple platforms (the list lives in `app/lib/platforms.ts`) into a unified feed, plus an `/apps` catalog (works row on home + searchable grid). Built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v3. **Static-exported** (`output: 'export'`) and hosted on **GitHub Pages** (Fastly CDN, auto-deploys via GitHub Actions on push to main + daily cron rebuild for feed refresh).

UI は 2026-11 に全面刷新した (ブランチ `redesign/ui-ux`、B 案「活動の帯」)。全ページ共通の 1 行ヘッダー + 中央 1 カラム。ホームは日ごとのセクション (日付の大きな数字 + その日の件数比を色で並べた帯) で、同じプラットフォームの連続は畳む。

**Live site**: satory074.com (apex + www, Let's Encrypt 経由で GitHub Pages が自動発行)

> ⚠️ ルートの `README.md` は古い。**この CLAUDE.md を正とする** (詳細は末尾の Note 参照)。

## Development Commands

```bash
npm run dev      # Dev server with Turbopack (localhost:3000)
npm run build    # Production build (uses --webpack, NOT Turbopack)
npm run lint     # ESLint 9 flat config (app/ directory)
npm test         # TZ=UTC tsx --test (swarm checkin + app/lib/feed/collapse の不変条件)
npm run start    # Start production server
```

テストは件数を増やさず、壊れたら困る不変条件だけを置く (例: `collapse.test.ts` = 畳んでも投稿が消えず順番も変わらない / 日付の区切りは実行環境の TZ ではなく JST)。TypeScript の検証は `npm run build` (または `npx tsc --noEmit`)。

- **本番と同じ条件で確かめるときは `TZ=UTC GCS_BUCKET=basecamp-feeds npm run build` → `python3 -m http.server 3100 -d out`**。deploy-pages.yml のビルドは UTC で走る。日付・時刻をビルド時に文字にすると、JST のブラウザでの再描画と食い違ってハイドレーションエラー (#418) になる
- **ローカルのビルドが古いデータを使うことがある**: `readFeedJson` の fetch は Next の build cache に乗るので、`.next/cache/fetch-cache` に古い JSON が残る (2026-11 に FF14 実績が 1 件しか出ない古いデータで再現)。本番と数字が合わないときは `rm -rf .next/cache/fetch-cache`
- `npm run dev` (Turbopack) は CSS を lightningcss で変換する。`light-dark()` は OS の明暗設定にしか従わない形に書き換えられるので、トークンは `prefers-color-scheme` のメディアクエリで切り替えている (本番の webpack ビルドは書き換えない)

**Port 3000 が他プロジェクト (例: tenhoulog) で常駐していることがある**。`lsof -ti:3000` で確認し、占有されていたら `PORT=3100 npm run dev` 等で別ポートに逃がす。

**ESLint**: `@typescript-eslint/no-explicit-any` is an **error** (never use `any`). Config is `eslint.config.mjs` (flat config, NOT `.eslintrc.json`). `react-hooks/set-state-in-effect` (effect の中で同期的に setState) も error。初期値は `useSyncExternalStore`、状態のリセットはイベントハンドラで行う。

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

### Page frame (`app/layout.tsx`)

全ページ共通: スキップリンク (「本文へ移動」) → `SiteHeader` → `<main id="main-content" tabIndex={-1}>` → `SiteFooter`。各ページは中身だけを `<div className="page">` (幅 42rem) か `<div className="page page--wide">` (64rem。作品 / PlayStation / 野球) で返す。`body:has(.page--wide)` のときヘッダーとフッターも同じ幅に揃う。

- `app/components/site/SiteHeader.tsx` (client): `<nav aria-label="サイト内">` 1 つ。「すべてのページ」ボタン (`popoverTarget`) で全ページの一覧を `popover="auto"` で開く (Esc・外側クリックで閉じるのはブラウザ標準、Next のクライアント遷移で閉じる処理だけ自前)。常時出すリンクは `navigation.ts` の `FEATURED_KEYS` (2026-11 時点は空)。足すと ResizeObserver で 1 行に収まるときだけ表示する。現在地は `aria-current="page"` + 下線 + 太字
- `app/components/site/SiteChrome.tsx`: `PageHeader` (h1 はページに 1 つ。名前は台帳から。`title` / `description` / `profile={false}` / 追加リンクを children で上書きできる)、`SiteFooter` (外部プロフィール一覧 + ©)、`FeedStatus` (空・読み込み中・エラーの訪問者向け文言)
- `app/components/site/PlatformTokens.tsx`: プラットフォーム色の CSS 変数を `platforms.ts` から生成して `<head>` に出す (後述)
- `app/not-found.tsx` / `app/error.tsx` もトークンで書いてある

### Core Pattern: Server Component が描き、続きだけ client が読む

プラットフォームページ (`app/<platform>/page.tsx`) は async Server Component で、build 時に `app/lib/feeds/<platform>.ts` の `getXPosts()` を直接呼ぶ。

- 統計 (`PlatformDashboard` の `<dl>`)・グラフ・高評価の棚などはサーバーで計算して描く (`app/<platform>/dashboard.tsx` や `parts.tsx` に置く)
- 投稿一覧は `app/components/feed/PlatformFeed.tsx` (client) に **最初の 1 ページ (`initialPosts`、通常 20 件) と総件数** を渡す。2 ページ目以降・絞り込みのときだけ、`force-static` の route handler が書き出した静的 JSON (`/api/<platform>`) を `useLazyFeed` で読む。絞り込みは `filters={{ label, field: "description" | "category", options }}` (件数はサーバーで数える)
- 以前の「`*Client.tsx` が `fetch('/api/x')` してから描く」形 (毎回「読み込み中…」が出た) と `FeedPosts` は廃止

X だけはカードの代わりに `react-tweet` の公式埋め込み (`app/components/feed/XPostCard.tsx`)。1 件ごとに X から読むので 1 ページ 10 件。**react-tweet は 3.3.1 以上**が必要 (3.3.0 は `entities is not iterable` で全件が代わりの文字カードになっていた)。

### Data Flow

```
External APIs/RSS/Scraping → app/lib/feeds/[platform].ts → Server Component (build time)
                                                              ↓
                          Static HTML (最初の 1 ページ + 統計) + static /api/* JSON (force-static)
                                                              ↓
                          Client (PlatformFeed / HomeFeed) が続きを読むときだけ /api/* を fetch
```

**Feed JSON は GCS bucket `basecamp-feeds` (asia-northeast1, public-read) が source of truth**。書き込みは引き続き GitHub Actions (`scripts/update-*-feed.ts` + `scripts/lib/feed-storage.ts`) が行い、site の build 時には `app/lib/feed-storage.ts` の `readFeedJson` で公開 URL から読む (`GCS_BUCKET` 未設定時は `public/data/` への fs フォールバック)。

### Home (`app/page.tsx`)

`app/lib/home-feed.ts` の `getHomeData()` (全プラットフォームを読んで日付降順に並べる。React `cache()` 付き) と `getHomeFeedPosts()` (「記録なし」の日記を除いたもの) を使う。

- `HomeIntro` (アバター・名前・紹介文 (`bio.json`、「AI が記録から毎週書く紹介文」と明記、3 行で切って「続きを読む」)・日本語ラベルの統計・外部プロフィール (狭い画面では横スクロール 1 行))
- `WorksCarousel` (作品。後述)
- `HomeFeed` (client): **HTML に埋め込むのは直近 `INITIAL_DAYS` (= 3) 日だけ** (`app/lib/feed/days.ts`)。続きは `/api/home-feed/recent` (直近 30 日、スクロールで 4 日目に入ったとき) と `/api/home-feed/archive` (それより前、検索するときと 30 日より前まで遡るとき) を読む。分割は `getHomeFeedChunks()`。2026-11 の刷新前は全 7,300 件を HTML に入れて 3.5MB あった (今は約 95KB)
- ⚠️ `INITIAL_DAYS` のようにサーバーとブラウザの両方が使う値は `"use client"` のファイルから export しない。サーバー側では数値ではなくクライアント参照になり、`slice(0, INITIAL_DAYS)` が空配列になった (実際に踏んだ)

### Build-time feed library (`app/lib/feeds/`)

各プラットフォームのデータ取得ロジックは `app/lib/feeds/<platform>.ts` に集約:

- **GCS readers** (booklog, diary, duolingo, ff14, ff14-achievements, filmarks, playstation, spotify, steam, summaries, swarm, x, alco, npb): `readFeedJson()` で GCS JSON を読み、`Post[]` 形式に整形
- **Live fetchers** (github, hatena, hatenabookmark, note, zenn, tenhou): 各種 RSS / REST API を build 時に叩く

これらは Server Component と route handler の両方から import される。Route handler (`app/api/<platform>/route.ts`) は `force-static` の薄いラッパで `NextResponse.json(await getXPosts())` を返すだけ。Build 時に評価され、出力は `out/api/<platform>` という静的ファイルになる。

**No API route**: soundcloud (embedded iframe player)、decks (`public/data/decks.json` — git tracked — を build 時に `fs` で読む)、baseball、apps

When adding a new platform with external images, the `images.unoptimized: true` setting means the browser loads originals directly — no `remotePatterns` config needed.

### Type System (`app/lib/types.ts`)

- `BasePost` → platform-specific types (`GitHubPost`, `HatenaPost`, etc.) → `PlatformPost` union
- `Post` — legacy type still used in most code (backward compatible)

## Key Utilities (`app/lib/`)

| File | Purpose |
|---|---|
| `platforms.ts` | **プラットフォームの台帳 (single source of truth)**: 表示名 (`label` / `shortLabel`) とライト/ダークの色。`platformLabel()`, `platformVar()` (= `var(--color-<key>)`) |
| `navigation.ts` | **ナビの台帳**: `NAV_GROUPS` (グループ・パス・説明)、`FEATURED_KEYS`、`isCurrent()`、`pageMetadata(key, description)` (各ページの title/description/openGraph)、`SITEMAP_PATHS` (`app/sitemap.ts` が使う) |
| `home-feed.ts` | ホームのデータ (`getHomeData` / `getHomeFeedPosts` / `getHomeFeedChunks`) |
| `feed/days.ts` | `groupByJstDay()` (JST の暦日でまとめる)、`INITIAL_DAYS` |
| `feed/collapse.ts` | `collapseRuns(items, minRun = 3)` — 同じプラットフォームが 3 件以上続いたら先頭 1 件 + 残りに畳む。`expandRows()` で元に戻る (テストの不変条件) |
| `shared/date-utils.ts` | **JST 固定**の `jstDayKey()` / `formatJstTime()` / `formatJstDayHeading()` / `formatJstDateTime()` / `dayKeyDiff()`。表示用の日付は必ずこれを使う (`toLocaleDateString` や `getDate()` はビルド環境の UTC で計算されてしまう)。`formatRelativeTime()` (「N時間前」) は静的 HTML に焼くと古くなるので新しいコードでは使わない |
| `config.ts` | Platform usernames + profile URLs (`config.profiles`) |
| `types.ts` | `BasePost` → platform-specific types → `PlatformPost` union |
| `fetch-with-timeout.ts` | `fetchWithTimeout()` with AbortController (default 10s) |
| `feed-storage.ts` | `readFeedJson()` — Build 時に GCS の公開 URL から feed JSON を取得 |
| `shared/duration.ts` | `formatDuration(seconds)` — `45分` / `3時間12分` / `1,984時間` |
| `shared/html-utils.ts` | `stripHtmlTags()`, `extractThumbnailFromContent()` — RSS feed parsing helpers |

旧 architecture 由来の orphan (`api.ts`, `posts.ts`, `spotify-auth.ts`, `subscriptions.ts`, `tenhouParser.ts`、MagneticButton / hooks / widgets / 旧 Header・Footer など) は 2026-11 の刷新で削除済み。`summaries.ts` / `formatters.ts` / `api-errors.ts` / `jsonld.ts` は参照があるので残っている。

## Critical Patterns

### Static export と build cadence

全ページは `output: 'export'` で build 時に HTML 化される。ISR は使わない。フィード反映は GitHub Actions の `.github/workflows/deploy-pages.yml` が daily cron (JST 09:00 / 21:00) で site rebuild することで実現される。Push to main でも build がトリガーされる。

Route handler (`app/api/*/route.ts`) は `export const dynamic = "force-static"` で、build 時に評価され `out/api/<route>` という静的 JSON ファイルになる。

`readFeedJson()` 内の `fetch()` は **`cache` オプションを指定しない**こと (Next.js のデフォルト build-cache に任せる)。`cache: "no-store"` を渡すと `force-static` と矛盾して空配列に化ける罠あり。

### 日付と時刻 (ハイドレーション)

ビルドは UTC、閲覧は JST。日付の区切り・表示は `date-utils.ts` の JST 関数で計算する。「今日 / 昨日」のように**今**に依存する表示は、`useSyncExternalStore` のサーバー値を `null` にしてハイドレーション後にだけ出す (`app/components/feed/useJstToday.ts`)。カードの時刻は JST の絶対表記 (`<time dateTime>`)。日記 (23:59 固定) と野球 (22:00 固定) と Swarm (非公開) は時刻を出さない (`feedCardAdapters.ts` の `dateOnlyPlatforms`)。

### TypeScript: null → undefined Conversion
External APIs return `string | null` but types expect `string | undefined`:
```typescript
language: repo.language ?? undefined,
```

### Image HTTP → HTTPS
```typescript
imgUrl.replace(/^http:/, "https:")
```
Required in all feed lib functions to avoid mixed content errors (カードの `Thumbnail` も念のため置き換える)。

### 名前と色は台帳に 1 回だけ書く

- 表示名・色: `app/lib/platforms.ts`。カードの出所表示 (`feedCardAdapters.ts` の `platformLabel`)、ナビ、ページ見出し、`<title>` がここを読む (以前は「Hatena / Hatena Blog / はてなブログ」のように場所ごとに違っていた)
- 色の CSS 変数: `PlatformTokens.tsx` が `:root{--color-<key>}` (+ `prefers-color-scheme: dark` の値) と `[data-platform="<key>"]{--platform: var(--color-<key>)}` を生成する。カード・バッジ・帯・ナビの印は要素に `data-platform` を付けて `var(--platform)` を使うだけ。プラットフォームごとの CSS ルールは書かない
- ナビ・サイトマップ: `app/lib/navigation.ts`。飲酒記録は noindex なのでサイトマップから外している (`app/sitemap.ts`)

### Design tokens (`app/globals.css` 冒頭)

意味で名前を付けた色 (`--bg` `--surface` `--fg` `--fg-muted` `--line` `--line-strong` `--accent` `--focus`)、文字 (`--text-xs`〜`--text-h1`, `--leading-body: 1.75`)、余白 `--space-1..7`、角丸、`--dur` (動きを減らす設定で 0)、レイアウト幅。ライト/ダークは `prefers-color-scheme` で切り替え (切替ボタンは置かない)。`--color-text` などの旧名は、まだ移行していない CSS (PlayStation の `.ps-*`、NPB、DeckList、天鳳/FF14 の Tailwind 部品) のための別名。

- **アクセント (ラズベリー `#c32a5e` / 暗色 `#ff7aa5`) は現在地・今日・フォーカスにしか使わない**
- バッジは色を塗らず、`color-mix()` で色を薄く混ぜた背景に本文色の文字 (どの色でも 4.5:1 以上)
- `<body>` に `font-sans` を付けない。Tailwind の `fontFamily.sans` は `var(--font-sans)` (和文スタック) にしてある

### CSS の置き場所 (Tailwind v3 の罠)

- `app/styles/site.css`: 刷新後の部品 (ヘッダー、カード `.post`、日ごとのセクション `.day`、帯 `.band`、作品 `.works`、`.chips`、`.stats` など)。**Tailwind を通さない素の CSS** で、`layout.tsx` から `globals.css` の後に読む
- `app/globals.css`: Tailwind + トークン + まだ移行していない部品。`@layer components` の中のクラスは**ソースに文字列で書かれていないと消される** (`ps-trophy-${type}` のような動的クラスは `@layer` の外に置く)
- 横にはみ出す表は `.data-table-scroll` (`position: relative` 必須) に入れる。中の `.sr-only` (絶対配置) がスクロール領域の外へ出てページ全体が横スクロールした (2026-11)。`.page` にも `overflow-x: clip` を付けてある

### RSS Thumbnail Quirks
Each platform stores thumbnails differently in RSS. Always check the actual feed structure first. RDF-format feeds (Booklog, Hatena Bookmark) need standard fields added to `rss-parser` `customFields` explicitly.

### External Profile Links

`config.profiles[platform]` を読む。ホーム冒頭とフッターは `app/components/site/ProfileLinkList.tsx` (並び順はファイル内の `ORDER`)、各ページは `PageHeader` の「◯◯のプロフィール」リンク。外部リンクは新しいタブで開き、読み上げ用に「（新しいタブで開く）」を付ける。FF14 は `lodestoneUrl`。天鳳は個人ページが無いので `profile={false}`。

### Adding a New Platform Checklist

**Note**: This checklist applies to **standard feed platforms** (chronological item list). For non-standard cases see:
- **Catalog-style** (a curated grid + works row) → see **Apps**. `/api/apps` は無く、`readFeedJson("apps.json")` をホームと `/apps` のサーバー側で読む
- **Reference / state page** (外部の「今の状態」を見せるだけ) → see **NPB**。順位表 (状態) はホームフィードに流さない。試合結果だけは `getNpbPosts()` で **1 試合日 = 1 カード** に丸めて流す
- **External-trigger ingest** → see **Swarm** / **alco-diary**
- **AI-generated content** → see **Diary**

For a standard feed platform:
1. `app/lib/platforms.ts` に `label` と `color: {light, dark}` を足す (CSS 変数・`data-platform` の色はここから自動生成される)
2. `app/lib/navigation.ts` の適切なグループに `{ key, path, description }` を足す (ナビ・サイトマップ・`pageMetadata` に反映)
3. `app/lib/feeds/[platform].ts` に `getXPosts(): Promise<Post[]>`
4. `app/api/[platform]/route.ts` — `export const dynamic = "force-static"; export async function GET() { return NextResponse.json(await getXPosts()); }`
5. `app/[platform]/page.tsx` (async Server Component): `export const metadata = pageMetadata("key", "説明")`、`<div className="page"><PageHeader platform="key" />` + 統計 (`PlatformDashboard`) + `<PlatformFeed platform="key" initialPosts={posts.slice(0, 20)} totalCount={posts.length} src="/api/key" />`
6. `feedCardAdapters.ts` に必要ならバッジ (`resolveBadge`)・stat ピル (`resolveStatPills`)・`portraitPlatforms` / `platformsWithoutDescription` / `dateOnlyPlatforms`
7. 外部プロフィールがあれば `config.ts` の `profiles` と `ProfileLinkList.tsx` の `ORDER`
8. ホームに流すなら `app/lib/home-feed.ts` の `loadHomeData()` に `getXPosts` を足す (Promise.all + merge spread)。Server Component から `/api/*` を呼ばない
9. **GHA writer script を持つ activity feed の場合**: `scripts/send-daily-digest.ts` の `FEEDS` 配列に追加 (stale 検知)
10. **本人の活動を表す feed の場合**: `scripts/lib/diary/collect.ts` / `facts.ts` / `app/lib/diary-types.ts` にも足す (デイリーログに出すため)

## Component System

### Feed card (`app/components/shared/FeedCard.tsx`)

`RichFeedCard` → `adaptPost(post, platform)` (`feedCardAdapters.ts`) → `FeedCard`。全プラットフォーム共通の形 (X 以外):

- `<article class="post" data-platform>` の中で、**見出しのリンク 1 本を `.card-link::after` でカード全体に広げる** (タブ移動 1 回。カード内に別のリンクを置くときは `position: relative; z-index: 1` で手前に出す)。フォーカス枠は `:has(.card-link:focus-visible)` でカード側に描く
- 並び: サムネイル (64px、ブクログ/Filmarks は縦長) → 見出し → メタ行 (バッジ・出所・時刻) → 説明 → stat ピル → meta ピル (`FeedItemMeta.tsx`)
- `timeFormat="time"` (日付見出しの下、HH:mm だけ) / `"datetime"` (単独の一覧)
- サイト内リンク (`/diary/` など) は同じタブ、外部は新しいタブ

### Home feed (`app/components/home/HomeFeed.tsx`)

- 1 日 = `<section>` + `<h2>` (大きな日の数字 + 月・曜日、「今日 / 昨日」はハイドレーション後) + `ActivityBand` (その日の件数比の帯。色だけで情報を持つので `aria-hidden` にし、凡例の文字を必ず出す)
- 各日の中で `collapseRuns()`。ボタンは `aria-expanded` 付きで「Spotify をあと 8 件表示（同じ内容）」。開いた分はボタンの後ろに足す (押した場所が動かない)。X の連続は 10 件ずつ
- 検索欄は sticky にしない (ヘッダーと 2 本重ねない)。`/` で移動、`?q=` を History API で同期。検索中は畳まず、全件 (archive) を読んでから探す
- 自動読み込み (IntersectionObserver) と同じ働きの「前の日を表示」ボタンを置く (キーボード操作・フッターに辿り着くため)。「記録を飛ばしてページの最後へ」のスキップリンクもある
- 2 日目以降の行は `content-visibility: auto; contain-intrinsic-size: auto 5.5rem`。⚠️ これは行の外にはみ出した描画を切り取るので、タイムラインの点や線は行 (li) の内側に描く

### Works row (`app/components/home/WorksCarousel.tsx`)

作品の横スクロール。**自動送りはしない** (2026-11 にユーザー判断で廃止。停止ボタンの無い自動回転は WCAG 2.2.2 に反し、見られにくい)。scroll-snap + 前後の `<button>` (端では `aria-disabled`) + ボタンで動かしたときだけ「3 / 11」を読み上げ。カードは複製しない。動きを減らす設定ではスムーズスクロールしない。

### Platform Dashboard (`app/components/dashboard/PlatformDashboard.tsx`)
ページ上部の数字の並び。`<dl class="stats">` をサーバーで描く:
```tsx
<PlatformDashboard stats={[{ label: "リポジトリ", value: 5 }]} />
```

### Chart Components (`app/components/charts/`)
Pure SVG (no external library)。`BarChart` / `DonutChart` は `role="img"` + 内容を言葉にした `aria-label` を付けてある (凡例・数値も文字で出す)。

### FilterChips (`app/components/shared/FilterChips.tsx`)
絞り込みボタン。`role="group"` + `aria-pressed`、押されている状態は塗り + ✓ (色だけにしない)。X / ブクログ (`PlatformFeed` の `filters`)、`/apps` のタグ (複数選択)、PlayStation のライブラリで共用。

## GitHub Actions Feeds

```
GitHub Actions (every 3h cron) → API fetch → Workload Identity Federation で GCP 認証 → gs://basecamp-feeds/<feed>.json に PUT → daily site rebuild (deploy-pages.yml) で取り込まれて GitHub Pages に反映
```

**Actions の版**: 全 workflow を Node.js 24 で動く版にそろえてある (`actions/checkout@v7`, `actions/setup-node@v7`, `google-github-actions/auth@v3`, `actions/upload-pages-artifact@v5`, `actions/deploy-pages@v5`、2026-11)。スクリプトを動かす Node は `node-version: "22"` (Node 20 は 2026-04-30 でサポート終了。手元の開発環境も 22)。`upload-pages-artifact` は v4 から `.` で始まるファイルを成果物に入れない (`out/` には無い。必要になったら `include-hidden-files: true`)。

GHA の各 feed-writer workflow は GCS に書き込むだけ。Site への反映は `.github/workflows/deploy-pages.yml` が JST 09:00 / 21:00 cron で build & deploy することで起きる (= フィード更新が site に反映されるまで最大 ~12h ラグあり)。`scripts/lib/feed-storage.ts` の `writeFeed()` が `@google-cloud/storage` SDK で直接 bucket に書き込む。各 workflow には `permissions: id-token: write` と `google-github-actions/auth@v3` (workload_identity_provider: `projects/130346180231/locations/global/workloadIdentityPools/github-pool/providers/github`、service_account: `gha-feed-writer@basecamp-satory074.iam.gserviceaccount.com`) のステップが入っている。

### X (Twitter)
- **Schedule**: every 3h at :20 (UTC), cron `20 */3 * * *`
- **Script**: `scripts/update-x-feed.ts` → `gs://basecamp-feeds/x-tweets.json`
- **Display**: `react-tweet` embeds with category badges (投稿/リポスト/いいね/ブックマーク). `/x` page has category filter tabs + DonutChart. Shared via `TweetEmbed.tsx`.
- OAuth 2.0 PKCE: refresh token rotates on every use, auto-updated via `gh secret set`
- **Re-authorization** (token broken): run `npx tsx scripts/x-oauth-setup.ts` (requires port 3000 free) → run the `gh secret set X_REFRESH_TOKEN ...` command it prints (from your machine, not from a workflow). workflow_dispatch の入力でトークンを受け取る方式は廃止した (公開リポジトリの Actions ログに step の値が出るため、2026-09-19)。自動ローテーションで secret 更新に失敗したときも、GHA 上ではトークン本体をログに出さない (`reportUnsavedToken`) ので、同じ手順で再認可する
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
- **日本語化**: 実績名・説明文 (`detail`) は `GetSchemaForGame` / `GetPlayerAchievements` に `l=japanese` を付けて日本語版を取る。隠し実績はどちらの API にも説明文が無い (`detail: ""`)。日本語版の無いゲーム (Hacknet) は原文のまま。**ゲーム名は Web API が英語しか返さない**ので、ストアの `store.steampowered.com/api/appdetails?appids=<id>&l=japanese` の `name` を使い、ファイルの `gameNames` (appId → 名前) にキャッシュする (ストアから取れないゲームは Web API の名前をキャッシュして毎回引き直さない)。`detail` が undefined の既存エントリは次の run でスキーマを引いて埋める
- カード: 説明文を description、ゲーム名を `post.data.gameName` + stat ピル (`data.stats`、PlayStation と同じ形)。`/steam` のゲーム別集計も `data.gameName` を読む
- **Steam Deck caveat**: Offline achievements sync when going online and launching the game; timestamps reflect sync time, not unlock time.
- GitHub Secrets: `STEAM_API_KEY`, `STEAM_USER_ID`, `DISCORD_WEBHOOK_URL`

### PlayStation (トロフィー / プレイ時間 / ライブラリ)
- **Schedule**: every 3h at :10 (UTC), cron `10 */3 * * *`
- **Script**: `scripts/update-playstation-feed.ts` (本体は `scripts/lib/playstation/` の `fetch.ts` / `plays.ts` / `duration.ts`)。型は `app/lib/playstation-types.ts` (script とサイトで共有)。書き込み先は 3 ファイル:
    - `playstation-trophies.json` — 獲得済みトロフィー 1 個 = 1 件 (id `playstation-<npCommId>-<trophyId>`)。**全タイトル**・`Accept-Language: ja-JP` の日本語名 + 説明文 (`detail`) + DLC 名 (`groupName`) + 獲得率 + `conceptId`
    - `playstation-profile.json` — スナップショット: トロフィーレベル (`summary`)、**concept 単位のゲーム** (PS4 版と PS5 版は `concept.id` が同じなので合算。累計プレイ秒数・起動回数・初回/最終プレイ・画像・対応するトロフィーセット)、タイトル別トロフィー進捗 + DLC 進捗 (`trophySets`)、購入ライブラリ (`library`)、レベルアップ履歴 (`levelHistory`)
    - `playstation-plays.json` — プレイ記録 (1 日 1 ゲーム 1 件)。下記
- 非公式の **`psn-api`** ライブラリを使用。Sony は公開 API も安定した API キーも提供していないため、ブラウザから取得する **NPSSO トークン** で認証する（X の OAuth と同じく壊れやすい系統）
- **プレイ時間は差分で作る**: PSN はセッション単位の履歴を返さず titleId ごとの累計 (`getUserPlayedGames` の playDuration / playCount / lastPlayedDateTime) しか無い。`applyPlaySnapshot()` が前回 run の累計 (`baseline`) との差分を取り、`lastPlayedDateTime` の **JST 暦日**の `psplay-<dayKey>-<conceptId>` に**加算で** upsert する (Duolingo のように同日の増分を上書きしない)。60 秒未満の増分は捨てる。初回 run は baseline を取るだけ (`since` が記録開始)
    - 既知の近似: **日付をまたいだセッションは全部終了側の日に入る**。前回 run から **30 時間以上空いた**とき (NPSSO 失効明けなど) は何日分か分からないので計上せず baseline だけ取り直し、Discord に warning
    - 前回 run の後に初めて遊んだタイトルは累計全部を計上し、concept として初めての日なら `isFirst` (「はじめて」バッジ)
- **トロフィーの取得は差分のみ**: `lastUpdatedDateTime` が変わったタイトルだけ `getTitleTrophies` + `getUserTrophiesEarnedForTitle` (+ DLC があれば `getTitleTrophyGroups` / `getUserTrophyGroupEarningsForTitle`) を叩く。全タイトル取り直すのは UTC 0〜2 時台の run (1 日 1 回、獲得率の更新用)・保存済みが ja-JP でないとき・`gh workflow run update-playstation-feed.yml -R satory074/basecamp -f full_refresh=true` のとき。プレイ履歴の titleId → トロフィーセットは `getUserTrophiesForSpecificTitle` (5 件ずつ) で対応付ける
- **ライブラリ**: `getPurchasedGames`。名前・画像・機種・予約・PS Plus 区分だけ保存し productId / entitlementId は捨てる。YouTube などのアプリ (プレイ履歴の category に `app` を含む titleId) と体験版は載せない。購入日は API から取れないので、**2 回目以降の run で新しく見えたもの**に `firstSeenAt` を付けてホームに「ライブラリに追加」として流す (初回は null)。`/playstation` では PS4 版と PS5 版 (クロスバイ) を 1 本にまとめる (titleId → ライブラリ名の別名 → 名前の順で照合)
- **取得しないもの**: オンライン状態 (`getBasicPresence`。サイトは 1 日 2 回しか更新しないので「今遊んでいる」は出せない)、フレンド・ブロック・申請、使用機器、地域、本名 (`personalDetail`)、署名付きで期限のある `shareImageUrl`
- **ホームフィード** (`app/lib/feeds/playstation.ts` の `getPlaystationPosts()`): `post.category` でバッジを切り替える (`feedCardAdapters.ts` の `playstationBadges`)。bronze〜platinum = トロフィー / `play` = プレイ記録 / `first-play` = はじめてプレイ (`firstPlayedDateTime` から全ゲーム分を導出、プレイ記録側に isFirst があればそちらを使う) / `level` = トロフィーレベル到達 / `library` = ライブラリ追加。stat ピルは `post.data.stats` (diary と同じ形)。リンクは `/playstation/#game-<conceptId>`
- **`/playstation`**: async Server Component が `getPlaystationView()` を組み立てて各セクションに渡す (`app/playstation/*.tsx`)。レベルリング + 種類別トロフィー数 → 最近遊んだゲーム → プレイ記録ヒートマップ (直近 26 週、記録開始前は破線) → プレイ時間ランキング → ゲーム別カード (トロフィー進捗・DLC) → レアトロフィー → ライブラリ (絞り込みだけ Client Component、`FilterChips`) → アクティビティ (`PlatformFeed`)。日付は build 時に固定されるので相対時刻ではなく JST の絶対日付 (`app/playstation/format.ts`)。CSS (`.ps-*`) は `globals.css` 末尾の **`@layer` の外**に置いている (`ps-trophy-${type}` のような動的クラスが Tailwind に purge されるため)
- 画像: `image.api.playstation.com` は `?w=` でリサイズ版を返すので `psImage(url, width)` を通す (元画像は 3840px・数 MB ある)
- 日記: `collectPlaystation` がプレイ記録も読み、`facts.ts` がプレイ時間のハイライト (はじめてプレイ / 90 日で最長 / 28 日平均の 2 倍 / ゲーム別) と `⏱ プレイ` ピルを出す。平均・最長との比較は記録開始から 28 日経つまで出さない
- 外部プロフィールは公式の `https://profile.playstation.com/satory_074` (公開ページ)。`config.ts` `profiles.playstation.username` は PSN Online ID (`satory_074`)
- **NPSSO は ~2 ヶ月で失効**する (ブラウザで playstation.com からログアウトするとその場で失効する。2026-06 は 3 日で切れて 6/13〜9/19 の約 3 ヶ月止まっていた)。失効すると `exchangeNpssoForAccessCode` が throw → fatal catch が Discord にエラー通知 + Daily Digest の "⚠️ Stale feeds" に出る。**再認可手順**: playstation.com にログインした状態で <https://ca.account.sony.com/api/v1/ssocookie> を開き JSON の 64 文字 `npsso` をコピー → `gh secret set PSN_NPSSO -R satory074/basecamp` → 必要なら GitHub Actions UI → `Update PlayStation Feed` → `Run workflow`。取り直した後はそのブラウザで playstation.com からログアウトしないこと
- **ローカル実行**: `GCS_BUCKET= DISCORD_DRY_RUN=1 PSN_NPSSO=... npx tsx scripts/update-playstation-feed.ts` (`public/data/` に 3 ファイルを書く)
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
- **逆リンクバー必須**: featured-app にするアプリには satory074.com/apps へ戻る固定バックリンクバーを設置する。正準スニペット・仕様・チェックリストは `docs/app-backlink.md`（全アプリ `app-backlink-bar` クラス付きで横断 grep 可能。2026-08 に全 9 アプリ統一、以降の新規掲載アプリにも都度設置＝現在 11 アプリ。Chrome 拡張など Web ページを持たないアプリは GitHub Pages の紹介ページを homepage にし、そこにバーを置く＝simple-block）
- 各 repo の `homepage` フィールド必須。空だと skip し warning ログ
- カードのリンク先は通常 `homepage`。別の URL に飛ばしたい repo は `scripts/update-apps-feed.ts` の `URL_OVERRIDES` に書く（homepage は og:image の取得元として残る）。現在は simple-block のみ＝紹介ページではなく Chrome ウェブストアへ直リンク
- 各アプリの `homepage` URL から `<meta property="og:image">` を取得 → `sharp` で 1200×630 にリサイズ → `writeBinary()` 経由で `gs://basecamp-feeds/images/apps/<id>.jpg` に PUT (`scripts/lib/feed-storage.ts`)
- og:image 未設定のアプリは `placeholder.svg` をフォールバック表示し Discord で warning 通知（→ アプリ側で og:image を追加するように促す）
- **手動で og:image を作る場合**: 1200×630 PNG を SVG → `sharp` 経由で生成 → repo の `public/og-image.png` に置き、framework の metadata head に配線する (Vite なら `index.html` の `<meta property="og:image" content="https://satory074.github.io/<repo>/og-image.png" />`、Next.js なら `metadata.openGraph.images` + `twitter.card: summary_large_image`)。次回 `update-apps-feed.yml` 実行で自動取り込み。
- repo description → app description、`topics`（`featured-app` を除く）→ tags、として自動マッピング
- API route なし: ホーム/`/apps` ともに `readFeedJson("apps.json")` で GCS 直読み
- ホームの作品の横スクロール (`app/components/home/WorksCarousel.tsx`): ネイティブ横スクロール + CSS scroll-snap、自動送りなし。詳しくは Component System の Works row
- `/apps` ページ: 検索 input（name/description/tags への `includes()` マッチ）+ タグフィルタチップ（OR モード）+ CSS Grid (auto-fill)
- GitHub Secrets: `GITHUB_TOKEN`（既存、Actions の自動付与で十分）, `DISCORD_WEBHOOK_URL`

### Swarm (Foursquare)
- **Trigger**: **Make（無料プラン）** の scenario「Swarm check-in → Sheets (basecamp inbox)」。Foursquare「Watch check-ins」(60 分間隔) → Google Sheets「Add a Row」→ 非公開 Sheet「Swarm Checkins」(Drive `IFTTT/Foursquare`、先頭タブ `シート1`) に 1 チェックイン 1 行。2026-11-03 に IFTTT から切り替えた (IFTTT applet `ATeQCx6E` は disconnect のまま予備として残してある。Make が壊れたら Connect し直せば同じ Sheet に同じ列で書く)
- **Workflow**: `.github/workflows/sync-swarm-sheet.yml` (cron `5 */3 * * *` + `workflow_dispatch` の `dry_run`)。Sheet を読んで GCS に追記し、処理した行を Sheet から削除する
- **Script**: `scripts/sync-swarm-sheet.ts` (エントリ) → `scripts/lib/swarm/checkin.ts` (blocklist 照合・座標丸め・時刻丸め・id 生成・バッチ追記・Discord 通知) / `scripts/lib/swarm/sheets.ts` (Sheets v4 REST。`google-auth-library` の ADC、`googleapis` は使わない)
- **Why Sheets inbox (重要)**: 無料の中継サービスから GitHub / GCS に直接書く手段が無い (IFTTT の Webhooks は有料、Make に GitHub トークンを預けたくない)。Google Sheets への書き込みは無料なので Sheet を受信箱にして cron で排出する。認証は既存の WIF サービスアカウント `gha-feed-writer@basecamp-satory074` に Sheet を「編集者」で共有するだけ (IAM ロール変更なし。GCP 側は `sheets.googleapis.com` を有効化)
- **Why Make (2026-11 に IFTTT から移行)**: IFTTT は 2026-10-28 にクレジット制 (IFTTT.ai) になり、この applet は 1 チェックイン 30 クレジット (トリガー 15 + アクション 15)。Free は月 1,000 = 約 33 件で、5〜8 月の公開件数 (40〜74 件/月、駅を除いた数) を超える。超えると applet が止まり、その間のチェックインは後から届かない。Make 無料プランは月 1,000 クレジットで、**新着が無い確認は 0 クレジット**、新着がある回は 1 + 件数 (実測) → 月 150 前後で収まる。IFTTT Starter (月 $2.99) が次善策
- **Why IFTTT (重要・同じ罠を避けるため)**: Foursquare v2 API は 2021-11-18 以降に登録した開発者アカウントには非公開（"If you added Foursquare after 11/18/21, you automatically have access to the new version (v3) of the API."）。v3 (Places API) には自分のチェックイン取得手段がない。新コンソール (`foursquare.com/developer/`) で発行した Client ID は `/oauth2/authenticate` で `Value ... is invalid for consumer key` エラーになる。**ユーザー自身のチェックイン履歴へのプログラマティックアクセス手段は新規開発者にはもう存在しない**ので、古い API キーを持つ中継サービス (Make / IFTTT) を経由している。Zapier には Foursquare 連携が無く、Foursquare の RSS/ICS フィードは 2019 年に終了している
- **Sheet の列順**: A `CheckinDate` / B `VenueName` / C `VenueUrl` / D `VenueMapImageUrl` / E `Shout` (1 行目はヘッダ、列 A は「書式なしテキスト」にして日付の自動変換を防ぐ)。E 列以降は全部 shout として連結する (IFTTT 経路では shout に `|||` が入ると列が増えたため)。全セル空の行は読み飛ばす
- **Make のマッピング**: A `{{1.dateCreated}}` (ISO 8601 UTC) / B `{{1.venue.name}}` / C `https://foursquare.com/v/{{1.venue.id}}` / D `?lat={{1.venue.location.lat}}&lng={{1.venue.location.lng}}` / E `{{1.shout}}`。Spreadsheet は「Enter manually」で ID 指定、**Unformatted = Yes** (RAW。店名が `+` や `=` で始まっても数式にならない)。Make の Foursquare 出力は id / dateCreated / venue{id, name, location, url} / shout / event / user だけで、**カテゴリと非公開フラグは無い**
- **非公開チェックインも届く (重要)**: Swarm で非公開にしたチェックインは Make にも IFTTT にも届く (2026-11-03 に実測。IFTTT の「公開のみ」という説明は当てにならない)。中継側にフラグが無いので除外できない。サイトに載せたくない場所はユーザー定義 blocklist で防ぐ
- **IFTTT トリガーフィールドは限定的 (予備経路)**: `Shout` / `VenueName` / `VenueUrl`（venue ページ URL、checkin permalink ではない）/ `VenueMapImageUrl` / `CheckinDate` の 5 つのみ。`VenueLat` / `VenueLng` / `VenueAddress` / `VenueCategory` は提供されない。座標は `VenueMapImageUrl`（IFTTT 独自形式 `?lat=NUM&lng=NUM`）から正規表現で抽出。id は `SHA-1(venueName + 丸め後の日付)` で生成（VenueUrl は同じ venue で再訪すると重複するため使えない。時刻をハッシュ入力に含めると総当たりで時刻が復元できるので含めない）
- **CheckinDate のパース**: IFTTT は `April 29, 2026 at 02:34PM` (アカウント TZ = JST、AM/PM の前に空白なし) で送る。V8 の `new Date()` はこれを Invalid Date にするため、2026-10 までは「now」フォールバックで **run 時刻** が入っていた (1 時間以内に発火する旧経路では実害が小さかったが、3 時間 cron では日付がずれる)。`toIsoDate()` が JST 固定で明示パースする。workflow の `TZ=Asia/Tokyo` は Sheets が列 A を日付に自動変換したときの保険
- **書き込み → 削除の順 (重要)**: GCS に書いてから Sheet の行を消す。削除失敗は次回の再取り込みで重複 (`-2`) になるだけで `redact` で消せる。逆順だと GCS 失敗でチェックインが失われ、Foursquare API が無いので復旧不能。`concurrency: swarm-checkins` で `swarm-checkin.yml` と直列化している
- **遅延**: Make polling (≤1h) + cron 3h + GitHub Pages deploy (00:00 / 12:00 UTC) ≈ 最大半日 (事実上のプライバシー遅延)。Sheet には正確な時刻と座標が最大 3 時間残るが非公開 (本人 + SA のみ)
- **プライバシーフィルタ（実装済み）**:
    - **時刻丸め**: チェックイン時刻は公開しない。`toCoarseDate()` が **JST 暦日に丸め、その日の 12:00 JST (= 03:00 UTC) に固定**して保存する。公開 JSON にも id にも正確な時刻は残らない（表示側も `feedCardAdapters.ts` の `dateOnlyPlatforms` で日付のみ表示にしている。フィード内の並び位置からの推測も、同日エントリが全て同時刻になることで潰れる）。同一 venue・同一日で id が衝突したら連番サフィックス (`-2`) を付けて**両方残す**（同じ payload の再送は重複エントリになる → `swarm-blocklist.ts redact` で削除）
    - 既存エントリは書き込みのたびに `normalizeExisting()` が丸め直す（冪等）。GCS 上のデータを一括で丸め直したいときは `gh workflow run swarm-checkin.yml -R satory074/basecamp -f migrate_only=true`（= `SWARM_MIGRATE_ONLY=1`、payload なしで正規化のみ実行）
    - 座標丸め: lat/lng を小数3桁（約100m精度）に丸める
    - **ビルトイン blocklist**: 鉄道駅カテゴリ (`Train Station`, `Subway`, `Metro Station`, `Light Rail Station`, `Tram Station`, `Platform`, `Train`) と venue 名末尾が `駅` / `Station` のものを自動スキップ。Foursquare はバイリンガル表記 `English Station (日本語駅)` を多用するため、名前パターンは末尾 `)` を許容する（regex `/(駅|Station)\s*\)?\s*$/i`）。`駅前` / `駅ビル` などは末尾が 駅/Station ではないので素通り
    - **ユーザー定義 blocklist**: `SWARM_BLOCKED_VENUES` GitHub Secret に JSON 配列で登録。`name` / `address` (部分一致), `category` (完全一致), `lat-lng` (半径指定) の 4 種類の照合タイプ
- **Blocklist 管理 CLI**: `npx tsx scripts/swarm-blocklist.ts <list|add|sync|redact>`
    - `add name "自宅"` で追加 → `.env.local` の `SWARM_BLOCKED_VENUES_LOCAL` (single source of truth) を更新 + `gh secret set SWARM_BLOCKED_VENUES` で GitHub に同期
    - `redact` で直近の checkins から削除候補を選択 → JSON から削除 + その venue 名を blocklist 追加
- **手動テスト**: `gh workflow run sync-swarm-sheet.yml -R satory074/basecamp -f dry_run=true` (Sheet を読んで変換するだけ、書かない・消さない)。payload 注入は `gh workflow run swarm-checkin.yml -R satory074/basecamp -f payload='{...}'` (`scripts/append-swarm-checkin.ts`。`repository_dispatch` trigger は旧経路の名残で削除可)。ローカルは `GCS_BUCKET= DISCORD_DRY_RUN=1 SWARM_PAYLOAD='{...}' npx tsx scripts/append-swarm-checkin.ts` (`public/data/swarm-checkins.json` に書く)
- **テスト**: `npm test` (`scripts/lib/swarm/checkin.test.ts`、不変条件 2 件: Sheet 行と ISO payload が同じ id / 日付に収束する・0 行なら GCS を読み書きしない)
- **Make セットアップ**: Make アカウント (us2) で Foursquare と Google Sheets の connection をユーザー本人が OAuth で許可し、上記マッピングの scenario を作る。Watch check-ins の Limit 10、開始位置は「Check-ins from after a specific date」で指定できる (右クリック →「Choose where to start」でやり直せる)。**不具合のときはまず Make の scenario の History** (エラーや停止) → Sheet に行が溜まっていないか → `sync-swarm-sheet.yml` の run 履歴、の順に見る
- **IFTTT セットアップ (予備)**: applet「Foursquare: Any new check-in」→「Google Sheets: Add row to spreadsheet」。Spreadsheet name `Swarm Checkins`、Drive folder path `IFTTT/Foursquare`、Formatted row `{{CheckinDate}} ||| {{VenueName}} ||| {{VenueUrl}} ||| {{VenueMapImageUrl}} ||| {{Shout}}`。Sheet をサービスアカウントに編集者で共有し、スプレッドシート ID を `SWARM_SHEET_ID` Secret に入れる (public repo なので ID は CLAUDE.md に書かない。Drive の `IFTTT/Foursquare/Swarm Checkins` を開けば URL に出る)。Sheet 側の作成・共有は `gws` CLI (`@googleworkspace/cli`、`~/.nvm/.../bin/gws`) で行った
- GitHub Secrets: `SWARM_SHEET_ID`, `SWARM_BLOCKED_VENUES`（オプション、空配列 `[]` でも可）, `DISCORD_WEBHOOK_URL`

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
- 日本版 Lodestone の達成ヒストリー (`/lodestone/character/<id>/achievement/`、50 件/ページ・新しい順、2026-09 時点で 21 ページ約 1,000 件) を読む
    - **各行は `<a class="entry__achievement" href=".../achievement/detail/<id>/">` そのもの**。子孫から `a[href]` を探すと見つからない (2026-09 まで URL が空になり、全件が同じキー "" でキャッシュされて 1 件しか出ていなかった)。次ページの `.btn__pager__next` も `<a>` そのもの
    - 本文「クエスト「永久の探求者」を達成しました。」をカテゴリ (`category`) と名前 (`title`) に分ける。カテゴリはカードのバッジに出す
- **詳細ページ** (`achievement/detail/<id>/`) から説明文・達成ポイント・報酬を取る。詳細が未取得のものを新しい順に **1 run 150 件まで** (初回の約 1,000 件は数 run かけて埋まる。Discord の "Details Remaining" が残り件数)。報酬の称号は日本版でも英語表記なので、カードの報酬ピルは日本語のもの (アイテム名など) だけ出す
- インクリメンタルキャッシュ: アチーブメントは不変データ、全件キャッシュ済みのページで停止。キャッシュは `gs://basecamp-feeds/ff14-achievements-cache.json` (期限なし、`version: 2` = achievement id → { 本文, カテゴリ, 名前, アイコン, 日時, detail })。v1 (URL キー) は読み込み時に移行する
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
  cron でポーリングする対象が存在しないので push 型にしている (Swarm も 2026-10 までは同じ形だった)。GitHub の PAT は
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
- **stale 検知の対象外**: push 駆動で更新間隔が不定なため `send-daily-digest.ts` の `FEEDS` には入れない (Swarm も同様。cron 化後もチェックイン頻度が不定なので対象外のまま)
- GitHub Secrets: `DISCORD_WEBHOOK_URL` のみ (受け口側に専用シークレットは不要)

### NPB (プロ野球 順位表・全試合結果)
- **Schedule**: JST 08:30 / 20:30 (cron `30 23 * * *` と `30 11 * * *`)。`deploy-pages.yml` の cron 直前に置いてある
- **Script**: `scripts/update-npb-feed.ts` → `gs://basecamp-feeds/npb-standings.json` + `gs://basecamp-feeds/npb-games.json`
- **ページ**: `/baseball` (順位表 + 直近3日の結果 + 月別ナビ) と `/baseball/[month]` (その月の全試合、`generateStaticParams` で 3〜10 月を静的生成)。月別ページの各日 `<section>` は `id="day-YYYY-MM-DD"` を持ち、ホームフィードのカードから `/baseball/MM/#day-YYYY-MM-DD` でリンクされる
- **Server Component のみ**。`/api/baseball` route は作っていない (Client fetch しないため)
- **ホームフィードには 1 試合日 = 1 カード** (`getNpbPosts()` → `buildNpbDayPosts()`、platform key は既存の `baseball`)。試合単位だと年 860 件でフィードを飲み込むので日単位に丸める。順位表は「状態」なので流さない
    - カード化するのは **final を 1 つ以上含み、scheduled が残っていない日** (= 結果が出揃った日) のみ。20:30 JST スクレイプ時点ではナイターが scheduled のままなので、その日のカードは 21:00 build には出ず翌 09:00 build で出る (日記と同じタイミング)。`(予備日)` 行は行にしない
    - `id` は `npb-day-<date>`、`date` は `<date>T22:00:00+09:00` 固定 (bare `YYYY-MM-DD` は UTC 深夜扱いになり、JST の日付でまとめる `groupByJstDay()` でも前日 (09:00 JST) 側に入ってしまう。22:00 JST にしておけば当日に入る)。表示は `dateOnlyPlatforms` で時刻を伏せる
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
- **表示**: `app/lib/feeds/diary.ts` が v2 を `url: "/diary/"`, `category: "day" | "empty"`, `data.stats` 付きの `Post` にする。`feedCardAdapters.ts` の `resolveStatPills` が `data.stats` を stat ピルに、説明は `platformsWithFullDescription` で全文表示し、`site.css` の `.post-desc` (行を切らないとき `white-space: pre-line`) で改行を保つ (野球と同じ)。カードのリンクは 1 本 (`/diary/`) なのでハイライト個別リンクは未表示 (`highlights[].url` に保存はしている)。中身の無い日 (`category: "empty"`、見出し「記録なし」) はホームには出さない (`getHomeFeedPosts()`)。`/diary/` には出る
- **Booklog の読了判定は `finishedDate`** (「2026年8月13日」) で行う。`date` は棚追加日で読了時に動かない
- **GitHub**: public events API の `PushEvent.payload` には commit 数が入らない (`before/head/push_id/ref/repository_id` のみ) ので、当日 push した repo ごとに `/repos/<repo>/commits?author&since&until&sha=<branch>` で数える。公開 repo のみ・90 日分。`GITHUB_TOKEN` 必須 (無いと 60 req/h)
- **バックフィル**: `gh workflow run update-diary-feed.yml -R satory074/basecamp -f target_date=YYYY-MM-DD -f regenerate=true`。`regenerate` (= `DIARY_FORCE=1`) が無いと既存 v2 はスキップ (v1 は無条件で置換)。**複数日をバックフィルするときは 1 本ずつ `gh run watch` で完了を待ってから次を dispatch する**。workflow の `concurrency: diary-feed` は read-modify-write の競合防止用だが、GitHub は同一グループの pending run を 1 本しか保持しないので、まとめて dispatch すると途中の run が自動キャンセルされる (2026-08-30 に実際に 4 本消えた)。Spotify のベースラインに 28 日、GitHub events に 90 日の履歴上限があるので遡るのはその範囲まで
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

PSN_NPSSO=...                  # PlayStation (トロフィー / プレイ時間 / ライブラリ) 取得用の NPSSO トークン (~2ヶ月で失効、ブラウザから取り直し)

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
- **DNS**: Route 53 hosted zone `Z0716810FXBCKCNXIT0Q`、A レコード 4 本 (`185.199.108-111.153`) + AAAA レコード 4 本 (`2606:50c0:8000-8003::153`)。同じゾーンに `mail.satory074.com` の Resend/SES 用 (DKIM・MX・SPF、kekkonnshiki が使用) と Firebase App Hosting の TXT/CNAME もある
- **ドメイン登録**: Route 53 (Amazon Registrar)。期限 2027-09-24、自動更新オン、移管ロックオン (2026-11-03 時点)。**自動更新を切ると失効する**: 2024-06 に一度失効して取り直し、2025 は期限後に更新、2026-09-24 に再び失効して 2026-10-29 に `clientHold` でサイトが落ちた (11-03 に更新して復旧)。Cloudflare Registrar へ移管予定。期限切れから更新したドメインは元の期限から 45 日 (2026-11-08) 以降でないと移管できない。Cloudflare は DNS も Cloudflare 必須なので、先に DNS を移す (GitHub Pages 向けはプロキシをオフ)。Route 53 のホストゾーンは毎月 1 日に $0.50 かかるので、移管後に消すなら月末までに
- **CNAME**: `public/CNAME` ファイルに `satory074.com`
- **Always run `npm run build` locally before pushing**

### デプロイ後の検証

GitHub Pages はデフォルトで `Cache-Control: max-age=600` を返す。CDN は request の `no-cache` を honor しないので、cache-bust には **URL クエリパラメータ** を変えるのが確実:

```bash
# 直接 GitHub Pages origin を叩く (キャッシュ回避)
curl -sf "https://satory074.com/?cb=$RANDOM$RANDOM" | grep -oE 'class="(post|day|band|site-header)[^"]*"' | sort | uniq -c

# HTTPS 証明書 (Let's Encrypt)
echo | openssl s_client -servername satory074.com -connect satory074.com:443 2>/dev/null | openssl x509 -noout -issuer

# DNS が GitHub Pages を指しているか
dig satory074.com +short    # → 185.199.10[8-11].153 のいずれか
```

GitHub Actions の build status は `gh run list --workflow=deploy-pages.yml --limit=5` で確認。

### GCP インフラ (feed-writer 用、引き続き残す)

- **GCS bucket** `basecamp-feeds` (asia-northeast1, public-read, default Cache-Control: `public, max-age=300, stale-while-revalidate=3600`) — フィード JSON & 増分キャッシュ & apps の og:image (`images/apps/*.jpg`)。**公開 URL はエッジキャッシュ経由なので書き込み直後の読み取りは最大 5 分古い**。`scripts/lib/feed-storage.ts` の `readFeed` は `?cb=<timestamp>` を付けて必ず最新を読む (無いと数分以内に連続した writer run が古い JSON を read-modify-write して消す)
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
