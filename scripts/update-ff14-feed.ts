/**
 * FF14 キャラクター情報更新スクリプト
 *
 * Lodestone からキャラクター情報とクラス/ジョブレベルをスクレイピングし、
 * public/data/ff14-character.json に保存する。
 *
 * GitHub Actions から定期実行される想定。
 *
 * 必要な環境変数:
 *   DISCORD_WEBHOOK_URL - Discord通知用（オプション）
 */

import * as fs from "fs";
import * as path from "path";
import * as cheerio from "cheerio";

const JSON_PATH = path.join(process.cwd(), "public/data/ff14-character.json");

const CHARACTER_ID = "27095571";
const CHARACTER_NAME = "Satory Nocturne";
const CHARACTER_SERVER = "Zeromus";
const LODESTONE_BASE_URL = "https://jp.finalfantasyxiv.com";
const CHARACTER_URL = `${LODESTONE_BASE_URL}/lodestone/character/${CHARACTER_ID}/`;
const CLASS_JOB_URL = `${LODESTONE_BASE_URL}/lodestone/character/${CHARACTER_ID}/class_job/`;

const FETCH_TIMEOUT = 15000;
const MAX_RETRIES = 3;

// ---- Types ----

interface FF14Character {
    id: number;
    name: string;
    server: string;
    avatar: string;
    portrait: string;
    bio: string;
    race: string;
    tribe: string;
    gender: string;
    activeClassJob: {
        id: number;
        name: string;
        level: number;
        icon: string;
    };
    classJobs: Array<{
        id: number;
        name: string;
        level: number;
        expLevel: number;
        expLevelMax: number;
        expLevelTogo: number;
        isSpecialised: boolean;
        icon: string;
        role: string;
    }>;
    freeCompany?: {
        id: string;
        name: string;
        tag: string;
    };
    minions: number;
    mounts: number;
    achievementPoints: number;
    lastUpdated: string;
}

// ---- Constants ----

const JOB_NAME_MAP: Record<string, string> = {
    "Paladin": "ナイト",
    "Warrior": "戦士",
    "Dark Knight": "暗黒騎士",
    "Gunbreaker": "ガンブレイカー",
    "White Mage": "白魔道士",
    "Scholar": "学者",
    "Astrologian": "占星術師",
    "Sage": "賢者",
    "Monk": "モンク",
    "Dragoon": "竜騎士",
    "Ninja": "忍者",
    "Samurai": "侍",
    "Reaper": "リーパー",
    "Viper": "ヴァイパー",
    "Bard": "吟遊詩人",
    "Machinist": "機工士",
    "Dancer": "踊り子",
    "Black Mage": "黒魔道士",
    "Summoner": "召喚士",
    "Red Mage": "赤魔道士",
    "Pictomancer": "ピクトマンサー",
    "Blue Mage": "青魔道士",
    "Carpenter": "木工師",
    "Blacksmith": "鍛冶師",
    "Armorer": "甲冑師",
    "Goldsmith": "彫金師",
    "Leatherworker": "革細工師",
    "Weaver": "裁縫師",
    "Alchemist": "錬金術師",
    "Culinarian": "調理師",
    "Miner": "採掘師",
    "Botanist": "園芸師",
    "Fisher": "漁師",
};

const ROLE_NAME_MAP: Record<string, string> = {
    "Tank": "タンク",
    "Healer": "ヒーラー",
    "Melee DPS": "近接DPS",
    "Physical Ranged DPS": "遠隔物理DPS",
    "Magical Ranged DPS": "遠隔魔法DPS",
    "Crafter": "クラフター",
    "Gatherer": "ギャザラー",
};

// ---- Helpers ----

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<Response> {
    for (let attempt = 1; attempt <= retries; attempt++) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

        try {
            const response = await fetch(url, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                    "Accept-Language": "ja,en;q=0.9",
                },
                signal: controller.signal,
            });
            return response;
        } catch (error) {
            clearTimeout(timer);
            if (attempt === retries) throw error;
            const backoff = 500 * Math.pow(2, attempt - 1) + Math.random() * 200;
            console.warn(`Attempt ${attempt} failed for ${url}, retrying in ${Math.round(backoff)}ms...`);
            await delay(backoff);
        } finally {
            clearTimeout(timer);
        }
    }
    throw new Error("Unreachable");
}

// ---- Scraping ----

async function scrapeCharacterPage(): Promise<Partial<FF14Character>> {
    const response = await fetchWithRetry(CHARACTER_URL);
    if (!response.ok) {
        throw new Error(`Failed to fetch character page: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const name = $(".frame__chara__name").text().trim();
    const serverText = $(".frame__chara__world").text().trim();
    const server = serverText.replace(/\s*\[.*\]$/, "");

    const raceBlock = $(".character-block__box").filter((_, el) => {
        return $(el).find(".character-block__title").text().includes("種族");
    });
    const raceText = raceBlock.find(".character-block__name").html() || "";
    const raceParts = raceText.split("<br>").map(s => {
        const $temp = cheerio.load(`<span>${s}</span>`);
        return $temp("span").text().trim();
    });
    const race = raceParts[0] || "";
    const tribeGender = raceParts[1] || "";
    const [tribe, genderSymbol] = tribeGender.split(" / ");
    const gender = genderSymbol === "♂" ? "男性" : genderSymbol === "♀" ? "女性" : "";

    const avatarImg = $(".character-block__face").attr("src") ||
                      $(".frame__chara__face img").attr("src") || "";
    const portrait = avatarImg.replace("fc0.jpg", "fl0.jpg").replace("_96x96", "_640x873");

    let freeCompany: FF14Character["freeCompany"] | undefined;
    const fcBlock = $(".character__freecompany__name");
    if (fcBlock.length > 0) {
        const fcName = fcBlock.find("a").text().trim();
        const fcLink = fcBlock.find("a").attr("href") || "";
        const fcIdMatch = fcLink.match(/freecompany\/(\d+)/);
        freeCompany = {
            id: fcIdMatch ? fcIdMatch[1] : "0",
            name: fcName,
            tag: "",
        };
    }

    return {
        id: parseInt(CHARACTER_ID),
        name,
        server,
        avatar: avatarImg,
        portrait,
        bio: "",
        race,
        tribe: tribe || "",
        gender,
        freeCompany,
    };
}

async function scrapeClassJobPage(): Promise<FF14Character["classJobs"]> {
    const response = await fetchWithRetry(CLASS_JOB_URL);
    if (!response.ok) {
        throw new Error(`Failed to fetch class/job page: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const classJobs: FF14Character["classJobs"] = [];
    let jobIndex = 0;

    $("ul.character__job").each((_, ulElement) => {
        const $ul = $(ulElement);
        const $heading = $ul.prevAll("h4.heading--lead").first();
        const roleName = $heading.text().trim();
        const role = ROLE_NAME_MAP[roleName] || roleName;

        $ul.find("li").each((_, jobElement) => {
            const $job = $(jobElement);
            const icon = $job.find(".character__job__icon img").attr("src") || "";
            const levelText = $job.find(".character__job__level").text().trim();
            const level = levelText === "-" ? 0 : parseInt(levelText) || 0;
            const jobName = $job.find(".character__job__name").attr("data-tooltip") || "";
            const expText = $job.find(".character__job__exp").text().trim();

            let expLevel = 0;
            let expLevelMax = 0;
            if (expText && expText !== "-- / --") {
                const expMatch = expText.match(/([\d,]+)\s*\/\s*([\d,]+)/);
                if (expMatch) {
                    expLevel = parseInt(expMatch[1].replace(/,/g, "")) || 0;
                    expLevelMax = parseInt(expMatch[2].replace(/,/g, "")) || 0;
                }
            }

            const cleanJobName = jobName.split(" / ")[0].replace(" [リミテッドジョブ]", "");

            if (level > 0) {
                classJobs.push({
                    id: jobIndex++,
                    name: JOB_NAME_MAP[cleanJobName] || cleanJobName,
                    level,
                    expLevel,
                    expLevelMax,
                    expLevelTogo: expLevelMax - expLevel,
                    isSpecialised: false,
                    icon,
                    role,
                });
            }
        });
    });

    return classJobs;
}

// ---- Discord ----

async function sendDiscordNotification(params: {
    success: boolean;
    jobCount: number;
    errors: string[];
}): Promise<void> {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) return;

    const color = params.errors.length > 0 ? 0xff0000 : 0x00aa00;
    const status = params.errors.length > 0 ? "Error" : "Success";

    const fields = [
        { name: "Status", value: status, inline: true },
        { name: "Jobs Found", value: `${params.jobCount}`, inline: true },
    ];

    if (params.errors.length > 0) {
        fields.push({ name: "Errors", value: params.errors.join("\n").slice(0, 1000), inline: false });
    }

    const embed = {
        title: `FF14 Character Update: ${status}`,
        color,
        fields,
        timestamp: new Date().toISOString(),
    };

    await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embeds: [embed] }),
    }).catch((e: unknown) => console.error("Discord notification failed:", e));
}

// ---- Main ----

async function main() {
    console.log(`Scraping Lodestone character: ${CHARACTER_ID}`);

    const [characterData, classJobs] = await Promise.all([
        scrapeCharacterPage(),
        scrapeClassJobPage(),
    ]);

    const sortedJobs = [...classJobs].sort((a, b) => b.level - a.level);
    const activeJob = sortedJobs[0] || { id: 0, name: "冒険者", level: 1, icon: "" };

    const character: FF14Character = {
        id: characterData.id || parseInt(CHARACTER_ID),
        name: characterData.name || CHARACTER_NAME,
        server: characterData.server || CHARACTER_SERVER,
        avatar: characterData.avatar || "",
        portrait: characterData.portrait || "",
        bio: characterData.bio || "",
        race: characterData.race || "",
        tribe: characterData.tribe || "",
        gender: characterData.gender || "",
        activeClassJob: {
            id: activeJob.id,
            name: activeJob.name,
            level: activeJob.level,
            icon: activeJob.icon,
        },
        classJobs,
        freeCompany: characterData.freeCompany,
        minions: 0,
        mounts: 0,
        achievementPoints: 0,
        lastUpdated: new Date().toISOString(),
    };

    fs.writeFileSync(JSON_PATH, JSON.stringify(character, null, 2) + "\n");
    console.log(`Saved character data to ${JSON_PATH} (${classJobs.length} jobs)`);

    await sendDiscordNotification({
        success: true,
        jobCount: classJobs.length,
        errors: [],
    });
}

main().catch(async (error: unknown) => {
    console.error("Fatal error:", error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    await sendDiscordNotification({
        success: false,
        jobCount: 0,
        errors: [`Fatal: ${errorMsg}`],
    }).catch(() => {});
    process.exit(1);
});
