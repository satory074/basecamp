# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Basecamp is a personal homepage/portfolio website built with Next.js 15 (App Router) and TypeScript. It aggregates content from multiple platforms including GitHub, Hatena Blog, Zenn, SoundCloud, Booklog, Tenhou, FF14, and includes a Supabase-powered microblog system.

## Development Commands

```bash
# Development
npm run dev              # Start development server (http://localhost:3000)

# Build & Production  
npm run build            # Production build (linting disabled with --no-lint)
npm run start            # Start production server

# Code Quality
npm run lint             # Run Next.js linter (checks app/ directory only)

# AI Summary Generation
npm run generate-summaries  # Generate summaries for blog posts (requires GEMINI_API_KEY env var)

# Database & Auth Management (require .env.local with proper keys)
npm run create-admin     # Create admin user in Supabase using tsx
npm run check-supabase   # Check Supabase connection and configuration using tsx  
npm run test-auth        # Test authentication flow using tsx
```

## Architecture Overview

### Multi-Platform Content Integration
The app fetches and displays content from:
- **GitHub**: Repository information via GitHub API
- **Hatena Blog**: Japanese blogging platform posts via RSS
- **Zenn**: Japanese tech article platform via RSS
- **SoundCloud**: Music player widget integration
- **Booklog**: Reading activity from Booklog API
- **Tenhou**: Mahjong game statistics with real-time updates
- **FF14**: Final Fantasy XIV character information
- **Microblog**: Personal microblogging system with Supabase backend

### API Routes with Caching
- `/api/github`: Fetches GitHub repos (1-hour cache)
- `/api/hatena`: Fetches Hatena blog posts
- `/api/zenn`: Fetches Zenn articles
- `/api/summaries`: Serves AI-generated summaries from `/public/data/summaries.json`
- `/api/booklog`: Fetches reading activity from Booklog
- `/api/tenhou`: Fetches mahjong game statistics
- `/api/tenhou/realtime`: Real-time Tenhou data updates
- `/api/ff14`: FF14 character information
- `/api/microblog`: CRUD operations for microblog posts (authenticated)

### AI Summary Generation
- Uses Google Gemini API to generate Japanese summaries for Hatena and Zenn posts
- Custom URL schema for post identification (e.g., `hatenablog://entry/123`, `zenn://articles/article-id`)
- Summaries stored in `/public/data/summaries.json` for fast retrieval
- Rate-limited API calls with 1-second delays between requests

### Component Architecture  
- **Base Widget System**: All widgets extend `BaseWidget` component with consistent props (title, icon, link, username, children)
- **Icon Library**: Custom icon components in `app/components/icons/` with centralized exports via `index.tsx`
- **Page Structure**: Each platform has dedicated pages (`/github`, `/hatena`, `/zenn`, etc.) and corresponding API routes
- **Server/Client Components**: Optimized for Next.js 15 App Router with proper component separation

### Database & Authentication
- **Supabase**: Backend for microblog posts, user authentication, and real-time features
- **TypeScript Types**: Full type safety with `Database`, `MicroblogPost`, and `Tag` interfaces in `app/lib/supabase.ts`
- **Row Level Security (RLS)**: Enabled for secure data access
- **Authentication**: OAuth providers configured via Supabase Auth with callback handling

## Key Configuration Files

- **Main Config**: `app/lib/config.ts` contains site metadata and all platform profile configurations
- **Next.js Config**: `next.config.ts` includes ESLint settings, image optimization, and remote domain patterns for all integrated platforms
- **TypeScript**: Strict mode enabled with path alias `@/*` mapping to root directory

## Environment Variables

Required environment variables for full functionality:
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: For admin operations
- `GEMINI_API_KEY`: For AI summary generation
- Platform-specific API keys for external services

## Development Notes

- **ESLint Configuration**: Only runs on `app/` directory, warnings don't fail builds (`ignoreDuringBuilds: true`)
- **Script Execution**: Database/auth scripts use `tsx` for TypeScript execution
- **Image Optimization**: Configured for multiple external domains with SVG support and security policies
- **Documentation**: Comprehensive Japanese documentation available in `/docs/` directory
- **File Organization**: Recent cleanup consolidated duplicate config files and moved platform-specific docs to `/docs/`

## Important File Patterns

- **API Routes**: Follow `/api/[platform]/route.ts` pattern with optional nested routes for specific features
- **Components**: Platform widgets in `/components/widgets/`, icons in `/components/icons/`, general components in `/components/`
- **Pages**: Platform-specific pages follow `/[platform]/page.tsx` pattern
- **Scripts**: Database and utility scripts in `/scripts/` directory, executed with `npm run [script-name]`