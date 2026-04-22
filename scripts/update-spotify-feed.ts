/**
 * Spotify 再生履歴フィード更新スクリプト
 *
 * Spotify API から最近再生した曲を取得し、
 * public/data/spotify-plays.json に差分マージする。
 *
 * GitHub Actions から定期実行される想定。
 *
 * 必要な環境変数:
 *   SPOTIFY_CLIENT_ID      - Spotify OAuth Client ID
 *   SPOTIFY_CLIENT_SECRET   - Spotify OAuth Client Secret
 *   SPOTIFY_REFRESH_TOKEN   - Spotify OAuth Refresh Token
 *   DISCORD_WEBHOOK_URL     - Discord通知用（オプション）
 */

import * as fs from "fs";
import * as path from "path";

import { notifyIfNoteworthy } from "./lib/discord-notification";

const JSON_PATH = path.join(process.cwd(), "public/data/spotify-plays.json");

const FETCH_TIMEOUT = 10000;

// ---- Types ----

interface SpotifyTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    scope: string;
}

interface SpotifyTrack {
    id: string;
    name: string;
    external_urls: { spotify: string };
    artists: Array<{ name: string }>;
    album: {
        name: string;
        images: Array<{ url: string; width: number; height: number }>;
    };
}

interface RecentlyPlayedItem {
    track: SpotifyTrack;
    played_at: string;
}

interface SpotifyPlayEntry {
    id: string;
    title: string;
    artist: string;
    albumName: string;
    url: string;
    thumbnail: string;
    date: string;
}

interface SpotifyPlaysFile {
    lastUpdated: string;
    plays: SpotifyPlayEntry[];
}

// ---- Helpers ----

function getEnvVar(name: string): string {
    const value = process.env[name];
    if (!value) throw new Error(`${name} is not set`);
    return value;
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

// ---- Spotify Auth ----

async function getAccessToken(): Promise<string> {
    const clientId = getEnvVar("SPOTIFY_CLIENT_ID");
    const clientSecret = getEnvVar("SPOTIFY_CLIENT_SECRET");
    const refreshToken = getEnvVar("SPOTIFY_REFRESH_TOKEN");

    const response = await fetchWithTimeout("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        },
        body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: refreshToken,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to refresh Spotify token: ${response.status} ${errorText}`);
    }

    const data = (await response.json()) as SpotifyTokenResponse;
    return data.access_token;
}

// ---- Spotify API ----

async function fetchRecentlyPlayed(accessToken: string): Promise<RecentlyPlayedItem[]> {
    const response = await fetchWithTimeout(
        "https://api.spotify.com/v1/me/player/recently-played?limit=50",
        {
            headers: { Authorization: `Bearer ${accessToken}` },
        }
    );

    if (!response.ok) {
        throw new Error(`Spotify recently played fetch failed: ${response.status}`);
    }

    const data = (await response.json()) as { items?: RecentlyPlayedItem[] };
    return data.items || [];
}

// ---- Load & Save ----

function loadExisting(): SpotifyPlaysFile {
    try {
        const content = fs.readFileSync(JSON_PATH, "utf-8");
        return JSON.parse(content) as SpotifyPlaysFile;
    } catch {
        return { lastUpdated: "", plays: [] };
    }
}

// ---- Main ----

async function main() {
    console.log("Getting Spotify access token...");
    const accessToken = await getAccessToken();

    console.log("Fetching recently played tracks...");
    const items = await fetchRecentlyPlayed(accessToken);
    console.log(`Fetched ${items.length} recently played tracks`);

    if (items.length === 0) {
        console.log("No recently played tracks, exiting");
        await notifyIfNoteworthy({
            source: "Spotify",
            status: "success",
            newItems: 0,
            metrics: [
                { name: "New Plays", value: 0 },
                { name: "Total Plays", value: loadExisting().plays.length },
            ],
        });
        return;
    }

    // Convert to entries
    const freshEntries: SpotifyPlayEntry[] = items.map((item) => {
        const albumArt =
            item.track.album.images.find((img) => img.width === 300)?.url ||
            item.track.album.images[0]?.url ||
            "";

        return {
            id: `spotify-played-${item.track.id}-${item.played_at}`,
            title: item.track.name,
            artist: item.track.artists[0]?.name || "Unknown",
            albumName: item.track.album.name,
            url: item.track.external_urls.spotify,
            thumbnail: albumArt,
            date: item.played_at,
        };
    });

    // Merge with existing (dedup by ID)
    const existing = loadExisting();
    const entryMap = new Map<string, SpotifyPlayEntry>();
    for (const entry of existing.plays) {
        entryMap.set(entry.id, entry);
    }
    for (const entry of freshEntries) {
        entryMap.set(entry.id, entry);
    }

    // Sort by date descending
    const merged = Array.from(entryMap.values()).sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const newCount = merged.length - existing.plays.length;

    const output: SpotifyPlaysFile = {
        lastUpdated: new Date().toISOString(),
        plays: merged,
    };

    fs.writeFileSync(JSON_PATH, JSON.stringify(output, null, 2) + "\n");
    console.log(`Saved ${merged.length} plays to ${JSON_PATH}`);

    if (newCount > 0) {
        console.log(`Added ${newCount} new plays`);
    } else {
        console.log("No new plays");
    }

    await notifyIfNoteworthy({
        source: "Spotify",
        status: "success",
        newItems: Math.max(0, newCount),
        metrics: [
            { name: "New Plays", value: Math.max(0, newCount) },
            { name: "Total Plays", value: merged.length },
        ],
    });
}

main().catch(async (error: unknown) => {
    console.error("Fatal error:", error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    await notifyIfNoteworthy({
        source: "Spotify",
        status: "error",
        newItems: 0,
        errors: [`Fatal: ${errorMsg}`],
    }).catch(() => {});
    process.exit(1);
});
