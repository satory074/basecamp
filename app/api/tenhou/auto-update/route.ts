import { NextResponse } from "next/server";
import { config } from "@/app/lib/config";
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// 天鳳のAPIエンドポイント（もし存在すれば）
const TENHOU_API = 'https://ak.tenhou.net/api/paifu';

export async function GET() {
    const username = config.profiles.tenhou.username;
    
    try {
        // 方法1: 天鳳の公式APIを使用（もし利用可能なら）
        // 注意：これは仮のエンドポイントです
        const apiResponse = await fetch(`${TENHOU_API}/player/${username}/stats`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; Basecamp/1.0)',
            },
        });
        
        if (apiResponse.ok) {
            const data = await apiResponse.json();
            return NextResponse.json({
                success: true,
                source: 'official-api',
                data: data
            });
        }
        
        // 方法2: nodocchi.moeのJSONデータエンドポイントを探す
        // nodocchi.moeがAjaxでデータを取得している可能性がある
        const jsonUrl = `https://nodocchi.moe/api/tenhoulog/${username}`;
        const jsonResponse = await fetch(jsonUrl, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (compatible; Basecamp/1.0)',
            },
        });
        
        if (jsonResponse.ok) {
            const data = await jsonResponse.json();
            
            // データを保存
            const dataDir = path.join(process.cwd(), 'public', 'data');
            await mkdir(dataDir, { recursive: true });
            
            const filePath = path.join(dataDir, 'tenhou-stats.json');
            await writeFile(filePath, JSON.stringify({
                ...data,
                lastUpdated: new Date().toISOString(),
                source: 'nodocchi-api'
            }, null, 2));
            
            return NextResponse.json({
                success: true,
                source: 'nodocchi-api',
                data: data
            });
        }
        
        // 方法3: ブラウザ自動化が必要な場合のプレースホルダー
        return NextResponse.json({
            success: false,
            message: 'Automatic fetching requires browser automation (Puppeteer/Playwright)',
            suggestion: 'Use manual update or implement browser automation'
        });
        
    } catch (error) {
        console.error('Error in auto-update:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to auto-update',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// Puppeteerを使った実装例（コメントアウト）
/*
import puppeteer from 'puppeteer';

async function fetchWithPuppeteer(username: string) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
        await page.goto(`https://nodocchi.moe/tenhoulog/?name=${username}`, {
            waitUntil: 'networkidle2',
            timeout: 30000,
        });
        
        // ページが完全に読み込まれるまで待つ
        await page.waitForSelector('.stats-container', { timeout: 10000 });
        
        // データを抽出
        const data = await page.evaluate(() => {
            // ページ内のDOMから直接データを取得
            const rank = document.querySelector('.rank')?.textContent || '';
            const rating = document.querySelector('.rating')?.textContent || '';
            const games = document.querySelector('.games')?.textContent || '';
            
            // 直近の対戦履歴を取得
            const matches = Array.from(document.querySelectorAll('.match-row')).map(row => ({
                date: row.querySelector('.date')?.textContent || '',
                position: parseInt(row.querySelector('.position')?.textContent || '0'),
                score: parseFloat(row.querySelector('.score')?.textContent || '0'),
                roomType: row.querySelector('.room-type')?.textContent || '',
            }));
            
            return { rank, rating, games, matches };
        });
        
        return data;
    } finally {
        await browser.close();
    }
}
*/