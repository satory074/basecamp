import { config } from "../config";
import type { TenhouStats, NodocchiGame, NodocchiResponse } from "../tenhou-types";
import { fetchWithTimeout } from "../fetch-with-timeout";
import { readFeedJson } from "../feed-storage";

function getPlayerPosition(game: NodocchiGame, username: string): number | null {
    if (game.player1 === username) return 1;
    if (game.player2 === username) return 2;
    if (game.player3 === username) return 3;
    if (game.player4 === username) return 4;
    return null;
}

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

function getRoomType(game: NodocchiGame): string {
    const parts = [];
    parts.push(game.playernum === 4 ? "四" : "三");
    const levels = ["般", "上", "特", "鳳"];
    parts.push(levels[game.playerlevel] || "般");
    parts.push(game.playlength === 1 ? "東" : "南");
    if (game.kuitanari === 1) parts.push("喰");
    if (game.akaari === 1) parts.push("赤");
    return parts.join("");
}

function calculateStreaks(recentMatches: { position: number }[]): TenhouStats["streaks"] {
    if (recentMatches.length === 0) {
        return { currentStreak: "", maxWinStreak: 0, maxLoseStreak: 0, currentTopStreak: 0, currentLastStreak: 0 };
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
    for (const match of recentMatches) {
        if (match.position === 1) currentTopStreak++;
        else break;
    }
    for (const match of recentMatches) {
        if (match.position === 4) currentLastStreak++;
        else break;
    }
    const currentStreak = currentTopStreak > 0 ? "W" : currentLastStreak > 0 ? "L" : "";
    return { currentStreak, maxWinStreak, maxLoseStreak, currentTopStreak, currentLastStreak };
}

function convertNodocchiToStats(data: NodocchiResponse): TenhouStats {
    const username = data.name;
    const rating = data.rate?.["4"] || 1500;
    const rank = getRankFromRating(rating);
    const fourPlayerGames = data.list.filter((g) => g.playernum === 4);
    const placements = { 1: 0, 2: 0, 3: 0, 4: 0 };
    let totalPoints = 0;
    for (const game of fourPlayerGames) {
        const playerPosition = getPlayerPosition(game, username);
        if (playerPosition) {
            const points = [
                { pos: 1, ptr: parseFloat(game.player1ptr || "0") },
                { pos: 2, ptr: parseFloat(game.player2ptr || "0") },
                { pos: 3, ptr: parseFloat(game.player3ptr || "0") },
                { pos: 4, ptr: parseFloat(game.player4ptr || "0") },
            ].sort((a, b) => b.ptr - a.ptr);
            const r = points.findIndex((p) => p.pos === playerPosition) + 1;
            placements[r as 1 | 2 | 3 | 4]++;
            const playerPtr = parseFloat((game[`player${playerPosition}ptr` as keyof NodocchiGame] as string) || "0");
            totalPoints += playerPtr;
        }
    }
    const totalGames = Object.values(placements).reduce((a, b) => a + b, 0);
    const placementPercentages = {
        first: totalGames > 0 ? (placements[1] / totalGames) * 100 : 0,
        second: totalGames > 0 ? (placements[2] / totalGames) * 100 : 0,
        third: totalGames > 0 ? (placements[3] / totalGames) * 100 : 0,
        fourth: totalGames > 0 ? (placements[4] / totalGames) * 100 : 0,
    };
    const averageRank = totalGames > 0
        ? (placements[1] * 1 + placements[2] * 2 + placements[3] * 3 + placements[4] * 4) / totalGames
        : 0;
    const sortedFourPlayerGames = fourPlayerGames.sort((a, b) => b.starttime - a.starttime);
    const recentGames = sortedFourPlayerGames.slice(0, 10);
    const recentMatches = recentGames.map((game) => {
        const playerPosition = getPlayerPosition(game, username);
        const points = [
            { pos: 1, ptr: parseFloat(game.player1ptr || "0") },
            { pos: 2, ptr: parseFloat(game.player2ptr || "0") },
            { pos: 3, ptr: parseFloat(game.player3ptr || "0") },
            { pos: 4, ptr: parseFloat(game.player4ptr || "0") },
        ].sort((a, b) => b.ptr - a.ptr);
        const r = playerPosition ? points.findIndex((p) => p.pos === playerPosition) + 1 : 0;
        const score = playerPosition
            ? parseFloat((game[`player${playerPosition}ptr` as keyof NodocchiGame] as string) || "0")
            : 0;
        return {
            date: new Date(game.starttime * 1000).toISOString(),
            position: r,
            score,
            roomType: getRoomType(game),
        };
    });
    const recent50Games = sortedFourPlayerGames.slice(0, 50);
    let recent50RankSum = 0;
    let recent50Count = 0;
    for (const game of recent50Games) {
        const playerPos = getPlayerPosition(game, username);
        if (playerPos) {
            const pts = [
                { pos: 1, ptr: parseFloat(game.player1ptr || "0") },
                { pos: 2, ptr: parseFloat(game.player2ptr || "0") },
                { pos: 3, ptr: parseFloat(game.player3ptr || "0") },
                { pos: 4, ptr: parseFloat(game.player4ptr || "0") },
            ].sort((a, b) => b.ptr - a.ptr);
            const r = pts.findIndex((p) => p.pos === playerPos) + 1;
            recent50RankSum += r;
            recent50Count++;
        }
    }
    const recent50AverageRank = recent50Count > 0
        ? Math.round((recent50RankSum / recent50Count) * 1000) / 1000
        : undefined;
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
        recent50AverageRank,
        lastUpdated: new Date().toISOString(),
        recentMatches,
        streaks,
        dataSource: "nodocchi-api",
    };
}

async function fetchNodocchiStats(username: string): Promise<TenhouStats> {
    const apiUrl = `https://nodocchi.moe/api/listuser.php?name=${encodeURIComponent(username)}`;
    const response = await fetchWithTimeout(apiUrl, {
        headers: { "User-Agent": "Basecamp/1.0" },
        timeoutMs: 10000,
    });
    if (!response.ok) throw new Error(`nodocchi API error: ${response.status}`);
    const data: NodocchiResponse = await response.json();
    if (!data.list || data.list.length === 0) throw new Error("No game data found");
    return convertNodocchiToStats(data);
}

export async function getTenhouStats(): Promise<TenhouStats> {
    const username = config.profiles.tenhou.username;
    try {
        return await fetchNodocchiStats(username);
    } catch {
        try {
            const saved = await readFeedJson<TenhouStats>("tenhou-stats.json");
            return { ...saved, dataSource: "cache" };
        } catch {
            return {
                username,
                rank: "五段",
                rating: 1823,
                games: 496,
                placements: { first: 28.4, second: 24.0, third: 25.6, fourth: 22.0 },
                averageRank: 2.411,
                recent50AverageRank: 2.411,
                lastUpdated: new Date().toISOString(),
                dataSource: "fallback",
            };
        }
    }
}
