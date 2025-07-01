# OAuth認証セットアップガイド

## Google OAuth設定

### 1. Google Cloud Consoleでの設定

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成または既存のプロジェクトを選択
3. 「APIとサービス」→「認証情報」→「認証情報を作成」→「OAuthクライアントID」
4. アプリケーションの種類：「ウェブアプリケーション」
5. 以下を設定：

**承認済みのJavaScriptオリジン:**
```
http://localhost:3000
http://localhost:3001
https://YOUR-DOMAIN.com
```

**承認済みのリダイレクトURI:**
```
https://YOUR-PROJECT-ID.supabase.co/auth/v1/callback
http://localhost:3000/auth/callback
http://localhost:3001/auth/callback
```

### 2. Supabaseでの設定

**Client ID:** (Google Cloud Consoleから取得)
```
YOUR-CLIENT-ID.apps.googleusercontent.com
```

**Client Secret:** (Google Cloud Consoleから取得)
```
YOUR-CLIENT-SECRET
```

**Callback URL:** (自動設定されるのでそのまま)
```
https://YOUR-PROJECT-ID.supabase.co/auth/v1/callback
```

## GitHub OAuth設定

### 1. GitHubでの設定

1. GitHub → Settings → Developer settings → OAuth Apps → New OAuth App
2. 以下を入力：

**Application name:** Basecamp Microblog
**Homepage URL:** http://localhost:3000
**Authorization callback URL:** 
```
https://YOUR-PROJECT-ID.supabase.co/auth/v1/callback
```

### 2. Supabaseでの設定

**Client ID:** (GitHubから取得)
**Client Secret:** (GitHubから取得)

## トラブルシューティング

### エラー: "Invalid characters"
- Client IDフィールドにメールアドレスを入力していませんか？
- 正しいフォーマット: `1234567890-abcdefg.apps.googleusercontent.com`

### エラー: "Redirect URI mismatch"
- Google Cloud ConsoleのリダイレクトURIとSupabaseのコールバックURLが一致していることを確認
- httpとhttpsの違いに注意

### ローカル開発での注意点
- `localhost`と`127.0.0.1`は別のオリジンとして扱われます
- ポート番号も含めて正確に設定してください（例：`:3000`, `:3001`）