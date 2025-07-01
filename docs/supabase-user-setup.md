# Supabaseユーザー作成ガイド

## 管理者ユーザーの作成方法

### 方法1: Supabaseダッシュボードから作成（推奨）

1. **Supabaseダッシュボードにログイン**
   - プロジェクトを開く
   - 左サイドバーの「Authentication」をクリック

2. **ユーザーを手動で作成**
   - 「Users」タブを選択
   - 右上の「Add user」→「Create new user」をクリック
   - 以下の情報を入力：
     - Email: `.env.local`の`NEXT_PUBLIC_ADMIN_EMAIL`と同じメールアドレス
     - Password: 安全なパスワードを設定
     - 「Auto Confirm User」にチェック（メール確認をスキップ）
   - 「Create user」をクリック

### 方法2: SQL Editorから作成

1. **SQL Editorを開く**
   - 左サイドバーの「SQL Editor」をクリック
   - 以下のSQLを実行：

```sql
-- ユーザーを作成（メールアドレスとパスワードを変更してください）
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data
) VALUES (
  gen_random_uuid(),
  'your@email.com',
  crypt('your_password', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{}'
);
```

### 方法3: プログラムから作成（初回セットアップ用）

プロジェクトに以下のスクリプトを追加：

```typescript
// scripts/create-admin.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY! // Service Keyが必要

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createAdmin() {
  const email = process.env.NEXT_PUBLIC_ADMIN_EMAIL!
  const password = process.env.ADMIN_PASSWORD! // 環境変数から取得

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  })

  if (error) {
    console.error('Error creating admin:', error)
    return
  }

  console.log('Admin user created:', data.user?.email)
}

createAdmin()
```

実行方法：
```bash
# 環境変数を設定
ADMIN_PASSWORD=your_secure_password npm run create-admin
```

## 認証設定の確認

### 1. Email認証の有効化
1. Authentication → Providers
2. 「Email」が有効になっていることを確認
3. 必要に応じて設定を調整：
   - Enable Email Confirmations: オフ（開発環境の場合）
   - Enable Email Change Confirmations: オフ（開発環境の場合）

### 2. サイトURLの設定
1. Authentication → URL Configuration
2. Site URLを設定（例: `http://localhost:3000`）
3. Redirect URLsに以下を追加：
   - `http://localhost:3000/**`
   - `https://your-domain.com/**`（本番環境）

### 3. セキュリティ設定
1. Authentication → Policies
2. 必要に応じてセキュリティポリシーを調整：
   - Password min length: 8文字以上
   - Require email confirmation: 開発時はオフでもOK

## トラブルシューティング

### ログインできない場合

1. **メールアドレスの確認**
   ```bash
   # .env.localを確認
   NEXT_PUBLIC_ADMIN_EMAIL=your@email.com  # この値と一致するか
   ```

2. **ユーザーの存在確認**
   SQL Editorで以下を実行：
   ```sql
   SELECT id, email, created_at, email_confirmed_at 
   FROM auth.users 
   WHERE email = 'your@email.com';
   ```

3. **パスワードリセット**
   Authenticationタブでユーザーを選択し、「Send password recovery」

### 権限エラーの場合

1. **RLSポリシーの確認**
   ```sql
   -- microblogsテーブルのポリシーを確認
   SELECT * FROM pg_policies WHERE tablename = 'microblogs';
   ```

2. **user_idの確認**
   投稿時にuser_idが正しく設定されているか確認

## セキュリティのベストプラクティス

1. **強力なパスワードを使用**
   - 12文字以上
   - 大文字・小文字・数字・記号を含む

2. **環境変数の管理**
   - `.env.local`をGitにコミットしない
   - 本番環境では環境変数を安全に管理

3. **定期的なセキュリティ監査**
   - Supabaseダッシュボードで認証ログを確認
   - 不審なアクセスがないかチェック

4. **本番環境での追加設定**
   - 2要素認証の有効化を検討
   - IPアドレス制限の設定
   - レート制限の調整