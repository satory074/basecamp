-- 方法1: 開発環境用 - RLSを完全に無効化（最も簡単）
ALTER TABLE microblogs DISABLE ROW LEVEL SECURITY;
ALTER TABLE tags DISABLE ROW LEVEL SECURITY;

-- これで認証なしでも投稿できるようになります
-- 開発が終わったら以下で再度有効化：
-- ALTER TABLE microblogs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE tags ENABLE ROW LEVEL SECURITY;