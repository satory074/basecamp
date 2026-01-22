import { NextResponse } from "next/server";
import { config } from "@/app/lib/config";
import { readFile } from 'fs/promises';
import path from 'path';
import type { TenhouStats, NodocchiGame, NodocchiResponse } from "@/app/lib/tenhou-types";

export const revalidate = 1800; // ISR: 30分ごとに再生成

export async function GET() {
    const username = config.profiles.tenhou.username;

    try {
        // nodocchi.moe APIからデータを取得
        const stats = await fetchNodocchiStats(username);
        return NextResponse.json(stats);
    } catch (error) {
        console.error('Error fetching from nodocchi API:', error);

        // フォールバック: 保存されたデータを確認
        try {
            const savedStats = await getSavedStats();
            if (savedStats) {
                return NextResponse.json({ ...savedStats, dataSource: 'cache' });
            }
        } catch {
            // 保存データも取得失敗
        }

        // 最終フォールバック: ハードコーデッドデータ
        const fallbackData: TenhouStats = {
            username: username,
            rank: "五段",
            rating: 1823,
            games: 496,
            placements: {
                first: 28.4,
                second: 24.0,
                third: 25.6,
                fourth: 22.0,
            },
            averageRank: 2.411,
            lastUpdated: new Date().toISOString(),
            dataSource: 'fallback',
        };

        return NextResponse.json(fallbackData);
    }
}

// nodocchi.moe APIから統計を取得
async function fetchNodocchiStats(username: string): Promise<TenhouStats> {
    const apiUrl = `https://nodocchi.moe/api/listuser.php?name=${encodeURIComponent(username)}`;

    const response = await fetch(apiUrl, {
        headers: {
            'User-Agent': 'Basecamp/1.0',
        },
        next: { revalidate: 1800 }, // 30分キャッシュ（ISRと同期）
    });

    if (!response.ok) {
        throw new Error(`nodocchi API error: ${response.status}`);
    }

    const data: NodocchiResponse = await response.json();

    if (!data.list || data.list.length === 0) {
        throw new Error('No game data found');
    }

    return convertNodocchiToStats(data);
}

// nodocchi APIレスポンスをTenhouStats形式に変換
function convertNodocchiToStats(data: NodocchiResponse): TenhouStats {
    const username = data.name;
    const rating = data.rate?.['4'] || 1500; // 4人麻雀のレーティング
    const rank = getRankFromRating(rating);

    // 4人麻雀のゲームのみをフィルタ
    const fourPlayerGames = data.list.filter(g => g.playernum === 4);

    // 順位を集計
    const placements = { 1: 0, 2: 0, 3: 0, 4: 0 };
    let totalPoints = 0;

    for (const game of fourPlayerGames) {
        const playerPosition = getPlayerPosition(game, username);
        if (playerPosition) {
            const points = [
                { pos: 1, ptr: parseFloat(game.player1ptr || '0') },
                { pos: 2, ptr: parseFloat(game.player2ptr || '0') },
                { pos: 3, ptr: parseFloat(game.player3ptr || '0') },
                { pos: 4, ptr: parseFloat(game.player4ptr || '0') },
            ].sort((a, b) => b.ptr - a.ptr);

            const rank = points.findIndex(p => p.pos === playerPosition) + 1;
            placements[rank as 1 | 2 | 3 | 4]++;

            // プレイヤーのポイントを加算
            const playerPtr = parseFloat(game[`player${playerPosition}ptr` as keyof NodocchiGame] as string || '0');
            totalPoints += playerPtr;
        }
    }

    const totalGames = Object.values(placements).reduce((a, b) => a + b, 0);

    // 順位分布（パーセンテージ）
    const placementPercentages = {
        first: totalGames > 0 ? (placements[1] / totalGames) * 100 : 0,
        second: totalGames > 0 ? (placements[2] / totalGames) * 100 : 0,
        third: totalGames > 0 ? (placements[3] / totalGames) * 100 : 0,
        fourth: totalGames > 0 ? (placements[4] / totalGames) * 100 : 0,
    };

    // 平均順位
    const averageRank = totalGames > 0
        ? (placements[1] * 1 + placements[2] * 2 + placements[3] * 3 + placements[4] * 4) / totalGames
        : 0;

    // 直近の対戦履歴（最新10戦）
    const recentGames = fourPlayerGames
        .sort((a, b) => b.starttime - a.starttime)
        .slice(0, 10);

    const recentMatches = recentGames.map(game => {
        const playerPosition = getPlayerPosition(game, username);
        const points = [
            { pos: 1, ptr: parseFloat(game.player1ptr || '0') },
            { pos: 2, ptr: parseFloat(game.player2ptr || '0') },
            { pos: 3, ptr: parseFloat(game.player3ptr || '0') },
            { pos: 4, ptr: parseFloat(game.player4ptr || '0') },
        ].sort((a, b) => b.ptr - a.ptr);

        const rank = playerPosition ? points.findIndex(p => p.pos === playerPosition) + 1 : 0;
        const score = playerPosition
            ? parseFloat(game[`player${playerPosition}ptr` as keyof NodocchiGame] as string || '0')
            : 0;

        return {
            date: new Date(game.starttime * 1000).toISOString(),
            position: rank,
            score: score,
            roomType: getRoomType(game),
        };
    });

    // 連勝・連敗の計算
    const streaks = calculateStreaks(recentMatches);

    return {
        username,
        rank,
        rating,
        games: totalGames,
        placements: {
            first: Math.round(placementPercentages.first * 10) / 10,
            second: Math.round(placementPercentages.second * 10) / 10,
            third: Math.round(placementPercentages.third * 10) / 10,
            fourth: Math.round(placementPercentages.fourth * 10) / 10,
        },
        totalPoints: Math.round(totalPoints * 10) / 10,
        averagePoints: totalGames > 0 ? Math.round((totalPoints / totalGames) * 100) / 100 : 0,
        averageRank: Math.round(averageRank * 1000) / 1000,
        lastUpdated: new Date().toISOString(),
        recentMatches,
        streaks,
        dataSource: 'nodocchi-api',
    };
}

// プレイヤーの位置（1-4）を取得
function getPlayerPosition(game: NodocchiGame, username: string): number | null {
    if (game.player1 === username) return 1;
    if (game.player2 === username) return 2;
    if (game.player3 === username) return 3;
    if (game.player4 === username) return 4;
    return null;
}

// レーティングから段位を計算
function getRankFromRating(rating: number): string {
    if (rating >= 2400) return "天鳳";
    if (rating >= 2300) return "十段";
    if (rating >= 2200) return "九段";
    if (rating >= 2100) return "八段";
    if (rating >= 2000) return "七段";
    if (rating >= 1900) return "六段";
    if (rating >= 1800) return "五段";
    if (rating >= 1700) return "四段";
    if (rating >= 1600) return "三段";
    if (rating >= 1500) return "二段";
    if (rating >= 1400) return "初段";
    return "新人";
}

// ルームタイプを取得
function getRoomType(game: NodocchiGame): string {
    const parts = [];

    // 人数
    parts.push(game.playernum === 4 ? "四" : "三");

    // 卓
    const levels = ["般", "上", "特", "鳳"];
    parts.push(levels[game.playerlevel] || "般");

    // 局数
    parts.push(game.playlength === 1 ? "東" : "南");

    // ルール
    if (game.kuitanari === 1) parts.push("喰");
    if (game.akaari === 1) parts.push("赤");

    return parts.join("");
}

// 連勝・連敗を計算
function calculateStreaks(recentMatches: { position: number }[]): TenhouStats['streaks'] {
    if (recentMatches.length === 0) {
        return {
            currentStreak: "",
            maxWinStreak: 0,
            maxLoseStreak: 0,
            currentTopStreak: 0,
            currentLastStreak: 0,
        };
    }

    let currentTopStreak = 0;
    let currentLastStreak = 0;
    let maxWinStreak = 0;
    let maxLoseStreak = 0;
    let tempWinStreak = 0;
    let tempLoseStreak = 0;

    for (const match of recentMatches) {
        if (match.position === 1) {
            tempWinStreak++;
            tempLoseStreak = 0;
            maxWinStreak = Math.max(maxWinStreak, tempWinStreak);
        } else if (match.position === 4) {
            tempLoseStreak++;
            tempWinStreak = 0;
            maxLoseStreak = Math.max(maxLoseStreak, tempLoseStreak);
        } else {
            tempWinStreak = 0;
            tempLoseStreak = 0;
        }
    }

    // 現在の連続
    for (const match of recentMatches) {
        if (match.position === 1) {
            currentTopStreak++;
        } else {
            break;
        }
    }

    for (const match of recentMatches) {
        if (match.position === 4) {
            currentLastStreak++;
        } else {
            break;
        }
    }

    const currentStreak = currentTopStreak > 0 ? "W" : currentLastStreak > 0 ? "L" : "";

    return {
        currentStreak,
        maxWinStreak,
        maxLoseStreak,
        currentTopStreak,
        currentLastStreak,
    };
}

// 保存されたデータを読み込む（フォールバック用）
async function getSavedStats(): Promise<TenhouStats | null> {
    try {
        const filePath = path.join(process.cwd(), 'public', 'data', 'tenhou-stats.json');
        const data = await readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch {
        // ファイルが存在しない場合はnullを返す
        return null;
    }
}

