/**
 * Swarm Blocklist 管理 CLI
 *
 * `.env.local` の `SWARM_BLOCKED_VENUES_LOCAL` を single source of truth として保持し、
 * `gh secret set SWARM_BLOCKED_VENUES` で GitHub に同期する。
 *
 * Usage:
 *   npx tsx scripts/swarm-blocklist.ts list
 *   npx tsx scripts/swarm-blocklist.ts add name "自宅"
 *   npx tsx scripts/swarm-blocklist.ts add address "新宿区西新宿"
 *   npx tsx scripts/swarm-blocklist.ts add category "Home (private)"
 *   npx tsx scripts/swarm-blocklist.ts add lat-lng 35.689 139.700 200
 *   npx tsx scripts/swarm-blocklist.ts redact
 *   npx tsx scripts/swarm-blocklist.ts sync
 */

import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import { execSync } from "child_process";
import dotenv from "dotenv";

const PROJECT_ROOT = path.join(__dirname, "..");
const ENV_LOCAL = path.join(PROJECT_ROOT, ".env.local");
const JSON_PATH = path.join(PROJECT_ROOT, "public/data/swarm-checkins.json");
const ENV_KEY = "SWARM_BLOCKED_VENUES_LOCAL";
const SECRET_NAME = "SWARM_BLOCKED_VENUES";

dotenv.config({ path: ENV_LOCAL });

type BlocklistEntry =
    | { type: "name"; value: string }
    | { type: "address"; value: string }
    | { type: "category"; value: string }
    | { type: "lat-lng"; lat: number; lng: number; radiusM: number };

interface SwarmCheckinEntry {
    id: string;
    date: string;
    venueName: string;
    venueCategory?: string;
    city?: string;
    lat?: number;
    lng?: number;
    shout?: string;
    url: string;
}

interface SwarmCheckinsFile {
    lastUpdated: string;
    checkins: SwarmCheckinEntry[];
}

function readBlocklist(): BlocklistEntry[] {
    const raw = process.env[ENV_KEY];
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as BlocklistEntry[]) : [];
    } catch {
        console.warn(`Invalid ${ENV_KEY} JSON in .env.local, treating as empty`);
        return [];
    }
}

function writeBlocklist(list: BlocklistEntry[]) {
    const json = JSON.stringify(list);
    let content = fs.existsSync(ENV_LOCAL) ? fs.readFileSync(ENV_LOCAL, "utf-8") : "";

    const line = `${ENV_KEY}=${JSON.stringify(json)}`;
    const re = new RegExp(`^${ENV_KEY}=.*$`, "m");
    if (re.test(content)) {
        content = content.replace(re, line);
    } else {
        if (content.length > 0 && !content.endsWith("\n")) content += "\n";
        content += line + "\n";
    }
    fs.writeFileSync(ENV_LOCAL, content);
    console.log(`Updated ${ENV_KEY} in .env.local (${list.length} entries)`);
}

function syncToGitHub(list: BlocklistEntry[]) {
    const json = JSON.stringify(list);
    try {
        execSync(`gh secret set ${SECRET_NAME} --body ${JSON.stringify(json)}`, {
            stdio: ["ignore", "inherit", "inherit"],
            cwd: PROJECT_ROOT,
        });
        console.log(`Synced to GitHub Secret ${SECRET_NAME}`);
    } catch (err) {
        console.error(`Failed to sync to GitHub: ${(err as Error).message}`);
        console.error(`Run manually: gh secret set ${SECRET_NAME} --body '${json}'`);
        process.exit(1);
    }
}

function cmdList() {
    const list = readBlocklist();
    if (list.length === 0) {
        console.log("(blocklist is empty)");
        return;
    }
    list.forEach((entry, i) => {
        const idx = String(i + 1).padStart(2, " ");
        if (entry.type === "lat-lng") {
            console.log(`${idx}. [${entry.type}] (${entry.lat}, ${entry.lng}) within ${entry.radiusM}m`);
        } else {
            console.log(`${idx}. [${entry.type}] "${entry.value}"`);
        }
    });
}

function cmdAdd(args: string[]) {
    const [type, ...rest] = args;
    if (!type) throw new Error("Usage: add <name|address|category|lat-lng> ...");

    const list = readBlocklist();
    let entry: BlocklistEntry;

    if (type === "name" || type === "address" || type === "category") {
        const value = rest.join(" ").trim();
        if (!value) throw new Error(`Usage: add ${type} <value>`);
        entry = { type, value };
    } else if (type === "lat-lng") {
        const [latStr, lngStr, radiusStr] = rest;
        const lat = parseFloat(latStr);
        const lng = parseFloat(lngStr);
        const radiusM = radiusStr ? parseInt(radiusStr, 10) : 200;
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            throw new Error("Usage: add lat-lng <lat> <lng> [radiusM=200]");
        }
        entry = { type: "lat-lng", lat, lng, radiusM };
    } else {
        throw new Error(`Unknown type: ${type}`);
    }

    list.push(entry);
    writeBlocklist(list);
    syncToGitHub(list);
}

function cmdSync() {
    const list = readBlocklist();
    syncToGitHub(list);
}

async function cmdRedact() {
    if (!fs.existsSync(JSON_PATH)) {
        console.log("No swarm-checkins.json yet");
        return;
    }
    const data = JSON.parse(fs.readFileSync(JSON_PATH, "utf-8")) as SwarmCheckinsFile;
    if (data.checkins.length === 0) {
        console.log("No checkins to redact");
        return;
    }

    const recent = data.checkins.slice(0, 20);
    console.log("Recent checkins:");
    recent.forEach((c, i) => {
        const date = new Date(c.date).toISOString().slice(0, 16).replace("T", " ");
        const idx = String(i + 1).padStart(2, " ");
        console.log(`${idx}. ${date}  ${c.venueName}${c.city ? ` (${c.city})` : ""}`);
    });

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = await new Promise<string>((resolve) =>
        rl.question("\nSelect # to redact (or blank to cancel): ", resolve),
    );
    rl.close();

    const idx = parseInt(answer.trim(), 10);
    if (!Number.isFinite(idx) || idx < 1 || idx > recent.length) {
        console.log("Cancelled");
        return;
    }
    const target = recent[idx - 1];
    const remaining = data.checkins.filter((c) => c.id !== target.id);

    fs.writeFileSync(
        JSON_PATH,
        JSON.stringify({ lastUpdated: new Date().toISOString(), checkins: remaining }, null, 2) + "\n",
    );
    console.log(`Removed: ${target.venueName} (${target.id})`);

    // Also add the venue name to blocklist
    const list = readBlocklist();
    list.push({ type: "name", value: target.venueName });
    writeBlocklist(list);
    syncToGitHub(list);

    console.log(`\nNext steps:`);
    console.log(`  git add ${path.relative(PROJECT_ROOT, JSON_PATH)}`);
    console.log(`  git commit -m "chore: redact Swarm checkin"`);
    console.log(`  git push`);
}

async function main() {
    const [, , cmd, ...args] = process.argv;
    switch (cmd) {
        case "list":
            cmdList();
            break;
        case "add":
            cmdAdd(args);
            break;
        case "sync":
            cmdSync();
            break;
        case "redact":
            await cmdRedact();
            break;
        default:
            console.error(
                "Usage:\n" +
                    "  npx tsx scripts/swarm-blocklist.ts list\n" +
                    "  npx tsx scripts/swarm-blocklist.ts add name <value>\n" +
                    "  npx tsx scripts/swarm-blocklist.ts add address <value>\n" +
                    "  npx tsx scripts/swarm-blocklist.ts add category <value>\n" +
                    "  npx tsx scripts/swarm-blocklist.ts add lat-lng <lat> <lng> [radiusM=200]\n" +
                    "  npx tsx scripts/swarm-blocklist.ts redact\n" +
                    "  npx tsx scripts/swarm-blocklist.ts sync",
            );
            process.exit(1);
    }
}

main().catch((err) => {
    console.error("Error:", err instanceof Error ? err.message : String(err));
    process.exit(1);
});
