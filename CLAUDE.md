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
- `/api/tenhou/update`: Manual Tenhou data update
- `/api/tenhou/auto-update`: Automated Tenhou data updates
- `/api/ff14`: FF14 character information
- `/api/microblog`: CRUD operations for microblog posts (authenticated)
- `/api/microblog/[id]`: Individual post operations
- `/api/microblog/tags`: Tag management
- `/api/microblog/feed`: RSS feed generation

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
- **Components**: Platform widgets in `/app/components/widgets/`, icons in `/app/components/icons/`, general components in `/app/components/`
- **Pages**: Platform-specific pages follow `/[platform]/page.tsx` pattern
- **Scripts**: Database and utility scripts in `/scripts/` directory, executed with `npm run [script-name]`

## Data Flow Architecture

- **RSS/API Fetching**: External platform data is fetched server-side in API routes and cached
- **AI Processing**: Gemini API processes blog content to generate summaries stored as static JSON
- **Authentication Flow**: Supabase handles OAuth providers → callback handling → session management
- **Real-time Updates**: Tenhou statistics use both polling and WebSocket-like updates for live data
- **Static Generation**: Next.js ISR used for platform pages with revalidation strategies

## Core Technology Stack

### **Dependencies:**
- **Next.js 15.1.7** with App Router (React 19)
- **TypeScript 5** with strict mode
- **Tailwind CSS 3.4** for styling
- **Supabase** (`@supabase/supabase-js ^2.50.2`) for database and auth

### **Key Libraries:**
- **Content Processing**: `cheerio`, `rss-parser`, `fast-xml-parser`, `@ascorbic/feed-loader`
- **UI Components**: `@heroicons/react`, `@fortawesome/*`, `react-hot-toast`
- **Markdown**: `react-markdown`, `react-syntax-highlighter`
- **Data Validation**: `zod`
- **HTTP Client**: `axios`
- **Date Handling**: `date-fns`

## Critical Architecture Patterns

### **Error Handling Strategy**
- API routes return consistent error structures with proper HTTP status codes
- Client-side error boundaries handle React component errors
- Fallback UI patterns for external service failures
- Rate limiting with 60 requests/hour default for external APIs

### **Performance Optimization**
- **ISR Caching**: 1-hour revalidation for external content (GitHub, RSS feeds)
- **Image Optimization**: Configured for multiple external domains in `next.config.ts`
- **Dynamic Imports**: Strategic code splitting for large components
- **Static Generation**: Pre-rendered pages with fallback for dynamic content

### **Type Safety Patterns**
- **Database Types**: Complete Supabase database types in `app/lib/supabase.ts`
- **API Response Types**: Consistent typing for all external service responses  
- **Config Types**: Centralized type definitions in `app/lib/config.ts`
- **Component Props**: Strict typing for all component interfaces

### **External Service Integration**
All platform integrations follow consistent patterns:
```typescript
// API Route Pattern: /app/api/[platform]/route.ts
export async function GET() {
  try {
    // Rate limiting check
    // External API call with error handling
    // Data transformation and validation
    // Return with proper caching headers
  } catch (error) {
    // Consistent error response format
  }
}
```

## Development Environment Setup

### **Required Environment Variables:**
```bash
# Supabase (required for microblog features)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI Features (optional)
GEMINI_API_KEY=

# External Service APIs (optional - fallback data available)
GITHUB_TOKEN=
BOOKLOG_API_KEY=
```

### **Build & Deployment Configuration**
- **ESLint**: Configured to ignore warnings during builds (`ignoreDuringBuilds: true`)
- **TypeScript**: ES2017 target for broad compatibility  
- **Build Command**: `npm run build` (includes `--no-lint` flag)
- **Image Domains**: Pre-configured for all external platform assets

## Troubleshooting Common Issues

### **TypeScript Errors**
- Scripts in `/scripts/` may need non-null assertions (`!`) for environment variables after validation
- `useSearchParams()` requires Suspense boundary in App Router pages
- External API responses should be validated with Zod schemas

### **Build Failures**
- Check that all required external domains are configured in `next.config.ts`
- Ensure environment variables are available during build (Supabase keys)
- Verify that external API endpoints are accessible (some may fail in build environment)

### **Performance Issues**
- Large external content may need pagination (implemented for most APIs)
- Image optimization requires proper domain configuration
- Real-time features (Tenhou) use polling, not true WebSockets

## Key Architectural Decisions

1. **App Router Migration**: Fully migrated to Next.js 15 App Router pattern
2. **Server Components**: Strategic use for external data fetching and static content
3. **Client Components**: Used only when necessary (forms, interactive widgets, search params)
4. **CSS Strategy**: Tailwind-first with component-level styling
5. **Data Fetching**: Server-side in API routes with client-side consumption
6. **Authentication**: Supabase OAuth with development mode fallbacks
7. **Dynamic Supabase Clients**: Avoid static imports to prevent AWS Amplify build failures

## Supabase Integration Patterns

### **Critical: Dynamic Client Creation Strategy**
All Supabase client usage must follow dynamic creation patterns to prevent AWS Amplify build failures when environment variables are unavailable during build time.

#### **API Route Pattern:**
```typescript
// ❌ NEVER: Static client import (causes build failures)
import { supabase } from '@/app/lib/supabase'

// ✅ ALWAYS: Dynamic client creation with validation
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: 'Service temporarily unavailable' },
      { status: 503 }
    )
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  // ... use supabase client
}
```

#### **Client Component Pattern:**
```typescript
// Create helper function at top of file
function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return null
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}

// Use in component functions
const handleAction = async () => {
  const supabase = createSupabaseClient()
  
  if (!supabase) {
    toast.error('Service temporarily unavailable')
    return
  }
  
  // ... use supabase client
}
```

### **Authentication Development Patterns**
- **Development Mode**: Microblog features work without authentication for testing
- **Production Mode**: Requires valid Supabase OAuth or JWT tokens
- **Graceful Degradation**: Components show appropriate messages when auth unavailable

## AWS Amplify Deployment Critical Issues

### **Resolved Build Problems & Solutions**

#### **1. Supabase Environment Variable Build Failures**
- **Problem**: `supabaseUrl is required` during static generation
- **Root Cause**: Static imports execute during build when env vars unavailable
- **Solution**: Dynamic client creation pattern (see above)
- **Detection**: Build logs show errors in components importing Supabase clients

#### **2. useSearchParams Static Generation Issues**
- **Problem**: `useSearchParams() should be wrapped in a suspense boundary`
- **Solution**: Wrap components using search params in `<Suspense>` boundary
- **Example Implementation**:
```typescript
export default function MyPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ComponentUsingSearchParams />
    </Suspense>
  )
}
```

#### **3. Component Static Import Chain Issues**
- **Problem**: Any component imported by a page that uses static Supabase imports fails
- **Files Previously Affected**: AuthContext, MicroblogEditor, MicroblogTimeline, MicroblogPost, DebugAuth, OAuthLogin
- **Solution**: All converted to dynamic client creation pattern

### **Build Environment Considerations**
- **Node.js Compatibility**: Builds require Node 18.x+ for undici dependency
- **Environment Variables**: All `NEXT_PUBLIC_*` vars must be set in Amplify console
- **Linting**: Build uses `--no-lint` flag; warnings don't fail builds
- **TypeScript**: Strict mode enabled but warnings ignored during builds