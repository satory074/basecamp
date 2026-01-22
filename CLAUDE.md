# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Basecamp is a personal homepage/portfolio website built with Next.js 16 (App Router, Turbopack) and TypeScript. It aggregates content from 13 platforms (GitHub, Hatena Blog, Zenn, Note, Hatena Bookmark, SoundCloud, Spotify, Booklog, Filmarks, Tenhou, FF14, FF14 Achievements, Decks) into a unified personal showcase.

## Development Commands

```bash
npm run dev              # Start development server with Turbopack (http://localhost:3000)
npm run build            # Production build
npm run start            # Start production server
npm run lint             # Run ESLint (app/ directory only)
npm run generate-summaries  # Generate AI summaries for blog posts (requires GEMINI_API_KEY)

# Database/Auth scripts (requires .env.local with Supabase keys)
npm run create-admin     # Create admin user
npm run check-supabase   # Verify Supabase connection
npm run test-auth        # Test authentication flow
```

## Architecture Overview

### Homepage: Server Component with Client Islands
The homepage (`app/page.tsx`) is a **server component** that fetches data at request time:
- `HomeSidebar`: Displays profile, navigation, and **dynamic stats** (posts count, books count)
- `HomeFeed`: Client component with **infinite scroll** (Intersection Observer)
- **Unified Feed**: Aggregates posts from Hatena, Zenn, Note, Hatena Bookmark, Booklog, Filmarks, Spotify, FF14 Achievements, and Tenhou, sorted by date (newest first)
- **Booklog Filter**: 「読みたい」ステータスはホームフィードから除外（「積読」「今読んでる」「読み終わった」は表示）
- Uses `export const dynamic = "force-dynamic"` to fetch data at request time

### Infinite Scroll (HomeFeed)
- Initial display: 20 posts (`POSTS_PER_PAGE = 20`)
- Loads 20 more posts when scrolling to bottom (Intersection Observer with `rootMargin: '100px'`)
- Loading spinner (`.load-more-sentinel`) disappears when all posts are loaded
- All posts fetched server-side, progressive display on client

### Layout System: Split Screen Design
The site uses a **fixed sidebar + scrollable content** layout:
- **Sidebar** (`app/components/Sidebar.tsx`): Profile, navigation links (with color squares), stats - fixed on desktop, stacked on mobile
- **HomeSidebar** (`app/components/HomeSidebar.tsx`): Same as Sidebar but used on homepage with dynamic stats
- **Main Content**: Platform-specific content
- **CSS**: Split layout styles in `app/globals.css` (`.split-layout`, `.sidebar`, `.main-content`)

### Sidebar Navigation Order (Category-based)
```
開発:   GitHub
ブログ: Hatena → Zenn → Note → Hatena Bookmark
音楽:   SoundCloud → Spotify
読書:   Booklog
映画:   Filmarks
ゲーム: Tenhou → FF14 → Decks
```
Each navigation link has a colored square (10x10px) using CSS variables (`--color-{platform}`).

### Page Structure (Server Component + Client Wrapper)
Each platform page is a **Server Component** with metadata export and a Client wrapper for interactivity:
```tsx
// /app/[platform]/page.tsx (Server Component)
import { Metadata } from "next";
import Sidebar from "../components/Sidebar";
import PlatformClient from "./PlatformClient";

export const metadata: Metadata = {
    title: "Platform - Basecamp",
    description: "Platform description",
    openGraph: { title: "Platform - Basecamp", description: "..." },
};

export default function PlatformPage() {
    return (
        <div className="split-layout">
            <Sidebar activePlatform="[platform]" />
            <main className="main-content">
                <div className="content-wrapper">
                    <PlatformClient />
                </div>
            </main>
        </div>
    );
}
```

```tsx
// /app/[platform]/PlatformClient.tsx (Client Component)
"use client";
import FeedPosts from "../components/FeedPosts";

async function fetchPlatformPosts() {
    const response = await fetch("/api/platform");
    return response.ok ? response.json() : [];
}

export default function PlatformClient() {
    return <FeedPosts fetchPosts={fetchPlatformPosts} source="Platform" />;
}
```

**Why this pattern?** Functions cannot be passed from Server to Client components. Each platform has its own `*Client.tsx` that defines the fetch function inline.

### API Routes
All API routes follow `/app/api/[platform]/route.ts` pattern with ISR caching (6-hour):
- `/api/github` - Repository information via GitHub API
- `/api/hatena` - Hatena Blog posts via RSS (`rss-parser`)
- `/api/zenn` - Zenn articles via RSS (`rss-parser`)
- `/api/note` - Note articles via RSS (`rss-parser`)
- `/api/booklog` - Reading activity via RSS (`rss-parser`, `dc:date` for timestamps)
- `/api/tenhou` - Mahjong statistics via nodocchi.moe API
- `/api/ff14` - FF14 character information via Lodestone scraping (`cheerio`)
- `/api/ff14-achievements` - FF14 achievements via Lodestone scraping (`cheerio`, file cache)
- `/api/filmarks` - Movie/drama records via HTML scraping (`cheerio`)
- `/api/spotify` - Recently played tracks and playlist additions via Spotify Web API (OAuth required)
- `/api/hatenabookmark` - Hatena Bookmark entries via RSS (`rss-parser`, RDF format with `dc:date`)
- `/api/summaries` - AI-generated summaries from `/public/data/summaries.json`

### Type System
Types are defined in `app/lib/types.ts` with a hierarchical structure (Tenhou types are in `app/lib/tenhou-types.ts`):
- **`BasePost`**: Common fields (id, title, url, date, description)
- **Platform-specific types**: `GitHubPost`, `HatenaPost`, `ZennPost`, `NotePost`, `HatenaBookmarkPost`, `BooklogPost`, `FilmarksPost`, `SpotifyPost`, `FF14AchievementPost`
- **`PlatformPost`**: Union type of all platform posts
- **`Post`**: Legacy type for backward compatibility

### Key Components
- **`HomeSidebar`/`HomeFeed`**: Homepage components (HomeFeed has infinite scroll, thumbnails with placeholders)
- **`Sidebar`**: Server Component with shared navigation and active state highlighting (no `usePathname`)
- **`FeedPosts`**: Platform page feed display - card layout with thumbnails, infinite scroll, platform color dots
- **`*Client.tsx`**: Platform-specific client wrappers (GithubClient, HatenaClient, etc.) - contain fetch functions
- **`TenhouStats`**: Mahjong statistics with SVG graphs (dynamic import, ssr: false)

### FeedPosts Component (Platform Pages)
`FeedPosts.tsx` is used by all platform pages (GitHub, Hatena, Zenn, Note, Booklog, Filmarks) with unified card layout:
- 80x80px thumbnails with platform-colored placeholders
- Infinite scroll (20 posts per load, Intersection Observer)
- Platform color dots and hover borders
- Description display (2-line clamp)
- Stars/likes/language metadata display

### Configuration Files
- **`app/lib/config.ts`**: Site metadata and platform profile configurations
- **`next.config.ts`**: Image domains, security headers (CSP, HSTS), ESLint settings
- **`app/globals.css`**: CSS custom properties for platform colors and layout

## CSS Variables and Theming

### Platform Colors
```css
--color-hatena: #f03;
--color-zenn: #0ea5e9;
--color-note: #41c9b4;
--color-github: #333;
--color-soundcloud: #f50;
--color-booklog: #b45309;
--color-tenhou: #16a34a;
--color-ff14: #3b82f6;
--color-decks: #a855f7;
--color-filmarks: #f7c600;
--color-spotify: #1DB954;
--color-hatenabookmark: #00A4DE;
--color-ff14-achievement: #3b82f6;
```

Feed items have platform-specific hover borders (`.platform-hatena:hover`, etc.).

### Dark Mode Support
Dark mode is implemented via `prefers-color-scheme: dark` media query in `globals.css`:
```css
@media (prefers-color-scheme: dark) {
    :root {
        --color-text: #FFFFFF;
        --color-background: #1a1a1a;
        --color-background-hover: #2a2a2a;
        --color-background-muted: #333333;
        --color-border: #444444;
        --color-github: #f0f0f0;  /* Adjusted for dark mode */
    }
}
```

### Accessibility: prefers-reduced-motion
Loading spinners respect user motion preferences:
```css
@media (prefers-reduced-motion: reduce) {
    .loading-spinner {
        animation: none;
        opacity: 0.6;
    }
}
```

### Featured Feed Items
Note, Zenn, Hatena, Filmarks, Spotify, FF14 Achievements, Tenhou, and Booklog (読み終わった only) posts are visually emphasized:
- `.feed-item-featured` class applies 4px left border + subtle shadow + gradient background
- Logic in `HomeFeed.tsx`: `isFeatured()` function determines which posts get the style
- Booklog posts are only featured when `description === '読み終わった'`

### Booklog Filtering in HomeFeed
ホームフィード（`app/page.tsx`）では、Booklogの「読みたい」ステータスをフィルタリング:
```typescript
...booklogRes
    .filter((p: Post) => p.description !== "読みたい")
    .map((p: Post) => ({ ...p, platform: "booklog" })),
```
- `/booklog` ページは全ステータスを表示（フィルタリングなし）
- 「積読」「今読んでる」「読み終わった」はホームフィードに表示される

## Environment Variables (Optional)
```bash
GEMINI_API_KEY=...       # AI summary generation
GITHUB_TOKEN=...         # Enhanced GitHub API access
GOOGLE_SITE_VERIFICATION=...  # SEO
NEXT_PUBLIC_BASE_URL=... # Base URL for server-side API fetches

# Spotify (OAuth required - see Spotify統合セクション)
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
SPOTIFY_REFRESH_TOKEN=...
SPOTIFY_PLAYLIST_ID=...  # Optional: specific playlist to track

# Supabase (for microblog/auth features)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Critical Patterns

### Error Handling
- API routes return empty arrays `[]` on error to prevent `map()` failures
- External service failures gracefully degrade to empty states

### TypeScript: null vs undefined
External APIs often return `string | null` but types expect `string | undefined`:
```typescript
language: repo.language ?? undefined,  // Convert null to undefined
```
**AWS Amplify builds are stricter** - always test with `npm run build` locally.

### Dynamic Imports
Heavy components use dynamic imports with `ssr: false`:
```typescript
const TenhouStats = dynamic(() => import("@/app/components/TenhouStats"), {
    ssr: false,
    loading: () => <div>Loading...</div>
});
```

### Server vs Client Components
- Server components: Data fetching, no interactivity needed
- Client components: Relative time display, user interactions, browser APIs
- Use `"use client"` directive only when necessary

### RSS Thumbnail Extraction
Each platform uses different RSS fields for thumbnails:
- **Hatena**: `hatena:imageurl` or extract from `content:encoded` HTML
- **Zenn**: `enclosure.url` (not `media:content`)
- **Note**: `media:thumbnail` (rss-parserでは`[object Object]`キーにURLが格納される問題あり)
- **Booklog**: Extract `<img src="...">` from `description` HTML (RDF形式のため`description`をcustomFieldsに明示的に追加必要)
- **Hatena Bookmark**: Extract from `content:encoded` HTML (entry-imageクラスを優先、ファビコン除外)

When adding RSS parsing, check the actual feed structure first. Use `rss-parser` with `customFields` for non-standard fields like `dc:date`. RDF形式のRSSでは標準フィールド（`description`等）もcustomFieldsに追加が必要な場合がある。

### Hatena Bookmark統合
はてなブックマークはRSS 1.0（RDF形式）でブックマーク履歴を取得:
- **RSS URL**: `https://b.hatena.ne.jp/{username}/rss`
- **カスタムフィールド**: `dc:date`（ブックマーク日時）、`hatena:bookmarkcount`（総ブックマーク数）、`content:encoded`
- **サムネイル**: `content:encoded`内の`entry-image`クラスimg要素から抽出
- ブックマーク数は`likes`フィールドとして表示

### Booklog読書ステータス取得
BooklogのRSSには読書ステータス（積読、読みたい等）が含まれていない。また`dc:creator`フィールドはユーザー名であり、本の著者ではない。

読書ステータスは各書籍の個別ページからスクレイピングして取得:
```typescript
// <span class="status">読みたい</span> を抽出
const match = html.match(/<span class="status">([^<]+)<\/span>/);
```
`Promise.all()`で並列フェッチを行い、パフォーマンスを最適化。

### Tenhou統計データ取得
天鳳の統計データは**nodocchi.moe API**から自動取得:
```
https://nodocchi.moe/api/listuser.php?name={username}
```

APIレスポンスから以下を計算:
- レーティング・段位（直接取得）
- 対戦数・順位分布（ゲーム履歴から集計）
- 平均順位・連勝連敗（履歴から計算）
- **recentMatches**: 最近の対局履歴（ホームフィードに表示）

**ホームフィード表示形式**:
- タイトル: 「1位」「2位」「3位」「4位」
- 説明: 「四般東喰赤 +1250点」（ルームタイプとスコア）
- プラットフォームカラー: 緑（#16a34a）

**取得不可**（牌譜解析が必要）: 和了率、放銃率、立直率、副露率

1時間のISRキャッシュ、失敗時はローカルキャッシュ→ハードコーデッドデータにフォールバック。

### Filmarks視聴記録取得
FilmarksにはRSSがないため、**Cheerioを使用したHTMLスクレイピング**で取得:
- 映画: `https://filmarks.com/users/{username}/marks`
- ドラマ: `https://filmarks.com/users/{username}/marks/dramas`
- アニメ: `https://filmarks.com/users/{username}/marks/animes`

HTMLセレクター:
- カード: `div.c-content-card`
- タイトル: `h3.c-content-card__title a`
- サムネイル: `a.c-content__jacket img`
- 評価: `div.c-rating__score`

映画・ドラマ・アニメを`Promise.all()`で並列取得。`contentType`フィールドで`"movie" | "drama" | "anime"`を区別。

**マーク日時の取得**: 一覧ページには日付がないが、個別の映画/ドラマ/アニメページに`mark_id`パラメータ付きでアクセスすると、そのユーザーのマーク日時が表示される。`fetchMarkDate()`で各ページをスクレイピングして実際のマーク日時を取得（形式: `2024/09/28 11:08`）。

**日付抽出失敗時のフォールバック**: 正規表現でマーク日時が取得できない場合、`"1970-01-01T00:00:00.000Z"`をフォールバック値として使用。これにより日付取得失敗エントリはソート時に末尾に配置される（現在時刻を使うと最上部に表示されてしまう問題を回避）。

**Filmarksページの高評価セクション**: ★4.5以上の作品を映画・ドラマ・アニメ別に表示。評価（降順）→日付（降順）でソート。

### API最適化パターン
FilmarksとBooklog APIは外部サイトへの複数リクエストが必要なため、以下の最適化を実装:
- **タイムアウト**: Filmarks 10秒、Booklog 5秒（`AbortController`使用）
- **並列度制限**: 同時5件まで（バッチ処理）
- **ファイルキャッシュ**: mark日時・読書ステータスをJSONファイルにキャッシュ（30日有効）

```typescript
const FETCH_TIMEOUT = 10000; // Filmarks（人気作品の大きなページに対応）
const BATCH_SIZE = 5;

// バッチ処理で並列度を制限
for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(...));
}
```

### Filmarks/Booklog/FF14 Achievements キャッシュシステム
外部サイトへの大量リクエストを削減するため、ファイルベースのキャッシュを実装:
- **キャッシュファイル**: `public/data/filmarks-cache.json`, `public/data/booklog-cache.json`, `public/data/ff14-achievements-cache.json`
- **キャッシュユーティリティ**: `app/lib/cache-utils.ts`
- **動作**: 新規エントリのみ外部fetchし、既存はキャッシュから読み込み
- **有効期限**: Filmarks/Booklog 30日、FF14 Achievements 1日（`isCacheValid()`で検証）

```typescript
// キャッシュ構造
interface FilmarksCache {
  [url: string]: { date: string; title: string; cachedAt: string; }
}
interface BooklogCache {
  [bookUrl: string]: { status: string; cachedAt: string; }
}
interface FF14AchievementsCache {
  [url: string]: { date: string; title: string; cachedAt: string; }
}
```

**パフォーマンス改善**:
- Filmarks: 25-35秒 → 0.03秒（キャッシュヒット時）
- Booklog: 10-15秒 → 0.25秒（キャッシュヒット時）

キャッシュファイルはgitにコミットして、デプロイ時から即座に高速化。

### Spotify統合
Spotify Web APIを使用して最近再生した曲とプレイリスト追加曲を取得:
- **認証**: OAuth 2.0 Authorization Code Flow（リフレッシュトークン方式）
- **トークン管理**: `app/lib/spotify-auth.ts` でアクセストークンをインメモリキャッシュ（1時間有効）
- **エンドポイント**:
  - `GET /me/player/recently-played` - 最近再生した曲（50件、重複除去）
  - `GET /playlists/{id}/tracks` - プレイリスト追加曲

**セットアップ手順**:
1. https://developer.spotify.com/dashboard でアプリ作成
2. OAuth認証でリフレッシュトークン取得（scope: `user-read-recently-played playlist-read-private`）
3. 環境変数に`SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN`を設定

**注意**: 2025年1月現在、Spotify Developer Portalで新規アプリ作成が一時停止中の場合あり。

### FF14 Lodestoneスクレイピング
FF14のキャラクター情報はLodestoneを直接スクレイピングして取得:
- **キャラクターページ**: `https://jp.finalfantasyxiv.com/lodestone/character/{characterId}/`
- **ジョブページ**: `https://jp.finalfantasyxiv.com/lodestone/character/{characterId}/class_job/`

取得データ:
- キャラクター名、サーバー、種族/部族/性別
- アバター・ポートレート画像URL
- FC（フリーカンパニー）情報
- 全ジョブのレベル・経験値（7ロール: タンク、ヒーラー、近接DPS、遠隔物理DPS、遠隔魔法DPS、クラフター、ギャザラー）

HTMLセレクター:
- キャラクター名: `.frame__chara__name`
- サーバー: `.frame__chara__world`
- 種族/部族: `.character-block__name`（種族/部族/性別セクション内）
- ジョブリスト: `ul.character__job li`
- ジョブレベル: `.character__job__level`
- ジョブ名: `.character__job__name` (data-tooltip属性)

**注意**: ジョブ名は英語で返されるため、`JOB_NAME_MAP`で日本語に変換。ロール名も同様に`ROLE_NAME_MAP`で変換。

### FF14 Achievementsスクレイピング
FF14のアチーブメント情報はLodestoneのアチーブメントページからスクレイピング:
- **アチーブメントページ**: `https://jp.finalfantasyxiv.com/lodestone/character/{characterId}/achievement/`
- **ページネーション対応**: 次ページリンク（`.btn__pager__next`）を辿って全ページ取得（最大10ページ）
- **専用ページ**: `/ff14-achievements` でアチーブメント一覧を表示
- **ホームフィード統合**: 他のプラットフォームと時系列で混在表示

HTMLセレクター:
- アチーブメントアイテム: `.entry__achievement`
- アチーブメント名: `.entry__activity__txt`
- 詳細リンク: `a[href*='/achievement/detail/']`
- アイコン: `img`

**日時取得**: Lodestoneは日時をJavaScriptで動的に表示するため、`ldst_strftime(UNIX_TIMESTAMP, 'YMD')`呼び出しからUnixタイムスタンプを正規表現で抽出:
```typescript
const timestampMatch = itemHtml.match(/ldst_strftime\((\d+),/);
const date = new Date(parseInt(timestampMatch[1]) * 1000).toISOString();
```

### Image最適化
`next/image`を使用して画像を最適化:
- **対象**: HomeFeed、FeedPosts、Filmarksページ
- **HTTP→HTTPS変換**: API routes内でHTTP画像URLをHTTPSに自動変換（mixed content回避）
- **サイズ**: フィードは80x80、Filmarks高評価は120x180
```tsx
<Image
    src={src}
    alt={post.title}
    width={80}
    height={80}
    style={{ objectFit: "cover" }}
/>
```

API側でのHTTPS変換例（`app/api/booklog/route.ts`, `app/api/filmarks/route.ts`）:
```typescript
return imgUrl ? imgUrl.replace(/^http:/, "https:") : undefined;
```

## Deployment
- **Hosting**: AWS Amplify (auto-deploys on push to main, ~2-3 min build time)
- **Domain**: satory074.com
- Security headers configured in `next.config.ts`
- To verify deployment: add `?v=freshN` query param to bust cache

### AWS Amplify注意点
- `force-dynamic`を使用（ISRはビルド時にlocalhostへのAPI呼び出しが失敗するため）
- ビルド前に必ず`npm run build`でローカル検証

## Technology Stack
- **Next.js 16.1.3** (App Router, Turbopack, React 19.2)
- **TypeScript 5** (strict mode)
- **Tailwind CSS 3.4**
- **Key libs**: cheerio, rss-parser, date-fns, zod, next/image
