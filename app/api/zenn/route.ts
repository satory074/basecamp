import { NextResponse, NextRequest } from "next/server";
import Parser from "rss-parser";
import type { Post } from "../../lib/types";
import { rateLimit } from "../../lib/rate-limit";
import { ApiError, createErrorResponse } from "../../lib/api-errors";
import { stripHtmlTags, extractThumbnailFromContent } from "@/app/lib/shared/html-utils";
import { fetchWithTimeout } from "../../lib/fetch-with-timeout";

export const revalidate = 21600;

type CustomItem = {
  guid?: string;
  id?: string;
  title?: string;
  link?: string;
  pubDate?: string;
  description?: string;
  content?: string;
  "content:encoded"?: string;
  "media:content"?: {
    $: {
      url?: string;
    };
  };
  enclosure?: {
    url?: string;
  };
};

type FeedResult = {
  items: CustomItem[];
};

const parser = new Parser({
  customFields: {
    item: ["content:encoded", "media:content", ["enclosure", { keepArray: false }]],
  },
});

const ZENN_RSS_URL = "https://zenn.dev/satory074/feed";

const limiter = rateLimit({ maxRequests: 60, windowMs: 60 * 60 * 1000 });

export async function GET(request: NextRequest) {
  const { success, remaining } = await limiter(request);

  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": "60",
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        },
      }
    );
  }

  try {
    const response = await fetchWithTimeout(ZENN_RSS_URL, {
      next: { revalidate: 3600 },
      timeoutMs: 10000,
    });

    if (!response.ok) {
      throw new ApiError(`Failed to fetch Zenn RSS: ${response.status}`, 502, "ZENN_FETCH_ERROR");
    }

    const xml = await response.text();
    const result = await new Promise<FeedResult>((resolve, reject) => {
      parser.parseString(xml, (err, feed) => {
        if (err) {
          reject(new ApiError("Failed to parse Zenn RSS feed", 502, "RSS_PARSE_ERROR"));
          return;
        }
        resolve(feed as FeedResult);
      });
    });

    const posts: Post[] = result.items.map((item) => {
      let thumbnail: string | undefined;
      if (item.enclosure?.url) {
        thumbnail = item.enclosure.url;
      } else if (item["media:content"]?.$?.url) {
        thumbnail = item["media:content"].$.url;
      } else {
        thumbnail = extractThumbnailFromContent(item["content:encoded"] || item.content);
      }

      const rawDescription = stripHtmlTags(item.description);
      const description = rawDescription
        ? rawDescription.substring(0, 200) + (rawDescription.length > 200 ? "..." : "")
        : "";

      return {
        id: item.guid || item.id || "",
        title: item.title || "",
        url: item.link || "",
        date: item.pubDate || new Date().toISOString(),
        platform: "zenn",
        description,
        thumbnail,
        collection: "zenn",
        data: {
          title: item.title,
          pubdate: item.pubDate,
          link: item.link,
          description,
          thumbnail,
        },
      };
    });

    const jsonResponse = NextResponse.json(posts);
    jsonResponse.headers.set("Cache-Control", "public, max-age=300, stale-while-revalidate=3600");
    jsonResponse.headers.set("X-RateLimit-Limit", "60");
    jsonResponse.headers.set("X-RateLimit-Remaining", remaining.toString());
    return jsonResponse;
  } catch (error) {
    const errorResponse = createErrorResponse(error, "Failed to fetch Zenn posts");
    errorResponse.headers.set("X-RateLimit-Limit", "60");
    errorResponse.headers.set("X-RateLimit-Remaining", remaining.toString());
    return errorResponse;
  }
}
