/**
 * Spotify OAuth Token Management
 * リフレッシュトークンを使用してアクセストークンを取得・キャッシュする
 */

interface SpotifyTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    scope: string;
}

// インメモリキャッシュ（同一インスタンス内で共有）
let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Spotifyアクセストークンを取得
 * キャッシュが有効な場合はキャッシュから返す
 * @returns アクセストークン、または取得失敗時はnull
 */
export async function getSpotifyAccessToken(): Promise<string | null> {
    // キャッシュが有効な場合はそれを返す（60秒のバッファ）
    if (cachedToken && Date.now() < cachedToken.expiresAt - 60000) {
        return cachedToken.token;
    }

    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
        console.error("Missing Spotify credentials in environment variables");
        return null;
    }

    try {
        const response = await fetch("https://accounts.spotify.com/api/token", {
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
            console.error("Failed to refresh Spotify token:", response.status, errorText);
            return null;
        }

        const data: SpotifyTokenResponse = await response.json();

        // 新しいトークンをキャッシュ
        cachedToken = {
            token: data.access_token,
            expiresAt: Date.now() + data.expires_in * 1000,
        };

        return data.access_token;
    } catch (error) {
        console.error("Spotify token refresh error:", error);
        return null;
    }
}
