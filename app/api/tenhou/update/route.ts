import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

interface TenhouUpdateData {
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
    recentMatches?: {
        date: string;
        position: number;
        score: number;
        roomType: string;
    }[];
}

// 手動でデータを更新するエンドポイント
export async function POST(request: NextRequest) {
    try {
        const data: TenhouUpdateData = await request.json();
        
        // データのバリデーション
        if (!data.rank || !data.rating || !data.games) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }
        
        // データを保存（将来的にはデータベースに保存）
        const dataToSave = {
            ...data,
            lastUpdated: new Date().toISOString(),
            source: 'manual'
        };
        
        // データディレクトリの確認・作成
        const dataDir = path.join(process.cwd(), 'public', 'data');
        await mkdir(dataDir, { recursive: true });
        
        // JSONファイルに保存
        const filePath = path.join(dataDir, 'tenhou-stats.json');
        await writeFile(filePath, JSON.stringify(dataToSave, null, 2));
        
        return NextResponse.json({
            success: true,
            data: dataToSave
        });
        
    } catch (error) {
        console.error('Error updating Tenhou stats:', error);
        return NextResponse.json(
            { error: 'Failed to update stats' },
            { status: 500 }
        );
    }
}