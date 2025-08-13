# API ドキュメント

このドキュメントでは、Basecampプロジェクトで使用されているAPIエンドポイントについて詳細に説明します。

## 目次

1. [GitHub API](#github-api)
2. [はてなブログ API](#はてなブログ-api)
3. [Zenn API](#zenn-api)
4. [Booklog API](#booklog-api)
5. [天鳳 API](#天鳳-api)
6. [FF14 API](#ff14-api)
7. [マイクロブログ API](#マイクロブログ-api)
8. [サマリー API](#サマリー-api)

## GitHub API

### エンドポイント
`/api/github`

### 説明
GitHub APIを使用して、指定されたユーザーの最新リポジトリ情報を取得します。

### 実装ファイル
`app/api/github/route.ts`

### メソッド
`GET`

### レスポンス形式
```json
[
  {
    "id": "string",
    "title": "string", // リポジトリ名
    "url": "string", // リポジトリURL
    "date": "string", // 更新日時
    "platform": "github",
    "collection": "github",
    "data": {
      "description": "string", // リポジトリの説明
      "stars": number, // スター数
      "language": "string", // 主要言語
      "updated_at": "string" // 更新日時
    }
  },
  // ...最大5つのリポジトリ
]
```

### キャッシュ戦略
1時間（3600秒）のキャッシュを設定

### エラーハンドリング
APIが失敗した場合、500ステータスコードとエラーメッセージを返します。

## はてなブログ API

### エンドポイント
`/api/hatena`

### 説明
はてなブログのRSSフィードを解析して、指定されたユーザーの最新記事を取得します。

### 実装ファイル
`app/api/hatena/route.ts`

### メソッド
`GET`

### レスポンス形式
```json
[
  {
    "id": "string",
    "title": "string", // 記事タイトル
    "url": "string", // 記事URL
    "date": "string", // 公開日時
    "platform": "hatena",
    "collection": "hatena",
    "data": {
      "content": "string", // 記事の内容（HTMLまたはテキスト）
      "categories": ["string"] // カテゴリタグ
    }
  },
  // ...最新の記事
]
```

## Zenn API

### エンドポイント
`/api/zenn`

### 説明
Zennの記事一覧を取得します。

### 実装ファイル
`app/api/zenn/route.ts`

### メソッド
`GET`

### レスポンス形式
```json
[
  {
    "id": "string",
    "title": "string", // 記事タイトル
    "url": "string", // 記事URL
    "date": "string", // 公開日時
    "platform": "zenn",
    "collection": "zenn",
    "data": {
      "emoji": "string", // 記事のアイコン絵文字
      "type": "string", // 記事タイプ（article/book等）
      "topics": ["string"] // トピックタグ
    }
  },
  // ...最新の記事
]
```

## Booklog API

### エンドポイント
`/api/booklog`

### 説明
Booklog APIから読書記録を取得します。

### 実装ファイル
`app/api/booklog/route.ts`

### メソッド
`GET`

### レスポンス形式
```json
[
  {
    "id": "string",
    "title": "string", // 書籍タイトル
    "url": "string", // Booklog記録URL
    "date": "string", // 読了日時
    "platform": "booklog",
    "collection": "booklog",
    "data": {
      "author": "string", // 著者名
      "rating": number, // 評価（1-5）
      "review": "string", // レビュー内容
      "image": "string", // 書籍画像URL
      "status": "string" // 読書ステータス
    }
  }
]
```

## 天鳳 API

### エンドポイント
- `/api/tenhou` - 基本統計
- `/api/tenhou/realtime` - リアルタイム更新
- `/api/tenhou/update` - 手動更新
- `/api/tenhou/auto-update` - 自動更新

### 説明
天鳳（麻雀ゲーム）の統計情報を取得・更新します。

### 実装ファイル
`app/api/tenhou/route.ts`等

### メソッド
- `GET` (基本統計、リアルタイム)
- `POST` (更新系)

### レスポンス形式
```json
{
  "lastUpdated": "string",
  "stats": {
    "rank": "string", // 段位
    "rating": number, // レート
    "games": number, // 総ゲーム数
    "wins": number, // 勝利数
    "winRate": number // 勝率
  }
}
```

## FF14 API

### エンドポイント
`/api/ff14`

### 説明
Final Fantasy XIV（FF14）のキャラクター情報を取得します。

### 実装ファイル
`app/api/ff14/route.ts`

### メソッド
`GET`

### レスポンス形式
```json
{
  "character": {
    "name": "string", // キャラクター名
    "server": "string", // サーバー名
    "level": number, // レベル
    "job": "string", // ジョブ
    "title": "string", // 称号
    "portrait": "string", // ポートレートURL
    "lastOnline": "string" // 最終ログイン
  }
}
```

## マイクロブログ API

### エンドポイント
- `/api/microblog` - 投稿一覧・新規作成
- `/api/microblog/[id]` - 投稿の取得・更新・削除
- `/api/microblog/tags` - タグ一覧
- `/api/microblog/feed` - RSS配信

### 説明
認証が必要なマイクロブログのCRUD操作を提供します。

### 実装ファイル
`app/api/microblog/route.ts`等

### 認証
Supabase認証が必要（Bearer tokenまたはセッション）

### メソッド
- `GET` - 投稿一覧/個別取得
- `POST` - 新規投稿作成
- `PUT` - 投稿更新
- `DELETE` - 投稿削除

### レスポンス形式
```json
{
  "posts": [
    {
      "id": "string",
      "title": "string",
      "content": "string",
      "excerpt": "string",
      "tags": ["string"],
      "published": boolean,
      "created_at": "string",
      "updated_at": "string",
      "user_id": "string"
    }
  ]
}
```

## サマリー API

### エンドポイント
`/api/summaries`

### 説明
記事のサマリー情報を取得します。Gemini APIで生成された日本語要約データを返します。

### 実装ファイル
`app/api/summaries/route.ts`

### メソッド
`GET`

### レスポンス形式
```json
{
  "summaries": {
    "[articleId]": {
      "title": "string", // サマリータイトル
      "content": "string", // サマリー内容
      "keywords": ["string"] // キーワード
    },
    // ...他の記事のサマリー
  }
}
```

## 共通データ型

すべてのAPIは、`app/lib/types.ts`で定義されている`Post`型に準拠したデータを返します：

```typescript
export interface Post {
    id: string;
    title: string;
    url: string;
    date: string;
    platform: string;
    collection: string;
    data?: {
        [key: string]: any;
    };
}
```

## API利用のベストプラクティス

1. **エラーハンドリング**: すべてのAPIコールは適切にtry/catchブロックで囲んでエラーを処理してください。
2. **キャッシュの活用**: 頻繁にアクセスするエンドポイントの結果はクライアント側でもキャッシュすることを検討してください。
3. **レート制限**: 外部APIに依存しているため、短時間に多数のリクエストを送信しないようにしてください。
4. **フォールバックUI**: APIリクエストが失敗した場合のフォールバックUIを実装してください。
5. **認証**: マイクロブログAPIには適切なSupabase認証トークンを含めてください。
6. **データ検証**: 外部APIからのデータは適切に検証・サニタイズしてください。

## 環境変数

API機能に必要な環境変数：

```bash
# Supabase設定（マイクロブログ機能）
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI要約機能
GEMINI_API_KEY=your_gemini_api_key

# 外部APIキー（必要に応じて）
BOOKLOG_API_KEY=your_booklog_api_key
FF14_API_KEY=your_ff14_api_key
```
