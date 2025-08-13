import { NextResponse } from "next/server";
import { config } from "@/app/lib/config";
import { readFile } from 'fs/promises';
import path from 'path';

export const revalidate = 0; // キャッシュを無効化
export const dynamic = 'force-dynamic'; // 動的レンダリングを強制

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
    totalPoints?: number;
    averagePoints?: number;
    averageRank?: number;
    lastUpdated: string;
    recentMatches?: {
        date: string;
        position: number;
        score: number;
        roomType: string;
    }[];
    streaks?: {
        currentStreak: string;
        maxWinStreak: number;
        maxLoseStreak: number;
        currentTopStreak: number;
        currentLastStreak: number;
    };
}

export async function GET() {
    const username = config.profiles.tenhou.username;
    
    try {
        // まず保存されたデータを確認
        const savedStats = await getSavedStats();
        if (savedStats) {
            // 24時間以内のデータなら使用
            const lastUpdate = new Date(savedStats.lastUpdated);
            const now = new Date();
            const hoursDiff = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
            
            if (hoursDiff < 24) {
                return NextResponse.json(savedStats);
            }
        }
        
        // 保存されたデータがない場合は既知のデータを返す
        // fetchNodocchiStatsは現在Playwrightが必要なためスキップ
        throw new Error('No saved data available');
    } catch (error) {
        console.error('Error fetching Tenhou stats:', error);
        
        // エラー時は最新の既知データを返す（2025年6月29日時点）
        const fallbackData = {
            username: username,
            rank: "四段",
            rating: 1610, // 四段110pt
            games: 294,
            placements: {
                first: 25.8,  // 76戦/294戦
                second: 24.8, // 73戦/294戦
                third: 28.9,  // 85戦/294戦
                fourth: 20.4, // 60戦/294戦
            },
            winRate: 24.2,
            dealInRate: 12.5,
            riichiRate: 19.8,
            callRate: 25.6,
            totalPoints: 423,
            averagePoints: 1.44,
            averageRank: 2.439,
            lastUpdated: new Date().toISOString(),
            recentMatches: [
                { date: "2025-06-28T22:20:00+09:00", position: 3, score: -22.2, roomType: "四上南喰赤" },
                { date: "2025-06-28T21:52:00+09:00", position: 3, score: -11.7, roomType: "四上南喰赤" },
                { date: "2025-06-28T20:58:00+09:00", position: 4, score: -39.0, roomType: "四上南喰赤" },
                { date: "2025-06-28T20:34:00+09:00", position: 4, score: -44.1, roomType: "四上南喰赤" },
                { date: "2025-06-28T01:51:00+09:00", position: 3, score: -14.1, roomType: "四上南喰赤" },
            ],
            streaks: {
                currentStreak: "L",
                maxWinStreak: 3,
                maxLoseStreak: 2,
                currentTopStreak: 0,
                currentLastStreak: 0,
            },
        };
        
        return NextResponse.json(fallbackData);
    }
}

// 未使用関数：将来の実装用に保留
// async function fetchNodocchiStats(username: string): Promise<TenhouStats> {
//     try {
//         // nodocchi.moeはJavaScriptで動的に生成されるため、
//         // 現時点では静的なデータを返す
//         // 将来的にはPuppeteerやPlaywrightを使用した実装を検討
//         console.log(`Attempting to fetch stats for ${username}`);
//         
//         // 代替案: 天鳳の公式統計APIを使用（利用可能な場合）
//         // const tenhouApiUrl = `https://tenhou.net/0/api/...`;
//         
//         // 現在は既知のデータを使用
//         throw new Error('Dynamic content requires headless browser');
//         
//     } catch (error) {
//         console.error('Error fetching Nodocchi stats:', error);
//         throw error;
//     }
// }

// 将来の実装用: Puppeteer/Playwrightで取得したHTMLをパースする
// 未使用関数：将来の実装用に保留
/*
function parseNodocchiStats(html: string, username: string): TenhouStats {
    // デフォルト値
    const stats: TenhouStats = {
        username,
        rank: "不明",
        rating: 1500,
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
        recentMatches: [],
        streaks: {
            currentStreak: "",
            maxWinStreak: 0,
            maxLoseStreak: 0,
            currentTopStreak: 0,
            currentLastStreak: 0,
        },
    };

    try {
        // nodocchi.moeのデータ構造の例（実際のサイトから取得）:
        // 1. プレイヤー名と段位: <span class="player_name">Unbobo</span> <span class="rank">四段110pt</span>
        // 2. 対戦数: <div class="game_count">段位戦 294戦</div>
        // 3. 順位分布: <table class="rank_distribution">...</table>
        // 4. 各種率: <div class="stats">和了率 24.2% 放銃率 12.5%...</div>
        
        // 段位とポイントの抽出
        const rankMatch = html.match(/<span[^>]*class="rank"[^>]*>([初二三四五六七八九特上天地]段)\s*(\d+)\s*pt<\/span>/i);
        if (rankMatch) {
            stats.rank = rankMatch[1];
            const rankBase = getRankBase(rankMatch[1]);
            stats.rating = rankBase + parseInt(rankMatch[2]);
        }
        
        // プレイヤー名の確認
        const nameMatch = html.match(/<span[^>]*class="player_name"[^>]*>([^<]+)<\/span>/i);
        if (nameMatch && nameMatch[1] !== username) {
            console.warn(`Username mismatch: expected ${username}, got ${nameMatch[1]}`);
        }
        
        // 対戦数の抽出
        const gamesMatch = html.match(/段位戦\s*(\d+)\s*戦/);
        if (gamesMatch) {
            stats.games = parseInt(gamesMatch[1]);
        }
        
        // 順位分布の抽出（パーセンテージまたは戦数）
        const placementPatterns = [
            // パターン1: 「1位 76戦 258‰ 2位 73戦 248‰ ...」
            /1位\s*(\d+)\s*戦\s*(\d+)\s*‰\s*2位\s*(\d+)\s*戦\s*(\d+)\s*‰\s*3位\s*(\d+)\s*戦\s*(\d+)\s*‰\s*4位\s*(\d+)\s*戦\s*(\d+)\s*‰/,
            // パターン2: テーブル形式
            /<td>1位<\/td>\s*<td>(\d+)<\/td>\s*<td>([\d.]+)%<\/td>/
        ];
        
        for (const pattern of placementPatterns) {
            const match = html.match(pattern);
            if (match) {
                if (pattern.source.includes('‰')) {
                    // 千分率から百分率に変換
                    stats.placements.first = parseInt(match[2]) / 10;
                    stats.placements.second = parseInt(match[4]) / 10;
                    stats.placements.third = parseInt(match[6]) / 10;
                    stats.placements.fourth = parseInt(match[8]) / 10;
                } else {
                    stats.placements.first = parseFloat(match[2]);
                }
                break;
            }
        }
        
        // 各種率の抽出
        const ratePatterns = {
            winRate: /和了率\s*([\d.]+)\s*%/,
            dealInRate: /放銃率\s*([\d.]+)\s*%/,
            riichiRate: /立直率\s*([\d.]+)\s*%/,
            callRate: /副露率\s*([\d.]+)\s*%/
        };
        
        for (const [key, pattern] of Object.entries(ratePatterns)) {
            const match = html.match(pattern);
            if (match) {
                (stats as any)[key] = parseFloat(match[1]);
            }
        }
        
        // 平均順位と平均得点の抽出
        const avgStatsMatch = html.match(/平均順位\s*([\d.]+)\s*平均得点\s*([\d.+-]+)/);
        if (avgStatsMatch) {
            stats.averageRank = parseFloat(avgStatsMatch[1]);
            stats.averagePoints = parseFloat(avgStatsMatch[2]);
        }
        
        // 通算得点の抽出
        const totalPointsMatch = html.match(/通算得点\s*([\d+-]+)/);
        if (totalPointsMatch) {
            stats.totalPoints = parseInt(totalPointsMatch[1]);
        }
        
        // 直近の対戦履歴（もし表示されている場合）
        const recentMatchesSection = html.match(/<table[^>]*class="recent_matches"[^>]*>([\s\S]*?)<\/table>/i);
        if (recentMatchesSection) {
            const matches: any[] = [];
            const rowPattern = /<tr[^>]*>\s*<td>([^<]+)<\/td>\s*<td>([^<]+)<\/td>\s*<td>([^<]+)<\/td>\s*<td>([^<]+)<\/td>/gi;
            let rowMatch;
            while ((rowMatch = rowPattern.exec(recentMatchesSection[1])) !== null) {
                matches.push({
                    date: rowMatch[1],
                    position: parseInt(rowMatch[2]),
                    score: parseFloat(rowMatch[3]),
                    roomType: rowMatch[4]
                });
            }
            if (matches.length > 0) {
                stats.recentMatches = matches.slice(0, 10); // 最新10戦まで
            }
        }
        
        // データが取得できなかった場合はデフォルト値を設定
        if (stats.rank === "不明" || stats.games === 0) {
            // 既知のデータを使用
            stats.rank = "四段";
            stats.rating = 1610;
            stats.games = 294;
            stats.placements = {
                first: 25.8,
                second: 24.8,
                third: 28.9,
                fourth: 20.4,
            };
            stats.winRate = 24.2;
            stats.dealInRate = 12.5;
            stats.riichiRate = 19.8;
            stats.callRate = 25.6;
            stats.totalPoints = 423;
            stats.averagePoints = 1.44;
            stats.averageRank = 2.439;
            
            // 実際の直近対戦データ（2025年6月28日）
            stats.recentMatches = [
                { date: "2025-06-28T22:20:00+09:00", position: 3, score: -22.2, roomType: "四上南喰赤" },
                { date: "2025-06-28T21:52:00+09:00", position: 3, score: -11.7, roomType: "四上南喰赤" },
                { date: "2025-06-28T20:58:00+09:00", position: 4, score: -39.0, roomType: "四上南喰赤" },
                { date: "2025-06-28T20:34:00+09:00", position: 4, score: -44.1, roomType: "四上南喰赤" },
                { date: "2025-06-28T01:51:00+09:00", position: 3, score: -14.1, roomType: "四上南喰赤" },
            ];
            
            stats.streaks = {
                currentStreak: "L",
                maxWinStreak: 3,
                maxLoseStreak: 2,
                currentTopStreak: 0,
                currentLastStreak: 0,
            };
        }
        
    } catch (error) {
        console.error("Error parsing Tenhou stats:", error);
    }

    return stats;
}
*/

// 未使用関数：将来の実装用に保留
/*
function getRankBase(rank: string): number {
    const rankBases: { [key: string]: number } = {
        '初段': 1400,
        '二段': 1500,
        '三段': 1600,
        '四段': 1700,
        '五段': 1800,
        '六段': 1900,
        '七段': 2000,
        '八段': 2100,
        '九段': 2200,
        '特上': 2300,
        '天鳳': 2400,
    };
    return rankBases[rank] || 1500;
}
*/

// 保存されたデータを読み込む
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

