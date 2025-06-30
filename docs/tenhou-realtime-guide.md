# 天鳳データのリアルタイム取得ガイド

## 概要
天鳳の対戦履歴をリアルタイムで取得する機能を実装しました。ユーザーがnodocchi.moeのページ内容をコピー＆ペーストすることで、最新のデータを即座に反映できます。

## 使い方

### 1. リアルタイム更新ボタンをクリック
天鳳統計ページの下部にある「リアルタイム更新」ボタンをクリックします。

### 2. nodocchi.moeを開く
表示されるモーダルウィンドウ内のリンクから、または直接以下のURLにアクセス：
https://nodocchi.moe/tenhoulog/?name=Unbobo

### 3. ページが完全に読み込まれるまで待つ
JavaScript によって動的に生成されるコンテンツが表示されるまで5-10秒待ちます。

### 4. ページ全体を選択してコピー
- Windows: Ctrl+A → Ctrl+C
- Mac: Cmd+A → Cmd+C

### 5. テキストエリアに貼り付け
モーダル内のテキストエリアに貼り付けると、自動的にデータが解析されます。

## 技術的な仕組み

### クライアントサイド
1. `TenhouRealtimeUpdater`コンポーネントがモーダルUIを提供
2. ペースト時に自動的にAPIにPOSTリクエスト
3. 成功時は親コンポーネントの状態を更新

### サーバーサイド
1. `/api/tenhou/realtime`エンドポイントがHTMLを受け取る
2. 正規表現でデータを抽出：
   - 段位とレーティング
   - 対戦数と順位分布
   - 各種統計（和了率、放銃率など）
   - 直近の対戦履歴
3. パースしたデータをJSONで返す

### セキュリティ
- データはサーバーで処理されるが保存されない
- HTMLは一時的にメモリ上で処理される
- ユーザーのプライバシーを保護

## 今後の改善案

### 1. ブラウザ拡張機能
```javascript
// Chrome拡張機能でワンクリック取得
chrome.runtime.sendMessage({
    action: 'getTenhouData',
    url: window.location.href
});
```

### 2. ブックマークレット
```javascript
javascript:(function(){
    const data = document.body.innerText;
    fetch('http://localhost:3000/api/tenhou/realtime', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({htmlContent: data})
    });
})();
```

### 3. GitHub Actions の活用
定期的に自動取得する仕組みは既に実装済み（`.github/workflows/fetch-tenhou-stats.yml`）

## トラブルシューティング

### データが取得できない場合
1. ページが完全に読み込まれているか確認
2. 全体を選択してコピーしているか確認
3. ブラウザの開発者ツールでエラーを確認

### 対戦履歴が表示されない場合
nodocchi.moeの表示形式が変更された可能性があります。その場合は手動更新機能を使用してください。