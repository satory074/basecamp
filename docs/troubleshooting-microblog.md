# マイクロブログ トラブルシューティングガイド

## 投稿できない場合の解決手順

### 1. パスワードリセット（最も簡単な解決方法）

Supabaseダッシュボードから：
1. **Authentication** → **Users**
2. 対象ユーザーの右側の「...」メニュー
3. **Send password recovery** をクリック
4. メールで新しいパスワードを設定

### 2. 新しいユーザーを作成

```bash
# .env.localに追加
ADMIN_PASSWORD=新しいパスワード

# 実行
npm run create-admin
```

### 3. 直接Supabaseで解決

#### A. テスト用にRLSを一時的に無効化（開発環境のみ）
```sql
-- RLSを一時的に無効化
ALTER TABLE microblogs DISABLE ROW LEVEL SECURITY;
ALTER TABLE tags DISABLE ROW LEVEL SECURITY;
```

#### B. またはポリシーを完全にオープンに（開発環境のみ）
```sql
-- すべての操作を許可
DROP POLICY IF EXISTS "Authenticated users can create microblogs" ON microblogs;
CREATE POLICY "Anyone can do anything" ON microblogs
  USING (true)
  WITH CHECK (true);
```

### 4. APIルートで直接デバッグ

`app/api/microblog/route.ts`を一時的に修正：

```typescript
// デバッグ用: 認証をスキップ
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { content } = body

    // 一時的にuser_idを固定
    const debugUserId = 'debug-user-123'
    
    const supabase = await createServerSupabaseClient()
    const { data: post, error } = await supabase
      .from('microblogs')
      .insert({
        content,
        tags: [],
        has_code: false,
        user_id: debugUserId
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase Error:', error)
      throw error
    }

    return NextResponse.json(post)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

### 5. 環境変数の確認

```bash
# .env.localが正しく設定されているか確認
cat .env.local | grep SUPABASE
```

必要な環境変数：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_ADMIN_EMAIL`

## 推奨される解決順序

1. **最初に試す**: Supabaseダッシュボードでパスワードリセット
2. **それでもダメなら**: 新しいユーザーを作成
3. **開発中なら**: RLSを一時的に無効化
4. **本番環境なら**: Service Role Keyを使用