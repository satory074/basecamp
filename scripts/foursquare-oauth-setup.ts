/**
 * Foursquare (Swarm) OAuth 2.0 初期セットアップスクリプト
 *
 * 初回 access_token を取得するためのワンショットスクリプト。
 * 1. 認可URLをコンソールに表示 → ユーザーがブラウザで開く
 * 2. http://localhost:3000/oauth-callback で一時HTTPサーバーを起動
 * 3. 認可コードから access_token を取得（Foursquare の token は長寿命でローテーションなし）
 * 4. /v2/users/self で USER_ID を取得
 * 5. 結果と GitHub Secrets 設定コマンドを表示
 *
 * Usage: npx tsx scripts/foursquare-oauth-setup.ts
 *
 * 必要な .env.local:
 *   FOURSQUARE_CLIENT_ID=xxx
 *   FOURSQUARE_CLIENT_SECRET=xxx
 */

import * as http from "http";
import * as urlLib from "url";
import * as path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const AUTHORIZE_URL = "https://foursquare.com/oauth2/authenticate";
const TOKEN_URL = "https://foursquare.com/oauth2/access_token";
const USERS_SELF_URL = "https://api.foursquare.com/v2/users/self";
const REDIRECT_URI = "http://localhost:3000/oauth-callback";
const FOURSQUARE_API_VERSION = "20260101";

interface TokenResponse {
    access_token: string;
}

interface FoursquareUser {
    id: string;
    firstName?: string;
    lastName?: string;
    contact?: { email?: string };
}

async function exchangeCodeForToken(
    code: string,
    clientId: string,
    clientSecret: string,
): Promise<TokenResponse> {
    const params = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        redirect_uri: REDIRECT_URI,
        code,
    });

    const response = await fetch(`${TOKEN_URL}?${params.toString()}`, {
        method: "GET",
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Token exchange failed (${response.status}): ${errorText}`);
    }

    return response.json() as Promise<TokenResponse>;
}

async function fetchSelf(accessToken: string): Promise<FoursquareUser> {
    const params = new URLSearchParams({
        oauth_token: accessToken,
        v: FOURSQUARE_API_VERSION,
    });

    const response = await fetch(`${USERS_SELF_URL}?${params.toString()}`);

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch user info (${response.status}): ${errorText}`);
    }

    const body = (await response.json()) as { response?: { user?: FoursquareUser } };
    if (!body.response?.user) {
        throw new Error("Unexpected response shape from /v2/users/self");
    }
    return body.response.user;
}

function waitForCallback(): Promise<{ code: string }> {
    return new Promise((resolve, reject) => {
        const server = http.createServer((req, res) => {
            const parsedUrl = urlLib.parse(req.url || "", true);

            if (parsedUrl.pathname !== "/oauth-callback") {
                res.writeHead(404);
                res.end("Not found");
                return;
            }

            const { code, error } = parsedUrl.query;

            if (error) {
                res.writeHead(400);
                res.end(`Authorization failed: ${error}`);
                server.close();
                reject(new Error(`Authorization failed: ${error}`));
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
            console.log("Callback server listening on http://localhost:3000/oauth-callback");
        });

        setTimeout(() => {
            server.close();
            reject(new Error("Timeout: no callback received within 5 minutes"));
        }, 5 * 60 * 1000);
    });
}

async function main() {
    const clientId = process.env.FOURSQUARE_CLIENT_ID;
    const clientSecret = process.env.FOURSQUARE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        console.error("Error: FOURSQUARE_CLIENT_ID / FOURSQUARE_CLIENT_SECRET is not set in .env.local");
        console.error("Add the following to .env.local:");
        console.error("  FOURSQUARE_CLIENT_ID=your_client_id");
        console.error("  FOURSQUARE_CLIENT_SECRET=your_client_secret");
        process.exit(1);
    }

    const authParams = new URLSearchParams({
        client_id: clientId,
        response_type: "code",
        redirect_uri: REDIRECT_URI,
    });
    const authUrl = `${AUTHORIZE_URL}?${authParams.toString()}`;

    console.log("\n=== Foursquare (Swarm) OAuth Setup ===\n");
    console.log("1. Open the following URL in your browser:\n");
    console.log(`   ${authUrl}\n`);
    console.log("2. Authorize the app");
    console.log("3. You will be redirected to localhost:3000/oauth-callback");
    console.log("\nWaiting for callback...\n");

    const { code } = await waitForCallback();
    console.log("Authorization code received! Exchanging for access token...\n");

    const tokenData = await exchangeCodeForToken(code, clientId, clientSecret);
    const user = await fetchSelf(tokenData.access_token);

    const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ") || "(no name)";

    console.log("=== Setup Complete! ===\n");
    console.log(`User:    ${displayName}`);
    console.log(`ID:      ${user.id}`);
    if (user.contact?.email) console.log(`Email:   ${user.contact.email}`);
    console.log();
    console.log("Add the following to your .env.local and GitHub Secrets:\n");
    console.log(`  FOURSQUARE_ACCESS_TOKEN=${tokenData.access_token}`);
    console.log(`  FOURSQUARE_USER_ID=${user.id}`);
    console.log("\nOr run these commands:\n");
    console.log(`  gh secret set FOURSQUARE_ACCESS_TOKEN --body "${tokenData.access_token}"`);
    console.log(`  gh secret set FOURSQUARE_USER_ID --body "${user.id}"`);
    console.log();
    console.log("Note: Foursquare access tokens are long-lived (no rotation).");
    console.log("      Re-run this script only if the token is revoked.\n");
}

main().catch((error: unknown) => {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("\nError:", msg);
    process.exit(1);
});
