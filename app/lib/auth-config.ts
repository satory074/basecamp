// 認証設定の一元管理
export const authConfig = {
  // 開発環境では認証をバイパス
  skipAuth: process.env.NODE_ENV === 'development',
  
  // モックユーザー（開発用）
  mockUser: {
    id: '00000000-0000-0000-0000-000000000000',
    email: 'dev@localhost',
    role: 'admin'
  },
  
  // 認証不要なルート
  publicRoutes: ['/api/microblog', '/api/microblog/feed'],
  
  // 認証必須なアクション
  protectedActions: ['create', 'update', 'delete']
}

// 認証モードの判定
export const getAuthMode = () => {
  if (process.env.NEXT_PUBLIC_SKIP_AUTH === 'true') return 'skip'
  if (process.env.NODE_ENV === 'development') return 'development'
  return 'production'
}