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

