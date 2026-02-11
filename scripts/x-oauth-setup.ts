/**
 * X (Twitter) OAuth 2.0 PKCE 初期セットアップスクリプト
 *
 * 初回の refresh token を取得するためのワンショットスクリプト。
 * 1. PKCE code_verifier / code_challenge を生成
 * 2. 認可URLをコンソールに表示 → ユーザーがブラウザで開く
 * 3. http://localhost:3000/callback で一時HTTPサーバーを起動しコールバック待機
 * 4. 認可コードから access_token + refresh_token を取得
 * 5. /2/users/me で X_USER_ID を取得
 * 6. 結果をコンソールに表示
 *
 * Usage: npx tsx scripts/x-oauth-setup.ts
 */

import * as crypto from "crypto";
import * as http from "http";
import * as url from "url";
import * as path from "path";
import dotenv from "dotenv";

// Load .env.local from project root
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const AUTHORIZE_URL = "https://twitter.com/i/oauth2/authorize";
const TOKEN_URL = "https://api.x.com/2/oauth2/token";
const USERS_ME_URL = "https://api.x.com/2/users/me";
const REDIRECT_URI = "http://localhost:3000/callback";
const SCOPES = "tweet.read users.read like.read bookmark.read offline.access";

// ---- PKCE Helpers ----

function generateCodeVerifier(): string {
    return crypto.randomBytes(32).toString("base64url");
}

function generateCodeChallenge(verifier: string): string {
    return crypto.createHash("sha256").update(verifier).digest("base64url");
}

function generateState(): string {
    return crypto.randomBytes(16).toString("hex");
}

// ---- Token Exchange ----

interface TokenResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
    scope: string;
}

async function exchangeCodeForToken(
    code: string,
    codeVerifier: string,
    clientId: string,
    clientSecret?: string,
): Promise<TokenResponse> {
    const params = new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
        code_verifier: codeVerifier,
        client_id: clientId,
    });

    const headers: Record<string, string> = {
        "Content-Type": "application/x-www-form-urlencoded",
    };

    if (clientSecret) {
        const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
        headers["Authorization"] = `Basic ${credentials}`;
    }

    const response = await fetch(TOKEN_URL, {
        method: "POST",
        headers,
        body: params.toString(),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Token exchange failed (${response.status}): ${errorText}`);
    }

    return response.json();
}

// ---- Fetch User ID ----

async function fetchUserId(accessToken: string): Promise<{ id: string; username: string }> {
    const response = await fetch(USERS_ME_URL, {
        headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch user info (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return { id: data.data.id, username: data.data.username };
}

// ---- Main ----

async function main() {
    const clientId = process.env.X_CLIENT_ID;
    const clientSecret = process.env.X_CLIENT_SECRET;

    if (!clientId) {
        console.error("Error: X_CLIENT_ID is not set in .env.local");
        console.error("Add the following to .env.local:");
        console.error("  X_CLIENT_ID=your_client_id");
        console.error("  X_CLIENT_SECRET=your_client_secret");
        process.exit(1);
    }

    // Generate PKCE values
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    const state = generateState();

    // Build authorization URL
    const authParams = new URLSearchParams({
        response_type: "code",
        client_id: clientId,
        redirect_uri: REDIRECT_URI,
        scope: SCOPES,
        state,
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
    });

    const authUrl = `${AUTHORIZE_URL}?${authParams.toString()}`;

    console.log("\n=== X (Twitter) OAuth 2.0 PKCE Setup ===\n");
    console.log("1. Open the following URL in your browser:\n");
    console.log(`   ${authUrl}\n`);
    console.log("2. Authorize the app on Twitter");
    console.log("3. You will be redirected to localhost:3000/callback");
    console.log("\nWaiting for callback...\n");

    // Start temporary HTTP server to receive callback
    const { code: authCode } = await waitForCallback(state);

    console.log("Authorization code received! Exchanging for tokens...\n");

    // Exchange code for tokens
    const tokenData = await exchangeCodeForToken(authCode, codeVerifier, clientId, clientSecret);

    // Fetch user info
    const userInfo = await fetchUserId(tokenData.access_token);

    // Display results
    console.log("=== Setup Complete! ===\n");
    console.log(`Username: @${userInfo.username}`);
    console.log(`User ID:  ${userInfo.id}\n`);
    console.log("Add the following to your GitHub Secrets:\n");
    console.log(`  X_CLIENT_ID=${clientId}`);
    if (clientSecret) {
        console.log(`  X_CLIENT_SECRET=${clientSecret}`);
    }
    console.log(`  X_REFRESH_TOKEN=${tokenData.refresh_token}`);
    console.log(`  X_USER_ID=${userInfo.id}`);
    console.log("\nOr run these commands:\n");
    console.log(`  gh secret set X_CLIENT_ID --body "${clientId}"`);
    if (clientSecret) {
        console.log(`  gh secret set X_CLIENT_SECRET --body "${clientSecret}"`);
    }
    console.log(`  gh secret set X_REFRESH_TOKEN --body "${tokenData.refresh_token}"`);
    console.log(`  gh secret set X_USER_ID --body "${userInfo.id}"`);
    console.log();
}

function waitForCallback(expectedState: string): Promise<{ code: string }> {
    return new Promise((resolve, reject) => {
        const server = http.createServer((req, res) => {
            const parsedUrl = url.parse(req.url || "", true);

            if (parsedUrl.pathname !== "/callback") {
                res.writeHead(404);
                res.end("Not found");
                return;
            }

            const { code, state, error } = parsedUrl.query;

            if (error) {
                res.writeHead(400);
                res.end(`Authorization failed: ${error}`);
                server.close();
                reject(new Error(`Authorization failed: ${error}`));
                return;
            }

            if (state !== expectedState) {
                res.writeHead(400);
                res.end("State mismatch - possible CSRF attack");
                server.close();
                reject(new Error("State mismatch"));
                return;
            }

            if (!code || typeof code !== "string") {
                res.writeHead(400);
                res.end("Missing authorization code");
                server.close();
                reject(new Error("Missing authorization code"));
                return;
            }

            res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
            res.end(`
                <html>
                <body style="font-family: sans-serif; text-align: center; padding: 50px;">
                    <h1>Authorization successful!</h1>
                    <p>You can close this tab and return to the terminal.</p>
                </body>
                </html>
            `);

            server.close();
            resolve({ code });
        });

        server.listen(3000, () => {
            console.log("Callback server listening on http://localhost:3000/callback");
        });

        // Timeout after 5 minutes
        setTimeout(() => {
            server.close();
            reject(new Error("Timeout: no callback received within 5 minutes"));
        }, 5 * 60 * 1000);
    });
}

main().catch((error) => {
    console.error("\nError:", error.message);
    process.exit(1);
});
