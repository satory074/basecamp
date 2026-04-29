/**
 * Apps Feed 更新スクリプト
 *
 * GitHub topic "featured-app" が付いた repo を列挙し、各 repo の `homepage` URL から
 * og:image を取得してローカルにダウンロード、`public/data/apps.json` に書き出す。
 *
 * GitHub Actions から日次で実行される想定。
 *
 * 運用ルール: 公開したいアプリの GitHub repo に `featured-app` topic を追加すること。
 *   gh repo edit satory074/<repo> --add-topic featured-app
 *
 * 必要な環境変数:
 *   GITHUB_TOKEN         - GitHub API access (Public repos のみなら不要だが rate limit 緩和のため推奨)
 *   DISCORD_WEBHOOK_URL  - Discord通知用（オプション）
 */

import * as fs from "fs";
import * as path from "path";
import * as cheerio from "cheerio";
import sharp from "sharp";

import { notifyIfNoteworthy } from "./lib/discord-notification";

const GITHUB_USERNAME = "satory074";
const FEATURED_TOPIC = "featured-app";
const JSON_PATH = path.join(process.cwd(), "public/data/apps.json");
const IMAGES_DIR = path.join(process.cwd(), "public/images/apps");
const PLACEHOLDER_PATH = "/images/apps/placeholder.svg";
const FETCH_TIMEOUT = 15000;

interface GitHubRepo {
    name: string;
    full_name: string;
    description: string | null;
    homepage: string | null;
    html_url: string;
    topics: string[];
    stargazers_count: number;
    created_at: string;
    pushed_at: string;
    archived: boolean;
}

interface AppEntry {
    id: string;
    name: string;
    description?: string;
    url: string;
    repoUrl: string;
    tags: string[];
    thumbnailPath: string;
    hasOgImage: boolean;
    createdAt: string;
    stars?: number;
}

interface AppsFile {
    lastUpdated: string;
    apps: AppEntry[];
}

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}

async function fetchFeaturedRepos(): Promise<GitHubRepo[]> {
    const headers: Record<string, string> = {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    };
    if (process.env.GITHUB_TOKEN) {
        headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const url = `https://api.github.com/search/repositories?q=user:${GITHUB_USERNAME}+topic:${FEATURED_TOPIC}&per_page=100`;
    const res = await fetchWithTimeout(url, { headers });
    if (!res.ok) {
        throw new Error(`GitHub search failed: ${res.status} ${await res.text()}`);
    }
    const body = (await res.json()) as { items?: GitHubRepo[] };
    return (body.items ?? []).filter((r) => !r.archived);
}

async function extractOgImage(homepageUrl: string): Promise<string | null> {
    const res = await fetchWithTimeout(homepageUrl, {
        headers: { "User-Agent": "basecamp-apps-feed/1.0" },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const $ = cheerio.load(html);

    const candidates = [
        $('meta[property="og:image"]').attr("content"),
        $('meta[name="og:image"]').attr("content"),
        $('meta[name="twitter:image"]').attr("content"),
        $('meta[property="twitter:image"]').attr("content"),
    ];
    const found = candidates.find((c) => typeof c === "string" && c.length > 0);
    if (!found) return null;

    try {
        return new URL(found, homepageUrl).toString();
    } catch {
        return null;
    }
}

async function downloadAndOptimize(imageUrl: string, repoName: string): Promise<string | null> {
    try {
        const res = await fetchWithTimeout(imageUrl);
        if (!res.ok) return null;

        const buf = Buffer.from(await res.arrayBuffer());
        const outPath = path.join(IMAGES_DIR, `${repoName}.jpg`);

        await sharp(buf)
            .resize(1200, 630, { fit: "cover", position: "center" })
            .jpeg({ quality: 82, progressive: true })
            .toFile(outPath);

        return `/images/apps/${repoName}.jpg`;
    } catch (err) {
        console.warn(`Failed to download/process image for ${repoName}:`, err);
        return null;
    }
}

async function main() {
    if (!fs.existsSync(IMAGES_DIR)) {
        fs.mkdirSync(IMAGES_DIR, { recursive: true });
    }

    console.log(`Searching for repos tagged "${FEATURED_TOPIC}"...`);
    const repos = await fetchFeaturedRepos();
    console.log(`Found ${repos.length} featured repos`);

    const apps: AppEntry[] = [];
    const warnings: string[] = [];
    let ogImageMissing = 0;

    for (const repo of repos) {
        if (!repo.homepage) {
            warnings.push(`${repo.name}: no homepage URL set on the repo (skipped)`);
            continue;
        }

        console.log(`Processing ${repo.name} (${repo.homepage})`);
        let thumbnailPath = PLACEHOLDER_PATH;
        let hasOgImage = false;

        const ogUrl = await extractOgImage(repo.homepage);
        if (ogUrl) {
            const downloaded = await downloadAndOptimize(ogUrl, repo.name);
            if (downloaded) {
                thumbnailPath = downloaded;
                hasOgImage = true;
            } else {
                warnings.push(`${repo.name}: og:image found but failed to process`);
                ogImageMissing++;
            }
        } else {
            warnings.push(`${repo.name}: no og:image meta tag (using placeholder)`);
            ogImageMissing++;
        }

        apps.push({
            id: repo.name,
            name: repo.name,
            description: repo.description ?? undefined,
            url: repo.homepage,
            repoUrl: repo.html_url,
            tags: (repo.topics ?? []).filter((t) => t !== FEATURED_TOPIC),
            thumbnailPath,
            hasOgImage,
            createdAt: repo.created_at,
            stars: repo.stargazers_count,
        });
    }

    // Sort by created_at descending (newest first)
    apps.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const output: AppsFile = {
        lastUpdated: new Date().toISOString(),
        apps,
    };

    fs.writeFileSync(JSON_PATH, JSON.stringify(output, null, 2) + "\n");
    console.log(`Saved ${apps.length} apps to ${JSON_PATH}`);
    if (warnings.length > 0) {
        console.warn("Warnings:");
        for (const w of warnings) console.warn(`  - ${w}`);
    }

    const status = ogImageMissing > 0 ? "warning" : "success";
    await notifyIfNoteworthy({
        source: "Apps",
        status,
        newItems: apps.length,
        metrics: [
            { name: "Total Apps", value: apps.length },
            { name: "With og:image", value: apps.length - ogImageMissing },
            { name: "Placeholder", value: ogImageMissing },
        ],
        errors: warnings.length > 0 ? warnings : undefined,
    });
}

main().catch(async (error: unknown) => {
    console.error("Fatal error:", error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    await notifyIfNoteworthy({
        source: "Apps",
        status: "error",
        newItems: 0,
        errors: [`Fatal: ${errorMsg}`],
    }).catch(() => {});
    process.exit(1);
});
