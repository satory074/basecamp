# API ドキュメント

このドキュメントでは、Basecampプロジェクトで使用されているAPIエンドポイントについて詳細に説明します。

## 目次

1. [GitHub API](#github-api)
2. [はてなブログ API](#はてなブログ-api)
3. [Zenn API](#zenn-api)
4. [サマリー API](#サマリー-api)

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

## サマリー API

### エンドポイント
`/api/summaries`

### 説明
記事のサマリー情報を取得します。このAPIは、事前に生成されたサマリーデータを返します。

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
