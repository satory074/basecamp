-- 既存のポリシーを確認
SELECT * FROM pg_policies WHERE tablename = 'microblogs';

-- 認証されたユーザーが自分のuser_idで投稿できるようにポリシーを修正
DROP POLICY IF EXISTS "Users can create their own microblogs" ON microblogs;

CREATE POLICY "Authenticated users can create microblogs" ON microblogs
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- 更新ポリシーも修正
DROP POLICY IF EXISTS "Users can update their own microblogs" ON microblogs;

CREATE POLICY "Users can update their own microblogs" ON microblogs
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 削除ポリシーも修正  
DROP POLICY IF EXISTS "Users can delete their own microblogs" ON microblogs;

CREATE POLICY "Users can delete their own microblogs" ON microblogs
  FOR DELETE 
  TO authenticated
  USING (auth.uid() = user_id);