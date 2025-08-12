# 天鳳データ自動取得の実装方法

## 現状
- nodocchi.moeはJavaScriptで動的にレンダリングされるため、通常のHTTP requestでは取得不可
- 公開APIが存在しない
- CORSによりブラウザからの直接アクセスも不可

## 解決方法

### 1. Playwrightを使用した自動取得

```bash
npm install playwright
```

```javascript
// app/api/tenhou/auto-fetch/route.ts
import { chromium } from 'playwright';

export async function GET() {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    await page.goto('https://nodocchi.moe/tenhoulog/?name=Unbobo');
    
    // ページの読み込みを待つ
    await page.waitForSelector('.result-table', { timeout: 30000 });
    
    // データを抽出
    const data = await page.evaluate(() => {
        // DOMから直接データを取得
        const stats = {
            rank: document.querySelector('.rank')?.textContent,
            games: document.querySelector('.games')?.textContent,
            // 直近の対戦履歴
            recentMatches: Array.from(document.querySelectorAll('.game-row')).map(row => ({
                date: row.querySelector('.date')?.textContent,
                position: row.querySelector('.position')?.textContent,
                score: row.querySelector('.score')?.textContent,
            }))
        };
        return stats;
    });
    
    await browser.close();
    return data;
}
```

### 2. GitHub Actionsで定期実行

```yaml
# .github/workflows/fetch-tenhou.yml
name: Fetch Tenhou Stats

on:
  schedule:
    - cron: '0 */6 * * *' # 6時間ごと
  workflow_dispatch:

jobs:
  fetch:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install playwright
      - run: npx playwright install chromium
      - run: node scripts/fetch-tenhou-playwright.js
      - uses: actions/upload-artifact@v3
        with:
          name: tenhou-stats
          path: public/data/tenhou-stats.json
```

### 3. ブラウザ拡張機能

ユーザーのブラウザで実行される拡張機能を作成：

```javascript
// Chrome Extension
chrome.tabs.create({ url: 'https://nodocchi.moe/tenhoulog/?name=Unbobo' }, (tab) => {
    chrome.tabs.executeScript(tab.id, {
        code: `
            // データを抽出してローカルAPIに送信
            const data = extractTenhouData();
            fetch('http://localhost:3000/api/tenhou/update', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        `
    });
});
```

### 4. ユーザースクリプト (Tampermonkey)

```javascript
// ==UserScript==
// @name         Tenhou Stats Fetcher
// @match        https://nodocchi.moe/tenhoulog/*
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';
    
    // ページ読み込み後にデータを抽出
    window.addEventListener('load', () => {
        setTimeout(() => {
            const data = extractDataFromPage();
            
            GM_xmlhttpRequest({
                method: 'POST',
                url: 'http://localhost:3000/api/tenhou/update',
                data: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }, 3000);
    });
})();
```

## 推奨実装

1. **短期的解決**: 手動更新フォーム（現在実装済み）
2. **中期的解決**: Playwrightを使用したサーバーサイド自動取得
3. **長期的解決**: 天鳳公式APIの利用（もし提供されれば）

## セキュリティ考慮事項

- スクレイピングは相手サイトの利用規約を確認
- レート制限を設ける（1時間に1回など）
- User-Agentを適切に設定
- エラーハンドリングを実装