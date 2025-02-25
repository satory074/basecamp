import { NextResponse } from "next/server";
import { config } from "../../lib/config";
import type { Post } from "../../lib/types";

const GITHUB_API_URL = `https://api.github.com/users/${config.profiles.github.username}/repos?sort=updated&direction=desc`;

export async function GET() {
    try {
        const response = await fetch(GITHUB_API_URL, {
            headers: {
                Accept: "application/vnd.github.v3+json",
            },
            next: { revalidate: 3600 }, // 1時間キャッシュ
        });

        if (!response.ok) {
            throw new Error(`GitHub API returned ${response.status}`);
        }

        const data: unknown = await response.json();

        // GitHubレポジトリデータをPost型に変換
        const posts: Post[] = (data as any[]).map((repo: any) => ({
            id: repo.id.toString(),
            title: repo.name,
            url: repo.html_url,
            date: repo.pushed_at || repo.updated_at,
            platform: "github", // platformプロパティを追加
            collection: "github",
            data: {
                description: repo.description,
                stars: repo.stargazers_count,
                language: repo.language,
                updated_at: repo.updated_at,
            },
        }));

        return NextResponse.json(posts.slice(0, 5));
    } catch (error) {
        console.error("Failed to fetch GitHub repos:", error);
        return NextResponse.json({ error: "Failed to fetch repos" }, { status: 500 });
    }
}
