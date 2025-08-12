# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Basecamp is a personal homepage/portfolio website built with Next.js 15 (App Router) and TypeScript. It aggregates content from multiple platforms including GitHub, Hatena Blog, Zenn, and SoundCloud into a unified feed.

## Development Commands

```bash
# Development
npm run dev              # Start development server (http://localhost:3000)

# Build & Production
npm run build            # Production build (linting disabled with --no-lint)
npm run start            # Start production server

# Linting
npm run lint             # Run Next.js linter (checks app/ directory only)

# Generate AI Summaries
npm run generate-summaries  # Generate summaries for blog posts (requires GEMINI_API_KEY env var)

# Database & Auth Scripts (require .env.local with proper keys)
npm run create-admin     # Create admin user in Supabase
npm run check-supabase   # Check Supabase connection and configuration
npm run test-auth        # Test authentication flow
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
- Uses Google Gemini API to generate Japanese summaries
- Custom URL schema for post identification (e.g., `hatenablog://entry/123`)
- Summaries stored in JSON format for fast retrieval

### Component Architecture
- **Base Widget System**: Reusable widget components extending `BaseWidget`
- **Icon Library**: Custom icon components in `app/components/icons/`
- **Server/Client Components**: Optimized for Next.js 15 performance
- **Unified Feed**: Combines all platform content with expandable summaries

### Styling & Accessibility
- Tailwind CSS for styling
- Japanese font support (Noto Sans JP)
- Based on Japan Digital Agency's accessibility best practices
- Responsive design with dark mode support

## Key Configuration

Main configuration is in `app/lib/config.ts`:
- Site metadata (title, description)
- Platform profiles (usernames, URLs)
- API endpoints

## Database & Authentication

- **Supabase**: Backend database for microblog posts and user authentication
- **Row Level Security (RLS)**: Enabled for secure data access
- **Authentication**: OAuth providers configured via Supabase Auth
- **Database Tables**: `microblogs`, `tags` with proper TypeScript types in `app/lib/supabase.ts`

## Environment Variables

Required environment variables for full functionality:
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: For admin operations
- `GEMINI_API_KEY`: For AI summary generation
- Platform-specific API keys for external services

## Important Notes

- ESLint warnings won't fail builds (`ignoreDuringBuilds: true`)
- TypeScript strict mode is enabled
- Path alias: `@/*` maps to root directory
- Image optimization configured for multiple external domains in `next.config.mjs`
- The repository includes comprehensive Japanese documentation in `/docs/`