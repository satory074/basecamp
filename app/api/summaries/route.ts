import { NextResponse, NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import { rateLimit } from '../../lib/rate-limit';
import { ApiError, createErrorResponse } from '../../lib/api-errors';

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
    const dataDirectory = path.join(process.cwd(), 'public', 'data');
    const filePath = path.join(dataDirectory, 'summaries.json');

    // Check if the summaries file exists
    if (!fs.existsSync(filePath)) {
      throw new ApiError(
        'Summaries file not found. Please run "npm run generate-summaries" first.',
        404,
        'SUMMARIES_NOT_FOUND'
      );
    }

    // Read the summaries file
    const fileContents = fs.readFileSync(filePath, 'utf8');
    let summaries;
    try {
      summaries = JSON.parse(fileContents);
    } catch {
      throw new ApiError(
        'Invalid summaries file format',
        500,
        'INVALID_JSON'
      );
    }

    const jsonResponse = NextResponse.json(summaries);
    jsonResponse.headers.set('X-RateLimit-Limit', '100');
    jsonResponse.headers.set('X-RateLimit-Remaining', remaining.toString());
    return jsonResponse;
  } catch (error) {
    return createErrorResponse(error, 'Failed to fetch summaries');
  }
}
