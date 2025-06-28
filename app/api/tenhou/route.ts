import { NextResponse } from "next/server";
import { config } from "@/app/lib/config";

export const revalidate = 3600; // ISR: 1時間ごとに再検証

interface TenhouStats {
    username: string;
    rank: string;
    rating: number;
    games: number;
    placements: {
        first: number;
        second: number;
        third: number;
        fourth: number;
    };
    winRate: number;
    dealInRate: number;
    riichiRate: number;
    callRate: number;
    lastUpdated: string;
}

export async function GET() {
    try {
        const username = config.profiles.tenhou.username;
        
        // arcturus.suのランキングツールからデータを取得
        const statsUrl = `http://arcturus.su/tenhou/ranking/ranking.pl?name=${username}&lang=en`;
        
        const response = await fetch(statsUrl, {
            next: { revalidate: 3600 },
            headers: {
                "User-Agent": "Basecamp/1.0",
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch Tenhou stats: ${response.status}`);
        }

        const html = await response.text();
        
        // HTMLから統計情報を抽出
        const stats = parseTenhouStats(html, username);
        
        return NextResponse.json(stats);
    } catch (error) {
        console.error("Error fetching Tenhou data:", error);
        
        // フォールバック: 基本情報のみ返す
        return NextResponse.json({
            username: config.profiles.tenhou.username,
            rank: "不明",
            rating: 0,
            games: 0,
            placements: {
                first: 0,
                second: 0,
                third: 0,
                fourth: 0,
            },
            winRate: 0,
            dealInRate: 0,
            riichiRate: 0,
            callRate: 0,
            lastUpdated: new Date().toISOString(),
        });
    }
}

function parseTenhouStats(html: string, username: string): TenhouStats {
    // デフォルト値
    const stats: TenhouStats = {
        username,
        rank: "不明",
        rating: 0,
        games: 0,
        placements: {
            first: 0,
            second: 0,
            third: 0,
            fourth: 0,
        },
        winRate: 0,
        dealInRate: 0,
        riichiRate: 0,
        callRate: 0,
        lastUpdated: new Date().toISOString(),
    };

    try {
        // 段位とレーティングの抽出
        const rankMatch = html.match(/Current rank:[^>]*>([^<]+)</);
        if (rankMatch) {
            stats.rank = rankMatch[1].trim();
        }

        const ratingMatch = html.match(/R(\d+)/);
        if (ratingMatch) {
            stats.rating = parseInt(ratingMatch[1]);
        }

        // ゲーム数の抽出
        const gamesMatch = html.match(/Total games played:[^>]*>(\d+)</);
        if (gamesMatch) {
            stats.games = parseInt(gamesMatch[1]);
        }

        // 順位分布の抽出 (1st/2nd/3rd/4th)
        const placementMatches = html.matchAll(/(\d+(?:\.\d+)?)\s*%/g);
        const placements = Array.from(placementMatches).map(m => parseFloat(m[1]));
        if (placements.length >= 4) {
            stats.placements.first = placements[0];
            stats.placements.second = placements[1];
            stats.placements.third = placements[2];
            stats.placements.fourth = placements[3];
        }

        // その他の統計の抽出
        const winRateMatch = html.match(/Win rate:[^>]*>(\d+(?:\.\d+)?)\s*%/);
        if (winRateMatch) {
            stats.winRate = parseFloat(winRateMatch[1]);
        }

        const dealInMatch = html.match(/Deal-in rate:[^>]*>(\d+(?:\.\d+)?)\s*%/);
        if (dealInMatch) {
            stats.dealInRate = parseFloat(dealInMatch[1]);
        }

        const riichiMatch = html.match(/Riichi rate:[^>]*>(\d+(?:\.\d+)?)\s*%/);
        if (riichiMatch) {
            stats.riichiRate = parseFloat(riichiMatch[1]);
        }

        const callMatch = html.match(/Call rate:[^>]*>(\d+(?:\.\d+)?)\s*%/);
        if (callMatch) {
            stats.callRate = parseFloat(callMatch[1]);
        }
    } catch (error) {
        console.error("Error parsing Tenhou stats:", error);
    }

    return stats;
}