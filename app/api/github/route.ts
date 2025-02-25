import { NextResponse } from "next/server";
import { config } from "../../lib/config";
import type { Post } from "../../lib/types";

export async function GET() {
    const username = config.profiles.github.username;
    try {
        const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=5`);
        if (!response.ok) {
            throw new Error("Failed to fetch GitHub repositories: " + response.status);
        }
        const repositories = await response.json();

        // GitHubレポジトリデータをPost型に変換
        const posts: Post[] = repositories.map((repo: any) => ({
            id: repo.id.toString(),
            title: repo.name,
            url: repo.html_url,
            date: repo.updated_at, // ISO形式の日付文字列
            collection: "github",
            data: {
                description: repo.description,
                stars: repo.stargazers_count,
                language: repo.language,
                updated_at: repo.updated_at,
            },
        }));

        return NextResponse.json(posts);
    } catch (error) {
        console.error("Failed to fetch GitHub activity:", error);
        return NextResponse.json({ error: "Failed to fetch GitHub activity" }, { status: 500 });
    }
}
