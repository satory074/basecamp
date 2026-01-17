// 天鳳統計データの型定義

export interface TenhouStats {
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
    totalPoints?: number;
    averagePoints?: number;
    averageRank?: number;
    lastUpdated: string;
    recentMatches?: TenhouMatch[];
    streaks?: TenhouStreaks;
    dataSource?: 'nodocchi-api' | 'cache' | 'fallback';
}

export interface TenhouMatch {
    date: string;
    position: number;
    score: number;
    roomType: string;
}

export interface TenhouStreaks {
    currentStreak: string;
    maxWinStreak: number;
    maxLoseStreak: number;
    currentTopStreak: number;
    currentLastStreak: number;
}

// nodocchi.moe APIレスポンスの型定義
export interface NodocchiGame {
    starttime: number;
    during: number;
    sctype: string;
    playernum: number;
    playerlevel: number;
    playlength: number;
    kuitanari: number;
    akaari: number;
    speed: number;
    player1: string;
    player1ptr: string;
    player2: string;
    player2ptr: string;
    player3?: string;
    player3ptr?: string;
    player4?: string;
    player4ptr?: string;
}

export interface NodocchiResponse {
    name: string;
    rate: { [key: string]: number };
    recent: number;
    list: NodocchiGame[];
    rseq: number[][];
}
