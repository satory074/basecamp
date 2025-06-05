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
```

## Architecture Overview

### Multi-Platform Content Integration
The app fetches and displays content from:
- **GitHub**: Repository information via GitHub API
- **Hatena Blog**: Japanese blogging platform posts via RSS
- **Zenn**: Japanese tech article platform via RSS
- **SoundCloud**: Music player widget integration

### API Routes with Caching
- `/api/github`: Fetches GitHub repos (1-hour cache)
- `/api/hatena`: Fetches Hatena blog posts
- `/api/zenn`: Fetches Zenn articles
- `/api/summaries`: Serves AI-generated summaries from `/public/data/summaries.json`

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

## Important Notes

- ESLint warnings won't fail builds (`ignoreDuringBuilds: true`)
- TypeScript strict mode is enabled
- Path alias: `@/*` maps to root directory
- The repository includes comprehensive Japanese documentation in `/docs/`