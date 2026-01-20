import { NextResponse, NextRequest } from "next/server";
import type { Post } from "../../lib/types";
import { rateLimit } from "../../lib/rate-limit";
import { getSpotifyAccessToken } from "../../lib/spotify-auth";

export const revalidate = 21600; // ISR: 6時間ごとに再生成

const limiter = rateLimit({ maxRequests: 60, windowMs: 60 * 60 * 1000 });

// Spotify API レスポンス型
interface SpotifyTrack {
    id: string;
    name: string;
    external_urls: { spotify: string };
    duration_ms: number;
    preview_url: string | null;
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

interface PlaylistTrackItem {
    track: SpotifyTrack | null;
    added_at: string;
}

// プレイリストID（環境変数から取得、オプション）
const PLAYLIST_ID = process.env.SPOTIFY_PLAYLIST_ID || "";

/**
 * 最近再生した曲を取得
 */
async function fetchRecentlyPlayed(accessToken: string): Promise<Post[]> {
    try {
        const response = await fetch(
            "https://api.spotify.com/v1/me/player/recently-played?limit=50",
            {
                headers: { Authorization: `Bearer ${accessToken}` },
                next: { revalidate: 3600 },
            }
        );

        if (!response.ok) {
            console.error("Spotify recently played fetch failed:", response.status);
            return [];
        }

        const data = await response.json();
        const items: RecentlyPlayedItem[] = data.items || [];

        // 同じ曲の重複を除去（最新の再生のみ保持）
        const seen = new Set<string>();
        const uniqueItems = items.filter((item) => {
            if (seen.has(item.track.id)) return false;
            seen.add(item.track.id);
            return true;
        });

        return uniqueItems.map((item) => {
            // アルバムアートを取得（300px優先、なければ最初の画像）
            const albumArt =
                item.track.album.images.find((img) => img.width === 300)?.url ||
                item.track.album.images[0]?.url;

            return {
                id: `spotify-played-${item.track.id}-${item.played_at}`,
                title: item.track.name,
                url: item.track.external_urls.spotify,
                date: item.played_at,
                platform: "spotify" as const,
                description: `${item.track.artists[0]?.name || "Unknown"} - ${item.track.album.name}`,
                thumbnail: albumArt,
            };
        });
    } catch (error) {
        console.error("Error fetching recently played:", error);
        return [];
    }
}

/**
 * プレイリストに追加された曲を取得
 */
async function fetchPlaylistAdditions(accessToken: string): Promise<Post[]> {
    if (!PLAYLIST_ID) return [];

    try {
        const response = await fetch(
            `https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/tracks?limit=50&fields=items(added_at,track(id,name,external_urls,artists,album(name,images)))`,
            {
                headers: { Authorization: `Bearer ${accessToken}` },
                next: { revalidate: 3600 },
            }
        );

        if (!response.ok) {
            console.error("Spotify playlist fetch failed:", response.status);
            return [];
        }

        const data = await response.json();
        const items: PlaylistTrackItem[] = data.items || [];

        return items
            .filter((item) => item.track !== null) // 削除された曲を除外
            .map((item) => {
                const track = item.track!;
                const albumArt =
                    track.album.images.find((img) => img.width === 300)?.url ||
                    track.album.images[0]?.url;

                return {
                    id: `spotify-playlist-${track.id}-${item.added_at}`,
                    title: track.name,
                    url: track.external_urls.spotify,
                    date: item.added_at,
                    platform: "spotify" as const,
                    description: `${track.artists[0]?.name || "Unknown"} - ${track.album.name}`,
                    thumbnail: albumArt,
                };
            });
    } catch (error) {
        console.error("Error fetching playlist tracks:", error);
        return [];
    }
}

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
        const accessToken = await getSpotifyAccessToken();
        if (!accessToken) {
            console.error("Failed to get Spotify access token");
            const jsonResponse = NextResponse.json([]);
            jsonResponse.headers.set("X-RateLimit-Remaining", remaining.toString());
            return jsonResponse;
        }

        // 両方のデータソースを並列取得
        const [recentlyPlayed, playlistTracks] = await Promise.all([
            fetchRecentlyPlayed(accessToken),
            fetchPlaylistAdditions(accessToken),
        ]);

        // 結合して日付でソート（新しい順）
        const allPosts = [...recentlyPlayed, ...playlistTracks];
        allPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const jsonResponse = NextResponse.json(allPosts);
        jsonResponse.headers.set("X-RateLimit-Limit", "60");
        jsonResponse.headers.set("X-RateLimit-Remaining", remaining.toString());
        return jsonResponse;
    } catch (error) {
        console.error("Spotify API error:", error);
        // エラー時は空配列を返す（既存パターン踏襲）
        const jsonResponse = NextResponse.json([]);
        jsonResponse.headers.set("X-RateLimit-Remaining", remaining.toString());
        return jsonResponse;
    }
}
