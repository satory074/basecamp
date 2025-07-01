# マイクロブログ実装のベストプラクティス

## 1. 認証戦略

### 開発環境と本番環境の分離

#### A. 環境変数による制御（推奨）
```typescript
// .env.local (開発環境)
NEXT_PUBLIC_DEV_MODE=true
NEXT_PUBLIC_MOCK_AUTH=true

// .env.production (本番環境)
NEXT_PUBLIC_DEV_MODE=false
NEXT_PUBLIC_MOCK_AUTH=false
```

#### B. 認証モードの実装
```typescript
// app/lib/auth-mode.ts
export const getAuthMode = () => {
  if (process.env.NEXT_PUBLIC_MOCK_AUTH === 'true') {
    return 'mock'
  }
  if (process.env.NEXT_PUBLIC_DEV_MODE === 'true') {
    return 'development'
  }
  return 'production'
}
```

### パスワードレス認証（メール問題の解決）

#### マジックリンク実装
```typescript
// Supabaseのマジックリンク
const { error } = await supabase.auth.signInWithOtp({
  email: 'user@example.com',
  options: {
    shouldCreateUser: false,
    emailRedirectTo: window.location.origin
  }
})
```

## 2. RLSポリシーの最適化

### 段階的なセキュリティレベル

```sql
-- 開発環境用ポリシー
CREATE POLICY "dev_policy" ON microblogs
  FOR ALL 
  USING (
    current_setting('app.environment', true) = 'development' 
    OR auth.uid() IS NOT NULL
  );

-- 本番環境用ポリシー  
CREATE POLICY "prod_policy" ON microblogs
  FOR ALL
  USING (
    auth.uid() IS NOT NULL 
    AND (
      -- 読み取りは全員
      (auth.uid() IS NOT NULL AND command = 'SELECT')
      -- 書き込みは本人のみ
      OR (auth.uid() = user_id AND command IN ('INSERT', 'UPDATE', 'DELETE'))
    )
  );
```

## 3. ローカル開発の最適化

### A. ローカルSupabase（Docker）
```bash
# Supabaseをローカルで実行
npx supabase init
npx supabase start

# 環境変数を自動設定
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=[自動生成]
```

### B. シードデータの準備
```sql
-- seed.sql
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'dev@example.com',
  crypt('password123', gen_salt('bf')),
  now()
);

INSERT INTO microblogs (content, user_id, tags)
VALUES 
  ('開発用の投稿1 #test', '11111111-1111-1111-1111-111111111111', ARRAY['test']),
  ('コードサンプル ```js\nconsole.log("Hello")\n``` #code', '11111111-1111-1111-1111-111111111111', ARRAY['code']);
```

## 4. 認証フローの改善

### シングルサインオン（SSO）統合
```typescript
// GitHub認証（開発者向け）
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'github',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`
  }
})
```

### セッション管理
```typescript
// app/hooks/useSession.ts
export function useSession() {
  const [session, setSession] = useState<Session | null>(null)
  
  useEffect(() => {
    // セッション監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session)
        
        // セッション更新時の処理
        if (event === 'SIGNED_IN') {
          router.push('/microblog')
        }
      }
    )
    
    return () => subscription.unsubscribe()
  }, [])
  
  return { session, isAuthenticated: !!session }
}
```

## 5. エラーハンドリング

### 包括的なエラー処理
```typescript
// app/lib/error-handler.ts
export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number
  ) {
    super(message)
  }
}

export const handleAuthError = (error: any) => {
  if (error.message?.includes('Invalid login credentials')) {
    return new AuthError(
      'メールアドレスまたはパスワードが間違っています',
      'INVALID_CREDENTIALS',
      401
    )
  }
  
  if (error.message?.includes('Email not confirmed')) {
    return new AuthError(
      'メールアドレスの確認が必要です',
      'EMAIL_NOT_CONFIRMED',
      403
    )
  }
  
  return new AuthError(
    'ログインに失敗しました',
    'UNKNOWN_ERROR',
    500
  )
}
```

## 6. パフォーマンス最適化

### キャッシング戦略
```typescript
// app/hooks/useMicroblogs.ts
export function useMicroblogs() {
  return useSWR('/api/microblog', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 30000, // 30秒ごと
  })
}
```

### 楽観的更新
```typescript
// 投稿時の楽観的更新
const handlePost = async (content: string) => {
  // 即座にUIを更新
  mutate('/api/microblog', (data: any) => [
    { id: 'temp', content, created_at: new Date() },
    ...data
  ], false)
  
  // バックグラウンドで実際の投稿
  try {
    await createPost(content)
    mutate('/api/microblog') // 再検証
  } catch (error) {
    // エラー時はロールバック
    mutate('/api/microblog')
    toast.error('投稿に失敗しました')
  }
}
```

## 7. セキュリティベストプラクティス

### コンテンツサニタイゼーション
```typescript
import DOMPurify from 'isomorphic-dompurify'

// XSS対策
const sanitizeContent = (content: string) => {
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'code', 'pre'],
    ALLOWED_ATTR: []
  })
}
```

### レート制限
```typescript
// app/lib/rate-limit.ts
const rateLimiter = new Map()

export const checkRateLimit = (userId: string) => {
  const key = `post_${userId}`
  const now = Date.now()
  const limit = 10 // 10投稿/分
  
  const timestamps = rateLimiter.get(key) || []
  const recentTimestamps = timestamps.filter((t: number) => now - t < 60000)
  
  if (recentTimestamps.length >= limit) {
    throw new Error('投稿制限に達しました。しばらくお待ちください。')
  }
  
  rateLimiter.set(key, [...recentTimestamps, now])
}
```

## 8. 推奨される実装手順

1. **ローカルSupabaseで開発開始**
2. **モック認証で機能実装**
3. **本番認証を段階的に統合**
4. **RLSポリシーを環境別に設定**
5. **エラーハンドリングを充実**
6. **パフォーマンス最適化**
7. **セキュリティ監査**

## 9. デプロイチェックリスト

- [ ] 環境変数の設定確認
- [ ] RLSポリシーの本番設定
- [ ] エラーログの設定
- [ ] レート制限の実装
- [ ] バックアップ戦略
- [ ] モニタリング設定