import { NextResponse } from "next/server";
import { config } from "@/app/lib/config";

interface TenhouRealtimeData {
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
    recentMatches: {
        date: string;
        position: number;
        score: number;
        roomType: string;
        players?: string[];
    }[];
    lastUpdated: string;
}

// リアルタイムでデータを取得するAPI
export async function POST(request: Request) {
    try {
        // ユーザーから送信されたHTMLデータを受け取る
        const { htmlContent } = await request.json();
        
        if (!htmlContent) {
            return NextResponse.json(
                { error: "HTML content is required" },
                { status: 400 }
            );
        }
        
        // HTMLをパースしてデータを抽出
        const data = parseNodocchiHTML(htmlContent);
        
        // データを返す
        return NextResponse.json({
            success: true,
            data: data,
            source: 'realtime'
        });
        
    } catch (error) {
        console.error('Error parsing realtime data:', error);
        return NextResponse.json(
            { error: 'Failed to parse data' },
            { status: 500 }
        );
    }
}

function parseNodocchiHTML(html: string): TenhouRealtimeData {
    const data: TenhouRealtimeData = {
        username: config.profiles.tenhou.username,
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
        recentMatches: [],
        lastUpdated: new Date().toISOString(),
    };
    
    try {
        // 段位とレーティングを抽出
        const rankMatch = html.match(/([初二三四五六七八九]段|特上|天鳳位)\s*(\d+)pt/);
        if (rankMatch) {
            data.rank = rankMatch[1];
            const rankBase = getRankBase(rankMatch[1]);
            data.rating = rankBase + parseInt(rankMatch[2]);
        }
        
        // 対戦数を抽出
        const gamesMatch = html.match(/段位戦(\d+)戦/);
        if (gamesMatch) {
            data.games = parseInt(gamesMatch[1]);
        }
        
        // 順位分布を抽出（パーセンテージ形式）
        const placementPercentMatch = html.match(/1位\s*(\d+)戦\s*([\d.]+)%[\s\S]*?2位\s*(\d+)戦\s*([\d.]+)%[\s\S]*?3位\s*(\d+)戦\s*([\d.]+)%[\s\S]*?4位\s*(\d+)戦\s*([\d.]+)%/);
        if (placementPercentMatch) {
            data.placements.first = parseFloat(placementPercentMatch[2]);
            data.placements.second = parseFloat(placementPercentMatch[4]);
            data.placements.third = parseFloat(placementPercentMatch[6]);
            data.placements.fourth = parseFloat(placementPercentMatch[8]);
        }
        
        // 統計情報を抽出
        const statsPatterns = {
            winRate: /和了率[：:]\s*([\d.]+)%/,
            dealInRate: /放銃率[：:]\s*([\d.]+)%/,
            riichiRate: /立直率[：:]\s*([\d.]+)%/,
            callRate: /副露率[：:]\s*([\d.]+)%/,
        };
        
        for (const [key, pattern] of Object.entries(statsPatterns)) {
            const match = html.match(pattern);
            if (match) {
                data[key as keyof typeof statsPatterns] = parseFloat(match[1]);
            }
        }
        
        // 平均得点と平均順位を抽出
        const avgMatch = html.match(/平均得点[：:]\s*([\d.+-]+)[\s\S]*?平均順位[：:]\s*([\d.]+)/);
        if (avgMatch) {
            data.averagePoints = parseFloat(avgMatch[1]);
            data.averageRank = parseFloat(avgMatch[2]);
        }
        
        // 通算得点を抽出
        const totalPointsMatch = html.match(/通算得点[：:]\s*([\d+-]+)/);
        if (totalPointsMatch) {
            data.totalPoints = parseInt(totalPointsMatch[1]);
        }
        
        // 最近の対戦履歴を抽出
        // 対戦ログの行を探す（複数のパターンに対応）
        const logPatterns = [
            // パターン1: 順位 時間 日付 ルーム レート プレイヤー名
            /(\d)位\s+(\d+分)\s+([\d-]+\s+[\d:]+)\s+([^\s]+)\s+([^\s]+pt[^\s]*)\s+([^\n]+)/g,
            // パターン2: より簡潔な形式
            /(\d)位.*?([\d-]+\s+[\d:]+).*?([四上東南喰赤]+).*?([\d.+-]+)/g,
        ];
        
        for (const pattern of logPatterns) {
            const matches = Array.from(html.matchAll(pattern));
            if (matches.length > 0) {
                data.recentMatches = matches.slice(0, 20).map(match => {
                    // スコアを抽出（括弧内の数値）
                    const scoreMatch = match[0].match(/\(([\d.+-]+)\)/);
                    const score = scoreMatch ? parseFloat(scoreMatch[1]) : 0;
                    
                    return {
                        date: match[3] || match[2],
                        position: parseInt(match[1]),
                        score: score,
                        roomType: match[4] || match[3] || "不明",
                        players: match[6] ? match[6].split(/\s+/).filter(p => p && !p.includes('pt')) : undefined
                    };
                });
                break;
            }
        }
        
        // 最近の対戦履歴（別形式）も試す
        if (data.recentMatches.length === 0) {
            // テーブル形式のデータを探す
            const tableMatch = html.match(/<table[^>]*>[\s\S]*?<\/table>/gi);
            if (tableMatch) {
                for (const table of tableMatch) {
                    // 行を抽出
                    const rows = table.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi);
                    if (rows) {
                        for (const row of rows) {
                            // セルを抽出
                            const cells = row.match(/<td[^>]*>([^<]*)<\/td>/gi);
                            if (cells && cells.length >= 4) {
                                const position = cells[0].match(/(\d)位/);
                                const score = cells[cells.length - 1].match(/([\d.+-]+)/);
                                if (position && score) {
                                    data.recentMatches.push({
                                        date: new Date().toISOString(),
                                        position: parseInt(position[1]),
                                        score: parseFloat(score[1]),
                                        roomType: "四上南喰赤",
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }
        
    } catch (error) {
        console.error("Error parsing HTML:", error);
    }
    
    return data;
}

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