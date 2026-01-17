# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Basecamp is a personal homepage/portfolio website built with Next.js 15 (App Router) and TypeScript. It aggregates content from 9 platforms (GitHub, Hatena Blog, Zenn, Note, SoundCloud, Booklog, Tenhou, FF14, Decks) into a unified personal showcase.

## Development Commands

```bash
npm run dev              # Start development server (http://localhost:3000)
npm run build            # Production build (--no-lint flag included)
npm run start            # Start production server
npm run lint             # Run Next.js linter (app/ directory only)
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
- **Unified Feed**: Aggregates posts from Hatena, Zenn, Note, and Booklog, sorted by date (newest first)
- Uses `export const dynamic = "force-dynamic"` to skip static generation

### Infinite Scroll (HomeFeed)
- Initial display: 20 posts (`POSTS_PER_PAGE = 20`)
- Loads 20 more posts when scrolling to bottom (Intersection Observer with `rootMargin: '100px'`)
- Loading spinner (`.load-more-sentinel`) disappears when all posts are loaded
- All posts fetched server-side, progressive display on client

### Layout System: Split Screen Design
The site uses a **fixed sidebar + scrollable content** layout:
- **Sidebar** (`app/components/Sidebar.tsx`): Profile, navigation links, stats - fixed on desktop, stacked on mobile
- **Main Content**: Platform-specific content
- **CSS**: Split layout styles in `app/globals.css` (`.split-layout`, `.sidebar`, `.main-content`)

### Page Structure
Each platform page follows the same pattern:
```tsx
// /app/[platform]/page.tsx
<div className="split-layout">
    <Sidebar activePlatform="[platform]" />
    <main className="main-content">
        <div className="content-wrapper">
            {/* Page title and platform-specific content */}
        </div>
    </main>
</div>
```

### API Routes
All API routes follow `/app/api/[platform]/route.ts` pattern with ISR caching (1-hour):
- `/api/github` - Repository information via GitHub API
- `/api/hatena` - Hatena Blog posts via RSS (`rss-parser`)
- `/api/zenn` - Zenn articles via RSS (`rss-parser`)
- `/api/note` - Note articles via RSS (`rss-parser`)
- `/api/booklog` - Reading activity via RSS (`rss-parser`, `dc:date` for timestamps)
- `/api/tenhou` - Mahjong statistics (+ `/realtime`, `/update`, `/auto-update`)
- `/api/ff14` - FF14 character information
- `/api/summaries` - AI-generated summaries from `/public/data/summaries.json`

### Type System
Types are defined in `app/lib/types.ts` with a hierarchical structure:
- **`BasePost`**: Common fields (id, title, url, date, description)
- **Platform-specific types**: `GitHubPost`, `HatenaPost`, `ZennPost`, `NotePost`, `BooklogPost`
- **`PlatformPost`**: Union type of all platform posts
- **`Post`**: Legacy type for backward compatibility

### Key Components
- **`HomeSidebar`/`HomeFeed`**: Homepage components (HomeFeed has infinite scroll, thumbnails with placeholders)
- **`Sidebar`**: Shared navigation with active state highlighting
- **`FeedPosts`**: Unified feed display with relative time formatting
- **`TenhouStats`**: Real-time mahjong statistics with SVG graphs (dynamic import, ssr: false)

### Configuration Files
- **`app/lib/config.ts`**: Site metadata and platform profile configurations
- **`next.config.ts`**: Image domains, security headers (CSP, HSTS), ESLint settings
- **`app/globals.css`**: CSS custom properties for platform colors and layout

## Platform Colors (CSS Variables)
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
```

Feed items have platform-specific hover borders (`.platform-hatena:hover`, etc.).

### Featured Feed Items
Note, Zenn, Hatena, and Booklog (読み終わった only) posts are visually emphasized:
- `.feed-item-featured` class applies 4px left border + subtle shadow + gradient background
- Logic in `HomeFeed.tsx`: `isFeatured()` function determines which posts get the style
- Booklog posts are only featured when `description === '読み終わった'`

## Environment Variables (Optional)
```bash
GEMINI_API_KEY=...       # AI summary generation
GITHUB_TOKEN=...         # Enhanced GitHub API access
GOOGLE_SITE_VERIFICATION=...  # SEO
NEXT_PUBLIC_BASE_URL=... # Base URL for server-side API fetches

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

When adding RSS parsing, check the actual feed structure first. Use `rss-parser` with `customFields` for non-standard fields like `dc:date`. RDF形式のRSSでは標準フィールド（`description`等）もcustomFieldsに追加が必要な場合がある。

### Booklog読書ステータス取得
BooklogのRSSには読書ステータス（積読、読みたい等）が含まれていない。また`dc:creator`フィールドはユーザー名であり、本の著者ではない。

読書ステータスは各書籍の個別ページからスクレイピングして取得:
```typescript
// <span class="status">読みたい</span> を抽出
const match = html.match(/<span class="status">([^<]+)<\/span>/);
```
`Promise.all()`で並列フェッチを行い、パフォーマンスを最適化。

## Deployment
- **Hosting**: AWS Amplify (auto-deploys on push to main, ~2-3 min build time)
- **Domain**: satory074.com
- **Build**: ESLint warnings don't fail builds (`ignoreDuringBuilds: true`)
- Security headers configured in `next.config.ts`
- To verify deployment: add `?v=freshN` query param to bust cache

## Technology Stack
- **Next.js 15.1.7** (App Router, React 19)
- **TypeScript 5** (strict mode)
- **Tailwind CSS 3.4**
- **Key libs**: cheerio, rss-parser, date-fns, zod, axios
