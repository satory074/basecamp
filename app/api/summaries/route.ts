import { NextResponse, NextRequest } from 'next/server';
import { rateLimit } from '../../lib/rate-limit';
import { createErrorResponse } from '../../lib/api-errors';
import { readFeedJson } from '../../lib/feed-storage';

/**
 * GET handler for fetching post summaries
 */
const limiter = rateLimit({ maxRequests: 100, windowMs: 60 * 60 * 1000 }); // 100 requests per hour

export async function GET(request: NextRequest) {
  // Apply rate limiting
  const { success, remaining } = await limiter(request);
  
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(Date.now() + 60 * 60 * 1000).toISOString()
        }
      }
    );
  }
  try {
    const summaries = await readFeedJson<unknown>('summaries.json');

    const jsonResponse = NextResponse.json(summaries);
    jsonResponse.headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=21600');
    jsonResponse.headers.set('X-RateLimit-Limit', '100');
    jsonResponse.headers.set('X-RateLimit-Remaining', remaining.toString());
    return jsonResponse;
  } catch (error) {
    return createErrorResponse(error, 'Failed to fetch summaries');
  }
}
