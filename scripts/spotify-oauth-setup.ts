/**
 * Spotify OAuth 2.0 Authorization Code Flow 初期セットアップスクリプト
 *
 * 初回の refresh token を取得するためのワンショットスクリプト。
 * 1. 認可URLをコンソールに表示 → ユーザーがブラウザで開く
 * 2. http://127.0.0.1:8888/callback で一時HTTPサーバーを起動しコールバック待機
 * 3. 認可コードから access_token + refresh_token を取得
 * 4. 結果をコンソールに表示
 *
 * 前提:
 *   Spotify Developer Dashboard → 該当アプリ → Edit settings → Redirect URIs に
 *   `http://127.0.0.1:8888/callback` を追加しておくこと
 *
 * Usage: npx tsx scripts/spotify-oauth-setup.ts
 */

import * as crypto from "crypto";
import * as http from "http";
import * as url from "url";
import * as path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const AUTHORIZE_URL = "https://accounts.spotify.com/authorize";
const TOKEN_URL = "https://accounts.spotify.com/api/token";
const REDIRECT_URI = "http://127.0.0.1:8888/callback";
const SCOPES = "user-read-recently-played";
const PORT = 8888;

interface TokenResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
    scope: string;
}

async function exchangeCodeForToken(
    code: string,
    clientId: string,
    clientSecret: string,
): Promise<TokenResponse> {
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const response = await fetch(TOKEN_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${basic}`,
        },
        body: new URLSearchParams({
            grant_type: "authorization_code",
            code,
            redirect_uri: REDIRECT_URI,
        }),
    });
    if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.status} ${await response.text()}`);
    }
    return (await response.json()) as TokenResponse;
}

async function main() {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        console.error("Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env.local");
        process.exit(1);
    }

    const state = crypto.randomBytes(16).toString("hex");
    const authUrl = new URL(AUTHORIZE_URL);
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
    authUrl.searchParams.set("scope", SCOPES);
    authUrl.searchParams.set("state", state);

    console.log("\n1. Spotify Developer Dashboard で Redirect URI に以下が登録されているか確認:");
    console.log(`   ${REDIRECT_URI}`);
    console.log("\n2. このURLをブラウザで開いて Authorize:");
    console.log(`   ${authUrl.toString()}\n`);

    const server = http.createServer(async (req, res) => {
        const parsed = url.parse(req.url ?? "", true);
        if (parsed.pathname !== "/callback") {
            res.writeHead(404).end("Not Found");
            return;
        }
        const code = parsed.query.code as string | undefined;
        const returnedState = parsed.query.state as string | undefined;
        const error = parsed.query.error as string | undefined;

        if (error) {
            res.writeHead(400, { "Content-Type": "text/plain" });
            res.end(`Authorization failed: ${error}`);
            console.error(`\nError: ${error}`);
            process.exit(1);
        }
        if (!code || returnedState !== state) {
            res.writeHead(400).end("Invalid callback");
            console.error("\nInvalid callback: missing code or state mismatch");
            process.exit(1);
        }

        try {
            const tokens = await exchangeCodeForToken(code, clientId, clientSecret);
            res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
            res.end("OK. Refresh token printed to terminal. You can close this tab.");
            console.log("\n=== Spotify Tokens ===");
            console.log("access_token (expires in", tokens.expires_in, "sec):");
            console.log(tokens.access_token);
            console.log("\nrefresh_token (copy this to GitHub Secret SPOTIFY_REFRESH_TOKEN):");
            console.log(tokens.refresh_token);
            console.log("\nscope:", tokens.scope);
            server.close();
            process.exit(0);
        } catch (e) {
            res.writeHead(500).end(String(e));
            console.error("\nToken exchange failed:", e);
            process.exit(1);
        }
    });

    server.listen(PORT, "127.0.0.1", () => {
        console.log(`Listening on ${REDIRECT_URI} ...`);
    });
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
