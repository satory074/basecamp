import { NextRequest } from 'next/server';

interface RateLimitEntry {
  count: number;
  firstRequest: number;
}

// Simple in-memory rate limiter
// For production, consider using Redis or similar
const rateLimitMap = new Map<string, RateLimitEntry>();

// Clean up old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  
  for (const [key, entry] of rateLimitMap.entries()) {
    if (entry.firstRequest < oneHourAgo) {
      rateLimitMap.delete(key);
    }
  }
}, 10 * 60 * 1000);

export interface RateLimitConfig {
  windowMs?: number;  // Time window in milliseconds (default: 1 hour)
  maxRequests?: number;  // Max requests per window (default: 100)
}

export function rateLimit(config: RateLimitConfig = {}) {
  const { windowMs = 60 * 60 * 1000, maxRequests = 100 } = config;

  return async (request: NextRequest): Promise<{ success: boolean; remaining: number }> => {
    // Get client identifier (IP address or fallback to user-agent)
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const identifier = ip !== 'unknown' ? ip : userAgent;

    const now = Date.now();
    const entry = rateLimitMap.get(identifier);

    if (!entry) {
      // First request from this client
      rateLimitMap.set(identifier, { count: 1, firstRequest: now });
      return { success: true, remaining: maxRequests - 1 };
    }

    // Check if window has expired
    if (now - entry.firstRequest > windowMs) {
      // Reset the window
      rateLimitMap.set(identifier, { count: 1, firstRequest: now });
      return { success: true, remaining: maxRequests - 1 };
    }

    // Increment count
    entry.count++;
    
    if (entry.count > maxRequests) {
      return { success: false, remaining: 0 };
    }

    return { success: true, remaining: maxRequests - entry.count };
  };
}