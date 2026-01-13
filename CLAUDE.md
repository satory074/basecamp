# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Basecamp is a personal homepage/portfolio website built with Next.js 15 (App Router) and TypeScript. It aggregates content from 7 platforms (GitHub, Hatena Blog, Zenn, SoundCloud, Booklog, Tenhou, FF14) into a unified personal showcase.

## Development Commands

```bash
npm run dev              # Start development server (http://localhost:3000)
npm run build            # Production build (--no-lint flag included)
npm run start            # Start production server
npm run lint             # Run Next.js linter (app/ directory only)
npm run generate-summaries  # Generate AI summaries for blog posts (requires GEMINI_API_KEY)
```

## Architecture Overview

### Layout System: Split Screen Design
The site uses a **fixed sidebar + scrollable content** layout:
- **Sidebar** (`app/components/Sidebar.tsx`): Profile, navigation links, stats - fixed on desktop, stacked on mobile
- **Main Content**: Platform-specific content with infinite scroll
- **CSS**: Split layout styles defined in `app/globals.css` (`.split-layout`, `.sidebar`, `.main-content`)

### Page Structure
Each platform has a dedicated page following the same pattern:
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
All API routes follow `/app/api/[platform]/route.ts` pattern:
- `/api/github` - Repository information (1-hour cache)
- `/api/hatena` - Hatena Blog posts via RSS
- `/api/zenn` - Zenn articles via RSS
- `/api/booklog` - Reading activity
- `/api/tenhou` - Mahjong statistics (+ `/realtime`, `/update`, `/auto-update`)
- `/api/ff14` - FF14 character information
- `/api/summaries` - AI-generated summaries from `/public/data/summaries.json`

### Key Components
- **`Sidebar`**: Shared navigation component with active state highlighting
- **`FeedPosts`**: Unified feed display for all platforms with engagement metrics
- **`TenhouStats`**: Real-time mahjong statistics with SVG graphs
- **`FF14Character`**: Character information display
- **`AsyncWidgetWrapper`**: Suspense wrapper with error boundaries
- **`CardSkeleton`**: Loading state variants (post, widget, grid)

### Configuration
- **`app/lib/config.ts`**: Site metadata and platform profile configurations
- **`next.config.ts`**: Image domains, security headers (CSP, HSTS), ESLint settings
- **`app/globals.css`**: CSS custom properties for platform colors and layout

## Platform Colors (CSS Variables)
```css
--color-hatena: #f03;
--color-zenn: #0ea5e9;
--color-github: #333;
--color-soundcloud: #f50;
--color-booklog: #b45309;
--color-tenhou: #16a34a;
--color-ff14: #3b82f6;
```

## Environment Variables (Optional)
```bash
GEMINI_API_KEY=...       # AI summary generation
GITHUB_TOKEN=...         # Enhanced GitHub API access
BOOKLOG_API_KEY=...      # Booklog API access
GOOGLE_SITE_VERIFICATION=...  # SEO
```

## Critical Patterns

### Error Handling
- API routes return empty arrays `[]` on error to prevent `map()` failures
- `ErrorBoundary` component catches React errors globally
- External service failures gracefully degrade to empty states

### TypeScript: null vs undefined
External APIs often return `string | null` but Post type expects `string | undefined`:
```typescript
language: repo.language ?? undefined,  // Convert null to undefined
```
**AWS Amplify builds are stricter** - always test with `npm run build` locally.

### Dynamic Imports
Platform-specific components use dynamic imports with `ssr: false`:
```typescript
const TenhouStats = dynamic(() => import("@/app/components/TenhouStats"), {
    ssr: false,
    loading: () => <div>Loading...</div>
});
```

### Layout Guidelines
- Use `min-height` instead of fixed `height` for content adaptability
- Ensure `line-clamp` utilities exist in `globals.css` before using
- Test with varying content lengths for responsive design

## Deployment
- **Hosting**: AWS Amplify (auto-deploys on push to main)
- **Build**: ESLint warnings don't fail builds (`ignoreDuringBuilds: true`)
- Comprehensive security headers configured in `next.config.ts`

## Technology Stack
- **Next.js 15.1.7** (App Router, React 19)
- **TypeScript 5** (strict mode)
- **Tailwind CSS 3.4**
- **Key libs**: cheerio, rss-parser, date-fns, zod, axios, react-hot-toast
