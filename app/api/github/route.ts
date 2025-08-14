import { NextResponse, NextRequest } from "next/server";
import { config } from "../../lib/config";
import type { Post } from "../../lib/types";
import type { GitHubRepository } from "../../lib/github-types";
import { rateLimit } from "../../lib/rate-limit";
import { ApiError } from "../../lib/api-errors";

export const revalidate = 3600; // ISR: 1時間ごとに再生成

const GITHUB_API_URL = `https://api.github.com/users/${config.profiles.github.username}/repos?sort=updated&direction=desc`;

const limiter = rateLimit({ maxRequests: 60, windowMs: 60 * 60 * 1000 }); // 60 requests per hour

export async function GET(request: NextRequest) {
    // Apply rate limiting
    const { success, remaining } = await limiter(request);
    
    if (!success) {
        return NextResponse.json(
            { error: "Too many requests. Please try again later." },
            { 
                status: 429,
                headers: {
                    'X-RateLimit-Limit': '60',
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': new Date(Date.now() + 60 * 60 * 1000).toISOString()
                }
            }
        );
    }
    try {
        const response = await fetch(GITHUB_API_URL, {
            headers: {
                Accept: "application/vnd.github.v3+json",
            },
            next: { revalidate: 3600 }, // 1時間キャッシュ
        });

        if (!response.ok) {
            throw new ApiError(
                `GitHub API returned ${response.status}`,
                response.status === 404 ? 404 : 502,
                'GITHUB_API_ERROR'
            );
        }

        const data = await response.json() as GitHubRepository[];

        // GitHubレポジトリデータをPost型に変換
        const posts: Post[] = data.map((repo) => ({
            id: repo.id.toString(),
            title: repo.name,
            url: repo.html_url,
            date: repo.pushed_at || repo.updated_at,
            platform: "github", // platformプロパティを追加
            collection: "github",
            description: repo.description ?? undefined,
            // 新しいフィールドを直接Post型に含める
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            language: repo.language ?? undefined,
            lastCommit: repo.pushed_at ?? undefined,
            // 後方互換性のためにdataフィールドも残す
            data: {
                description: repo.description ?? undefined,
                updated_at: repo.updated_at,
            },
        }));

        const jsonResponse = NextResponse.json(posts.slice(0, 5));
        jsonResponse.headers.set('X-RateLimit-Limit', '60');
        jsonResponse.headers.set('X-RateLimit-Remaining', remaining.toString());
        return jsonResponse;
    } catch (error) {
        console.error("GitHub API error:", error);
        // Return empty array instead of error object to prevent map() errors
        const jsonResponse = NextResponse.json([]);
        jsonResponse.headers.set('X-RateLimit-Limit', '60');
        jsonResponse.headers.set('X-RateLimit-Remaining', remaining.toString());
        return jsonResponse;
    }
}
