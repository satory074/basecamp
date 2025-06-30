// Node.jsスクリプトで天鳳データを取得
// 実行方法: node scripts/fetch-tenhou-data.js

const https = require('https');
const fs = require('fs').promises;
const path = require('path');

async function fetchTenhouData(username) {
    console.log(`Fetching data for ${username}...`);
    
    // 方法1: 天鳳の牌譜URLから統計を計算
    // 例: https://tenhou.net/0/log/?{username}
    
    // 方法2: nodocchi.moeのAPIエンドポイントを調査
    const possibleEndpoints = [
        `https://nodocchi.moe/api/tenhoulog?name=${username}`,
        `https://nodocchi.moe/tenhoulog/api/${username}`,
        `https://nodocchi.moe/tenhoulog/data.php?name=${username}`,
    ];
    
    for (const url of possibleEndpoints) {
        console.log(`Trying: ${url}`);
        try {
            const data = await fetchUrl(url);
            if (data) {
                console.log('Success! Found data at:', url);
                return data;
            }
        } catch (error) {
            console.log(`Failed: ${error.message}`);
        }
    }
    
    console.log('Could not find API endpoint. Manual update required.');
    return null;
}

function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; TenhouDataFetcher/1.0)',
                'Accept': 'application/json, text/html, */*',
            }
        }, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error(`Status Code: ${res.statusCode}`));
                return;
            }
            
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    // JSONとして解析を試みる
                    const json = JSON.parse(data);
                    resolve(json);
                } catch (e) {
                    // HTMLの場合は簡易パース
                    if (data.includes('段位') || data.includes('対戦数')) {
                        resolve(parseHtmlData(data));
                    } else {
                        resolve(null);
                    }
                }
            });
        }).on('error', reject);
    });
}

function parseHtmlData(html) {
    // 簡易的なHTMLパース
    const data = {
        source: 'html-parse',
        timestamp: new Date().toISOString(),
    };
    
    // 段位
    const rankMatch = html.match(/([初二三四五六七八九特]段|天鳳位)\s*(\d+)\s*pt/);
    if (rankMatch) {
        data.rank = rankMatch[1];
        data.rating = parseInt(rankMatch[2]);
    }
    
    // 対戦数
    const gamesMatch = html.match(/対戦数[：:]\s*(\d+)/);
    if (gamesMatch) {
        data.games = parseInt(gamesMatch[1]);
    }
    
    return Object.keys(data).length > 2 ? data : null;
}

// メイン実行
(async () => {
    const username = 'Unbobo';
    const data = await fetchTenhouData(username);
    
    if (data) {
        // データを保存
        const dataDir = path.join(__dirname, '..', 'public', 'data');
        await fs.mkdir(dataDir, { recursive: true });
        
        const filePath = path.join(dataDir, 'tenhou-stats-auto.json');
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        
        console.log('Data saved to:', filePath);
        console.log(JSON.stringify(data, null, 2));
    }
})();