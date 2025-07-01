-- マイクロブログ投稿テーブル
CREATE TABLE microblogs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  tags TEXT[] DEFAULT '{}',
  has_code BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES auth.users(id)
);

-- タグテーブル
CREATE TABLE tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 更新時刻を自動更新するトリガー
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_microblogs_updated_at
  BEFORE UPDATE ON microblogs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- インデックスの作成
CREATE INDEX idx_microblogs_created_at ON microblogs(created_at DESC);
CREATE INDEX idx_microblogs_tags ON microblogs USING GIN(tags);
CREATE INDEX idx_microblogs_has_code ON microblogs(has_code);

-- Row Level Security (RLS) の設定
ALTER TABLE microblogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- 全員が読み取り可能
CREATE POLICY "Public microblogs are viewable by everyone" ON microblogs
  FOR SELECT USING (true);

CREATE POLICY "Public tags are viewable by everyone" ON tags
  FOR SELECT USING (true);

-- 認証されたユーザーのみ作成・更新・削除可能
CREATE POLICY "Users can create their own microblogs" ON microblogs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own microblogs" ON microblogs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own microblogs" ON microblogs
  FOR DELETE USING (auth.uid() = user_id);

-- タグは認証されたユーザーのみ作成可能
CREATE POLICY "Authenticated users can create tags" ON tags
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);