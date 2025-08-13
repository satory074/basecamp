import { NextResponse } from "next/server";
import { config } from "@/app/lib/config";

export const revalidate = 3600; // ISR: 1時間ごとに再検証

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

export async function GET() {
    try {
        const { characterName, server } = config.profiles.ff14;
        
        // まずキャラクターを検索
        const searchUrl = `https://xivapi.com/character/search?name=${encodeURIComponent(characterName)}&server=${server}`;
        
        console.log(`Searching for character: ${characterName} on server: ${server}`);
        
        const searchResponse = await fetch(searchUrl, {
            next: { revalidate: 3600 },
            headers: {
                "User-Agent": "Basecamp/1.0",
                "Accept": "application/json",
            },
        });

        if (!searchResponse.ok) {
            console.error(`Search failed with status: ${searchResponse.status}`);
            
            // 403エラーの場合はレート制限の可能性
            if (searchResponse.status === 403) {
                // モックデータを返す
                return NextResponse.json(getMockCharacterData());
            }
            
            throw new Error(`Failed to search character: ${searchResponse.status}`);
        }

        const searchData = await searchResponse.json();
        
        if (!searchData.Results || searchData.Results.length === 0) {
            throw new Error("Character not found");
        }

        // 最初の検索結果を使用
        const characterId = searchData.Results[0].ID;
        
        // キャラクターの詳細情報を取得
        const characterUrl = `https://xivapi.com/character/${characterId}?data=AC,CJ,MIMO&extended=1`;
        
        const characterResponse = await fetch(characterUrl, {
            next: { revalidate: 3600 },
            headers: {
                "User-Agent": "Basecamp/1.0",
            },
        });

        if (!characterResponse.ok) {
            throw new Error(`Failed to fetch character data: ${characterResponse.status}`);
        }

        const characterData = await characterResponse.json();
        
        // データを整形
        const character: FF14Character = {
            id: characterData.Character.ID,
            name: characterData.Character.Name,
            server: characterData.Character.Server,
            avatar: characterData.Character.Avatar,
            portrait: characterData.Character.Portrait,
            bio: characterData.Character.Bio || "",
            race: characterData.Character.Race.Name,
            tribe: characterData.Character.Tribe.Name,
            gender: characterData.Character.Gender === 1 ? "男性" : "女性",
            activeClassJob: {
                id: characterData.Character.ActiveClassJob.JobID,
                name: characterData.Character.ActiveClassJob.Name,
                level: characterData.Character.ActiveClassJob.Level,
                icon: `https://xivapi.com${characterData.Character.ActiveClassJob.Job.Icon}`,
            },
            classJobs: characterData.Character.ClassJobs.map((job: {
                JobID: number;
                Job?: { Name: string; Icon: string };
                Class?: { Name: string };
                Level: number;
                ExpLevel: number;
                ExpLevelMax: number;
                ExpLevelTogo: number;
                IsSpecialised?: boolean;
            }) => ({
                id: job.JobID,
                name: job.Job?.Name || job.Class?.Name || "Unknown",
                level: job.Level,
                expLevel: job.ExpLevel,
                expLevelMax: job.ExpLevelMax,
                expLevelTogo: job.ExpLevelTogo,
                isSpecialised: job.IsSpecialised || false,
                icon: job.Job?.Icon ? `https://xivapi.com${job.Job.Icon}` : "",
            })).filter((job) => job.level > 0), // レベル0のジョブは除外
            minions: characterData.Minions ? characterData.Minions.length : 0,
            mounts: characterData.Mounts ? characterData.Mounts.length : 0,
            achievementPoints: characterData.AchievementPoints || 0,
            lastUpdated: new Date().toISOString(),
        };

        // Free Companyの情報があれば追加
        if (characterData.Character.FreeCompanyId) {
            character.freeCompany = {
                id: characterData.Character.FreeCompanyId,
                name: characterData.FreeCompanyName || "",
                tag: characterData.Character.FreeCompanyTag || "",
            };
        }

        // Lodestone URLを設定
        if (!config.profiles.ff14.lodestoneUrl) {
            config.profiles.ff14.lodestoneUrl = `https://jp.finalfantasyxiv.com/lodestone/character/${characterId}/`;
        }

        return NextResponse.json(character);
    } catch (error) {
        console.error("Error fetching FF14 data:", error);
        
        // フォールバック: モックデータを返す
        return NextResponse.json(getMockCharacterData());
    }
}

// APIエラー時のモックデータ
function getMockCharacterData(): FF14Character {
    return {
        id: 0,
        name: config.profiles.ff14.characterName,
        server: config.profiles.ff14.server,
        avatar: "https://img2.finalfantasyxiv.com/f/1b4e2512bf73d0cb17318a4731a4064e_fc9949a2f7414a625d7bfa97e6e1717efc0_96x96.jpg",
        portrait: "https://img2.finalfantasyxiv.com/f/1b4e2512bf73d0cb17318a4731a4064e_fc9949a2f7414a625d7bfa97e6e1717efl0_640x873.jpg",
        bio: "光の戦士として世界を救う冒険を続けています",
        race: "ヒューラン",
        tribe: "ミッドランダー",
        gender: "女性",
        activeClassJob: {
            id: 24,
            name: "白魔道士",
            level: 90,
            icon: "https://xivapi.com/cj/1/whitemage.png",
        },
        classJobs: [
            {
                id: 24,
                name: "白魔道士",
                level: 90,
                expLevel: 0,
                expLevelMax: 0,
                expLevelTogo: 0,
                isSpecialised: false,
                icon: "https://xivapi.com/cj/1/whitemage.png",
            },
            {
                id: 21,
                name: "学者",
                level: 80,
                expLevel: 1000000,
                expLevelMax: 3000000,
                expLevelTogo: 2000000,
                isSpecialised: false,
                icon: "https://xivapi.com/cj/1/scholar.png",
            },
            {
                id: 33,
                name: "占星術師",
                level: 70,
                expLevel: 500000,
                expLevelMax: 2000000,
                expLevelTogo: 1500000,
                isSpecialised: false,
                icon: "https://xivapi.com/cj/1/astrologian.png",
            },
        ],
        freeCompany: {
            id: "0",
            name: "Twilight Adventurers",
            tag: "TWLT",
        },
        minions: 150,
        mounts: 75,
        achievementPoints: 12500,
        lastUpdated: new Date().toISOString(),
    };
}