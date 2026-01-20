import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { config } from "@/app/lib/config";

export const revalidate = 21600; // ISR: 6時間ごとに再生成

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

const CHARACTER_ID = config.profiles.ff14.characterId || "27095571";
const LODESTONE_BASE_URL = "https://jp.finalfantasyxiv.com";
const CHARACTER_URL = `${LODESTONE_BASE_URL}/lodestone/character/${CHARACTER_ID}/`;
const CLASS_JOB_URL = `${LODESTONE_BASE_URL}/lodestone/character/${CHARACTER_ID}/class_job/`;

const FETCH_TIMEOUT = 15000;

// ジョブ名の英語→日本語マッピング
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

// ロール名の英語→日本語マッピング
const ROLE_NAME_MAP: Record<string, string> = {
    "Tank": "タンク",
    "Healer": "ヒーラー",
    "Melee DPS": "近接DPS",
    "Physical Ranged DPS": "遠隔物理DPS",
    "Magical Ranged DPS": "遠隔魔法DPS",
    "Crafter": "クラフター",
    "Gatherer": "ギャザラー",
};

async function fetchWithTimeout(url: string, timeout: number = FETCH_TIMEOUT): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "ja,en;q=0.9",
            },
            signal: controller.signal,
            next: { revalidate: 3600 },
        });
        return response;
    } finally {
        clearTimeout(timeoutId);
    }
}

async function scrapeCharacterPage(): Promise<Partial<FF14Character>> {
    const response = await fetchWithTimeout(CHARACTER_URL);
    if (!response.ok) {
        throw new Error(`Failed to fetch character page: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // キャラクター名
    const name = $(".frame__chara__name").text().trim();

    // サーバー（ホームワールド）
    const serverText = $(".frame__chara__world").text().trim();
    const server = serverText.replace(/\s*\[.*\]$/, ""); // データセンター名を除去

    // 種族/部族/性別
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

    // アバター画像
    const avatarImg = $(".character-block__face").attr("src") ||
                      $(".frame__chara__face img").attr("src") || "";

    // ポートレート画像（アバターURLから変換）
    const portrait = avatarImg.replace("fc0.jpg", "fl0.jpg").replace("_96x96", "_640x873");

    // フリーカンパニー
    let freeCompany: FF14Character["freeCompany"] | undefined;
    const fcBlock = $(".character__freecompany__name");
    if (fcBlock.length > 0) {
        const fcName = fcBlock.find("a").text().trim();
        const fcLink = fcBlock.find("a").attr("href") || "";
        const fcIdMatch = fcLink.match(/freecompany\/(\d+)/);
        freeCompany = {
            id: fcIdMatch ? fcIdMatch[1] : "0",
            name: fcName,
            tag: "", // タグは別途取得が必要
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
    const response = await fetchWithTimeout(CLASS_JOB_URL);
    if (!response.ok) {
        throw new Error(`Failed to fetch class/job page: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const classJobs: FF14Character["classJobs"] = [];
    let jobIndex = 0;

    // 各ジョブリスト（ul.character__job）を処理
    $("ul.character__job").each((_, ulElement) => {
        const $ul = $(ulElement);

        // 直前のh4.heading--leadからロール名を取得
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

            // 経験値パース (例: "1,234,567 / 2,000,000")
            let expLevel = 0;
            let expLevelMax = 0;
            if (expText && expText !== "-- / --") {
                const expMatch = expText.match(/([\d,]+)\s*\/\s*([\d,]+)/);
                if (expMatch) {
                    expLevel = parseInt(expMatch[1].replace(/,/g, "")) || 0;
                    expLevelMax = parseInt(expMatch[2].replace(/,/g, "")) || 0;
                }
            }

            // ジョブ名から「/ クラス名」を除去（例: "ナイト / 剣術士" → "ナイト"）
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

export async function GET() {
    try {
        console.log(`Scraping Lodestone character: ${CHARACTER_ID}`);

        // キャラクターページとジョブページを並列で取得
        const [characterData, classJobs] = await Promise.all([
            scrapeCharacterPage(),
            scrapeClassJobPage(),
        ]);

        // アクティブジョブ（最高レベルのジョブ）を特定
        const sortedJobs = [...classJobs].sort((a, b) => b.level - a.level);
        const activeJob = sortedJobs[0] || {
            id: 0,
            name: "冒険者",
            level: 1,
            icon: "",
        };

        const character: FF14Character = {
            id: characterData.id || parseInt(CHARACTER_ID),
            name: characterData.name || config.profiles.ff14.characterName,
            server: characterData.server || config.profiles.ff14.server,
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
            minions: 0, // 別ページ要アクセス
            mounts: 0,  // 別ページ要アクセス
            achievementPoints: 0, // 別ページ要アクセス
            lastUpdated: new Date().toISOString(),
        };

        return NextResponse.json(character);
    } catch (error) {
        console.error("Error scraping Lodestone:", error);

        // フォールバック: モックデータを返す
        return NextResponse.json(getMockCharacterData());
    }
}

// APIエラー時のモックデータ
function getMockCharacterData(): FF14Character {
    return {
        id: parseInt(CHARACTER_ID),
        name: config.profiles.ff14.characterName,
        server: config.profiles.ff14.server,
        avatar: "",
        portrait: "",
        bio: "",
        race: "ララフェル",
        tribe: "プレーンフォーク",
        gender: "男性",
        activeClassJob: {
            id: 27,
            name: "召喚士",
            level: 100,
            icon: "https://lds-img.finalfantasyxiv.com/h/7/WdFey0jyHn9Nnt1Qnm-J3yTg5s.png",
        },
        classJobs: [
            { id: 0, name: "ナイト", level: 90, expLevel: 0, expLevelMax: 13278000, expLevelTogo: 13278000, isSpecialised: false, icon: "https://lds-img.finalfantasyxiv.com/h/E/d0Tx-vhnsMYfYpGe9MvslemEfg.png", role: "タンク" },
            { id: 1, name: "戦士", level: 50, expLevel: 394476, expLevelMax: 421000, expLevelTogo: 26524, isSpecialised: false, icon: "https://lds-img.finalfantasyxiv.com/h/y/A3UhbjZvDeN3tf_6nJ85VP0RY0.png", role: "タンク" },
            { id: 2, name: "暗黒騎士", level: 86, expLevel: 8874036, expLevelMax: 9231000, expLevelTogo: 356964, isSpecialised: false, icon: "https://lds-img.finalfantasyxiv.com/h/l/5CZEvDOMYMyVn2td9LZigsgw9s.png", role: "タンク" },
            { id: 3, name: "ガンブレイカー", level: 68, expLevel: 1767750, expLevelMax: 2317000, expLevelTogo: 549250, isSpecialised: false, icon: "https://lds-img.finalfantasyxiv.com/h/8/hg8ofSSOKzqng290No55trV4mI.png", role: "タンク" },
            { id: 4, name: "白魔道士", level: 55, expLevel: 771668, expLevelMax: 837000, expLevelTogo: 65332, isSpecialised: false, icon: "https://lds-img.finalfantasyxiv.com/h/7/i20QvSPcSQTybykLZDbQCgPwMw.png", role: "ヒーラー" },
            { id: 5, name: "学者", level: 100, expLevel: 0, expLevelMax: 0, expLevelTogo: 0, isSpecialised: false, icon: "https://lds-img.finalfantasyxiv.com/h/7/WdFey0jyHn9Nnt1Qnm-J3yTg5s.png", role: "ヒーラー" },
            { id: 6, name: "占星術師", level: 92, expLevel: 2731946, expLevelMax: 15348000, expLevelTogo: 12616054, isSpecialised: false, icon: "https://lds-img.finalfantasyxiv.com/h/1/erCgjnMSiab4LiHpWxVc-tXAqk.png", role: "ヒーラー" },
            { id: 7, name: "賢者", level: 70, expLevel: 216000, expLevelMax: 2923000, expLevelTogo: 2707000, isSpecialised: false, icon: "https://lds-img.finalfantasyxiv.com/h/g/_oYApASVVReLLmsokuCJGkEpk0.png", role: "ヒーラー" },
            { id: 8, name: "モンク", level: 70, expLevel: 1847984, expLevelMax: 2923000, expLevelTogo: 1075016, isSpecialised: false, icon: "https://lds-img.finalfantasyxiv.com/h/K/HW6tKOg4SOJbL8Z20GnsAWNjjM.png", role: "近接DPS" },
            { id: 9, name: "竜騎士", level: 72, expLevel: 0, expLevelMax: 3153000, expLevelTogo: 3153000, isSpecialised: false, icon: "https://lds-img.finalfantasyxiv.com/h/m/gX4OgBIHw68UcMU79P7LYCpldA.png", role: "近接DPS" },
            { id: 10, name: "忍者", level: 80, expLevel: 5553368, expLevelMax: 5992000, expLevelTogo: 438632, isSpecialised: false, icon: "https://lds-img.finalfantasyxiv.com/h/0/Fso5hanZVEEAaZ7OGWJsXpf3jw.png", role: "近接DPS" },
            { id: 11, name: "侍", level: 80, expLevel: 2996000, expLevelMax: 5992000, expLevelTogo: 2996000, isSpecialised: false, icon: "https://lds-img.finalfantasyxiv.com/h/m/KndG72XtCFwaq1I1iqwcmO_0zc.png", role: "近接DPS" },
            { id: 12, name: "リーパー", level: 90, expLevel: 0, expLevelMax: 13278000, expLevelTogo: 13278000, isSpecialised: false, icon: "https://lds-img.finalfantasyxiv.com/h/7/cLlXUaeMPJDM2nBhIeM-uDmPzM.png", role: "近接DPS" },
            { id: 13, name: "吟遊詩人", level: 90, expLevel: 0, expLevelMax: 13278000, expLevelTogo: 13278000, isSpecialised: false, icon: "https://lds-img.finalfantasyxiv.com/h/F/KWI-9P3RX_Ojjn_mwCS2N0-3TI.png", role: "遠隔物理DPS" },
            { id: 14, name: "機工士", level: 52, expLevel: 466175, expLevelMax: 580000, expLevelTogo: 113825, isSpecialised: false, icon: "https://lds-img.finalfantasyxiv.com/h/E/vmtbIlf6Uv8rVp2YFCWA25X0dc.png", role: "遠隔物理DPS" },
            { id: 15, name: "黒魔道士", level: 72, expLevel: 0, expLevelMax: 3153000, expLevelTogo: 3153000, isSpecialised: false, icon: "https://lds-img.finalfantasyxiv.com/h/P/V01m8YRBYcIs5vgbRtpDiqltSE.png", role: "遠隔魔法DPS" },
            { id: 16, name: "召喚士", level: 100, expLevel: 0, expLevelMax: 0, expLevelTogo: 0, isSpecialised: false, icon: "https://lds-img.finalfantasyxiv.com/h/h/4ghjpyyuNelzw1Bl0sM_PBA_FE.png", role: "遠隔魔法DPS" },
            { id: 17, name: "赤魔道士", level: 80, expLevel: 3451000, expLevelMax: 5992000, expLevelTogo: 2541000, isSpecialised: false, icon: "https://lds-img.finalfantasyxiv.com/h/q/s3MlLUKmRAHy0pH57PnFStHmIw.png", role: "遠隔魔法DPS" },
        ],
        freeCompany: {
            id: "9227875636482261111",
            name: "Re:union",
            tag: "",
        },
        minions: 0,
        mounts: 0,
        achievementPoints: 0,
        lastUpdated: new Date().toISOString(),
    };
}
