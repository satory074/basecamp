import { NextResponse, NextRequest } from "next/server";
import type { Post } from "../../lib/types";
import { rateLimit } from "../../lib/rate-limit";
import { getSpotifyAccessToken } from "../../lib/spotify-auth";
import { ApiError, createErrorResponse } from "../../lib/api-errors";
import { fetchWithTimeout } from "../../lib/fetch-with-timeout";

export const revalidate = 21600;

const limiter = rateLimit({ maxRequests: 60, windowMs: 60 * 60 * 1000 });

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

interface PlaylistTrackItem {
    track: SpotifyTrack | null;
    added_at: string;
}

const PLAYLIST_ID = process.env.SPOTIFY_PLAYLIST_ID || "";

async function fetchRecentlyPlayed(accessToken: string): Promise<Post[]> {
    const response = await fetchWithTimeout("https://api.spotify.com/v1/me/player/recently-played?limit=50", {
        headers: { Authorization: `Bearer ${accessToken}` },
        next: { revalidate: 3600 },
        timeoutMs: 10000,
    });

    if (!response.ok) {
        throw new ApiError(`Spotify recently played fetch failed: ${response.status}`, 502, "SPOTIFY_API_ERROR");
    }

    const data = (await response.json()) as { items?: RecentlyPlayedItem[] };
    const items = data.items || [];

    const seen = new Set<string>();
    const uniqueItems = items.filter((item) => {
        if (seen.has(item.track.id)) return false;
        seen.add(item.track.id);
        return true;
    });

    return uniqueItems.map((item) => {
        const albumArt = item.track.album.images.find((img) => img.width === 300)?.url || item.track.album.images[0]?.url;

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
}

async function fetchPlaylistAdditions(accessToken: string): Promise<Post[]> {
    if (!PLAYLIST_ID) return [];

    const response = await fetchWithTimeout(
        `https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/tracks?limit=50&fields=items(added_at,track(id,name,external_urls,artists,album(name,images)))`,
        {
            headers: { Authorization: `Bearer ${accessToken}` },
            next: { revalidate: 3600 },
            timeoutMs: 10000,
        }
    );

    if (!response.ok) {
        throw new ApiError(`Spotify playlist fetch failed: ${response.status}`, 502, "SPOTIFY_API_ERROR");
    }

    const data = (await response.json()) as { items?: PlaylistTrackItem[] };
    const items = data.items || [];

    return items
        .filter((item) => item.track !== null)
        .map((item) => {
            const track = item.track;
            if (!track) {
                throw new ApiError("Spotify playlist data is invalid", 502, "SPOTIFY_PARSE_ERROR");
            }

            const albumArt = track.album.images.find((img) => img.width === 300)?.url || track.album.images[0]?.url;

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
            throw new ApiError("Failed to get Spotify access token", 500, "SPOTIFY_AUTH_ERROR");
        }

        const [recentlyPlayed, playlistTracks] = await Promise.all([
            fetchRecentlyPlayed(accessToken),
            fetchPlaylistAdditions(accessToken),
        ]);

        const allPosts = [...recentlyPlayed, ...playlistTracks];
        allPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const jsonResponse = NextResponse.json(allPosts);
        jsonResponse.headers.set("X-RateLimit-Limit", "60");
        jsonResponse.headers.set("X-RateLimit-Remaining", remaining.toString());
        return jsonResponse;
    } catch (error) {
        const errorResponse = createErrorResponse(error, "Failed to fetch Spotify activity");
        errorResponse.headers.set("X-RateLimit-Limit", "60");
        errorResponse.headers.set("X-RateLimit-Remaining", remaining.toString());
        return errorResponse;
    }
}
