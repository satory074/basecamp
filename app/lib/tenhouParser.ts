// 天鳳の統計データパーサー

export interface TenhouGameLog {
    date: string;
    type: string; // "四般東喰赤" など
    position: number; // 1-4位
    score: number;
    players: string[];
}

export interface TenhouDetailedStats {
    // 基本情報
    username: string;
    rank: string;
    rating: number;
    games: number;
    
    // 順位分布
    placements: {
        first: number;
        second: number;
        third: number;
        fourth: number;
    };
    
    // 詳細統計
    winRate: number;      // 和了率
    dealInRate: number;   // 放銃率
    riichiRate: number;   // 立直率
    callRate: number;     // 副露率
    
    // 得点統計
    totalPoints: number;
    averagePoints: number;
    averageRank: number;
    
    // 追加統計
    maxWinStreak?: number;
    maxLoseStreak?: number;
    bestMonth?: string;
    worstMonth?: string;
    favoriteTime?: string;
    
    lastUpdated: string;
}

// nodocchi.moeのデータフォーマットをパース
export function parseNodocchiData(text: string): Partial<TenhouDetailedStats> {
    const stats: Partial<TenhouDetailedStats> = {};
    
    try {
        // 段位の抽出
        const rankRegex = /推定段位[^>]*>([^<]+段)(\d+)pt/;
        const rankMatch = text.match(rankRegex);
        if (rankMatch) {
            stats.rank = rankMatch[1];
            stats.rating = 1500 + parseInt(rankMatch[2]);
        }
        
        // 対戦数
        const gamesRegex = /段位戦(\d+)戦/;
        const gamesMatch = text.match(gamesRegex);
        if (gamesMatch) {
            stats.games = parseInt(gamesMatch[1]);
        }
        
        // 順位統計
        const placementRegex = /４人打ち(\d+)戦1位(\d+)戦.*?2位(\d+)戦.*?3位(\d+)戦.*?4位(\d+)戦/;
        const placementMatch = text.match(placementRegex);
        if (placementMatch && stats.games) {
            stats.placements = {
                first: (parseInt(placementMatch[2]) / stats.games * 100),
                second: (parseInt(placementMatch[3]) / stats.games * 100),
                third: (parseInt(placementMatch[4]) / stats.games * 100),
                fourth: (parseInt(placementMatch[5]) / stats.games * 100),
            };
        }
        
        // 得点統計
        const scoreRegex = /平得([\d.+-]+)平順([\d.]+)通得([\d+-]+)/;
        const scoreMatch = text.match(scoreRegex);
        if (scoreMatch) {
            stats.averagePoints = parseFloat(scoreMatch[1]);
            stats.averageRank = parseFloat(scoreMatch[2]);
            stats.totalPoints = parseInt(scoreMatch[3]);
        }
        
        // 連勝記録
        const winStreakRegex = /連続トップ(\d+)戦/;
        const winStreakMatch = text.match(winStreakRegex);
        if (winStreakMatch) {
            stats.maxWinStreak = parseInt(winStreakMatch[1]);
        }
        
        // 連敗記録
        const loseStreakRegex = /連続ラス(\d+)戦/;
        const loseStreakMatch = text.match(loseStreakRegex);
        if (loseStreakMatch) {
            stats.maxLoseStreak = parseInt(loseStreakMatch[1]);
        }
    } catch (error) {
        console.error("Error parsing nodocchi data:", error);
    }
    
    return stats;
}

// 天鳳のログURLからゲームデータを取得
export async function fetchTenhouLog(logId: string): Promise<TenhouGameLog | null> {
    try {
        const logUrl = `https://tenhou.net/0/log/?${logId}`;
        const response = await fetch(logUrl);
        
        if (!response.ok) {
            throw new Error("Failed to fetch log");
        }
        
        const xmlText = await response.text();
        // XMLパース処理（簡略化）
        // 実際には適切なXMLパーサーを使用
        
        return null; // 実装は省略
    } catch (error) {
        console.error("Error fetching tenhou log:", error);
        return null;
    }
}

// 統計の推定値を計算
export function estimateDetailedStats(basicStats: Partial<TenhouDetailedStats>): TenhouDetailedStats {
    const rank = basicStats.rank || "初段";
    
    // 段位に基づいた推定値
    const estimates: { [key: string]: Partial<TenhouDetailedStats> } = {
        "初段": { winRate: 22.0, dealInRate: 14.0, riichiRate: 18.0, callRate: 28.0 },
        "二段": { winRate: 22.8, dealInRate: 13.5, riichiRate: 18.5, callRate: 27.0 },
        "三段": { winRate: 23.5, dealInRate: 13.0, riichiRate: 19.0, callRate: 26.5 },
        "四段": { winRate: 24.2, dealInRate: 12.5, riichiRate: 19.8, callRate: 25.6 },
        "五段": { winRate: 25.0, dealInRate: 12.0, riichiRate: 20.5, callRate: 24.5 },
        "六段": { winRate: 25.8, dealInRate: 11.5, riichiRate: 21.0, callRate: 23.5 },
        "七段": { winRate: 26.5, dealInRate: 11.0, riichiRate: 21.5, callRate: 22.5 },
        "八段": { winRate: 27.2, dealInRate: 10.5, riichiRate: 22.0, callRate: 21.5 },
        "九段": { winRate: 28.0, dealInRate: 10.0, riichiRate: 22.5, callRate: 20.5 },
        "十段": { winRate: 28.8, dealInRate: 9.5, riichiRate: 23.0, callRate: 19.5 },
        "天鳳位": { winRate: 30.0, dealInRate: 9.0, riichiRate: 24.0, callRate: 18.0 },
    };
    
    const estimate = estimates[rank] || estimates["初段"];
    
    return {
        username: basicStats.username || "Unknown",
        rank: rank,
        rating: basicStats.rating || 1500,
        games: basicStats.games || 0,
        placements: basicStats.placements || { first: 25, second: 25, third: 25, fourth: 25 },
        winRate: estimate.winRate!,
        dealInRate: estimate.dealInRate!,
        riichiRate: estimate.riichiRate!,
        callRate: estimate.callRate!,
        totalPoints: basicStats.totalPoints || 0,
        averagePoints: basicStats.averagePoints || 0,
        averageRank: basicStats.averageRank || 2.5,
        lastUpdated: new Date().toISOString(),
        ...basicStats,
    };
}