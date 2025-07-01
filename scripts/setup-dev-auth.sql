-- 開発環境用の認証設定

-- 1. RLSを一時的に無効化（開発のみ）
ALTER TABLE microblogs DISABLE ROW LEVEL SECURITY;
ALTER TABLE tags DISABLE ROW LEVEL SECURITY;

-- 2. 開発用ユーザーの作成（パスワード不要）
INSERT INTO auth.users (
  id,
  email,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  email_confirmed_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'dev@localhost',
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Development User"}',
  false,
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 3. サンプルデータの挿入
INSERT INTO microblogs (content, user_id, tags, has_code) VALUES
  ('開発環境のセットアップ完了！ 🚀', '00000000-0000-0000-0000-000000000000', ARRAY['setup'], false),
  ('```typescript
const greeting = "Hello, Microblog!"
console.log(greeting)
```
#typescript #code', '00000000-0000-0000-0000-000000000000', ARRAY['typescript', 'code'], true),
  ('マークダウンのテスト
- リスト1
- リスト2
- **太字**
- *斜体*

#markdown #test', '00000000-0000-0000-0000-000000000000', ARRAY['markdown', 'test'], false);

-- 確認
SELECT COUNT(*) as user_count FROM auth.users;
SELECT COUNT(*) as post_count FROM microblogs;