import { config } from "../config";
import type { Post } from "../types";
import type { GitHubRepository } from "../github-types";
import { fetchWithTimeout } from "../fetch-with-timeout";

const GITHUB_API_URL = `https://api.github.com/users/${config.profiles.github.username}/repos?sort=updated&direction=desc`;

export async function getGithubPosts(): Promise<Post[]> {
    try {
        const headers: Record<string, string> = { Accept: "application/vnd.github.v3+json" };
        if (process.env.GITHUB_TOKEN) {
            headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
        }
        const response = await fetchWithTimeout(GITHUB_API_URL, { headers, timeoutMs: 10000 });
        if (!response.ok) return [];
        const data = (await response.json()) as GitHubRepository[];
        const posts: Post[] = data.map((repo) => ({
            id: repo.id.toString(),
            title: repo.name,
            url: repo.html_url,
            date: repo.pushed_at || repo.updated_at,
            platform: "github",
            collection: "github",
            description: repo.description ?? undefined,
            thumbnail: `https://opengraph.githubassets.com/1/${repo.full_name}`,
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            language: repo.language ?? undefined,
            lastCommit: repo.pushed_at ?? undefined,
            data: {
                description: repo.description ?? undefined,
                updated_at: repo.updated_at,
            },
        }));
        return posts.slice(0, 5);
    } catch {
        return [];
    }
}
