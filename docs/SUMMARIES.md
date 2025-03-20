# Hatena Posts & Zenn Posts Summaries

このドキュメントでは、Hatena PostsとZenn Postsの要約機能の設定と使用方法について説明します。

## 概要

この機能は以下の2つの主要部分で構成されています：

1. **要約の生成**: Google Gemini APIを使用して記事の要約を自動的に生成し、`summaries.json`ファイルに保存します。この処理はGitHub Actionsによって毎日自動実行されるか、手動で実行できます。

2. **要約の表示**: 生成された要約は「Show summary」ボタンをクリックすると表示されます。要約がまだ生成されていない記事の場合は、その旨のメッセージが表示されます。

## Gemini APIの設定

要約生成スクリプトを実行するためには、Google Gemini APIのAPIキーが必要です。以下の手順で設定してください。

### 1. Google Cloud Projectの設定

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセスします
2. 新しいプロジェクトを作成するか、既存のプロジェクトを選択します
3. プロジェクトダッシュボードで「APIとサービス」→「APIライブラリ」に移動します
4. 検索ボックスで「Gemini API」を検索し、有効化します

### 2. APIキーの取得

1. Google Cloud Console内で「APIとサービス」→「認証情報」に移動します
2. 「認証情報を作成」→「APIキー」をクリックします
3. 新しいAPIキーが生成されます（セキュリティのため、APIキーに制限を設定することをお勧めします）
4. APIキーをコピーして安全に保管します

### 3. Vertex AIの有効化

1. Google Cloud Console内で「Vertex AI」→「概要」に移動します
2. プロンプトに従ってVertex AIを有効化します
3. 「モデルガーデン」で「Gemini」が利用可能であることを確認します

## ローカルでの要約生成

1. 環境変数にGemini APIキーを設定します:

   ```bash
   # Linuxまたは macOS
   export GEMINI_API_KEY="your-api-key-here"
   
   # Windows (コマンドプロンプト)
   set GEMINI_API_KEY=your-api-key-here
   
   # Windows (PowerShell)
   $env:GEMINI_API_KEY="your-api-key-here"
   ```

2. 依存関係をインストールします（初回のみ）:

   ```bash
   npm install
   ```

3. 要約生成スクリプトを実行します:

   ```bash
   npm run generate-summaries
   ```

## GitHub Actionsでの自動生成

GitHub上で自動的に要約を生成するには、GitHubリポジトリにGemini APIキーをシークレットとして追加する必要があります。

1. GitHubリポジトリのメインページに移動します
2. "Settings"タブをクリックします
3. 左側のサイドバーから「Secrets and variables」→「Actions」を選択します
4. 「New repository secret」ボタンをクリックします
5. 名前欄に`GEMINI_API_KEY`と入力します
6. 値欄に取得したAPIキーを貼り付けます
7. 「Add secret」をクリックします

これにより、GitHub Actionsワークフローが毎日自動的に実行され、新しい記事の要約が生成されます。また、GitHub上でワークフローを手動で実行することもできます（Actionsタブから）。

## ファイル構造

- `app/components/FeedPosts.tsx`: 記事一覧と要約表示のコンポーネント
- `app/lib/summaries.ts`: 要約データを取得するための関数
- `public/data/summaries.json`: 生成された要約データを保存するJSONファイル
- `generate-summaries.js`: 要約生成スクリプト
- `.github/workflows/generate-summaries.yml`: GitHub Actionsワークフロー設定

## トラブルシューティング

### 要約が生成されない場合

- Gemini APIキーが正しく設定されているか確認してください
- `generate-summaries.js`のログを確認して、エラーメッセージがないか確認してください
- Google CloudプロジェクトでGemini APIの割り当て制限に達していないか確認してください

### 要約が表示されない場合

- ブラウザのコンソールでエラーメッセージを確認してください
- `public/data/summaries.json`ファイルが存在し、正しいJSONフォーマットであるか確認してください
- 記事IDが正しくマッピングされているか確認してください（デバッグ用に`getPostSummary`関数にはログ出力があります）

## カスタマイズ

### 要約のプロンプト変更

より良い要約を得るためにプロンプトを変更したい場合は、`generate-summaries.js`ファイル内の`generateSummaryWithGemini`関数を編集してください。プロンプトは以下の部分にあります：

```javascript
text: `次の記事の内容を日本語で100文字程度に要約してください。専門用語や技術的な情報があれば保持してください。

  タイトル: ${post.title}

  内容: ${post.description || ''}

  要約：`
```

### 要約の表示スタイル変更

要約の表示方法をカスタマイズするには、`app/components/FeedPosts.tsx`ファイル内の要約表示部分を編集してください。主な表示ロジックは以下の部分にあります：

```tsx
{/* 要約表示部分 */}
<div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">要約</h4>
  {loadingSummary[post.id] ? (
    <div className="animate-pulse">
      {/* スケルトンローダー */}
    </div>
  ) : (
    <p className="text-gray-700 dark:text-gray-200">
      {summaries[post.id] || "この記事の要約はまだ生成されていません。"}
    </p>
  )}
</div>
