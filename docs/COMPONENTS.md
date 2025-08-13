# コンポーネントドキュメント

このドキュメントでは、Basecampプロジェクトで使用されているReactコンポーネントの構造、プロパティ、使用例について説明します。

## 目次

1. [ウィジェットコンポーネント](#ウィジェットコンポーネント)
2. [レイアウトコンポーネント](#レイアウトコンポーネント)
3. [コンテンツ表示コンポーネント](#コンテンツ表示コンポーネント)
4. [アイコンコンポーネント](#アイコンコンポーネント)

## ウィジェットコンポーネント

### BaseWidget

**ファイル:** `app/components/widgets/BaseWidget.tsx`

**説明:**
すべてのウィジェットのベースとなる共通コンポーネント。ウィジェットのタイトル、アイコン、リンク、ユーザー名を表示する基本的な構造を提供します。

**プロパティ:**
```typescript
interface BaseWidgetProps {
    title: string;         // ウィジェットのタイトル
    icon: ReactNode;       // ウィジェットのアイコン（ReactNode）
    link: string;          // プロフィールリンク
    username: string;      // ユーザー名
}
```

**使用例:**
```tsx
<BaseWidget
    title="GitHub"
    icon={<FontAwesomeIcon icon={faGithub} className="w-6 h-6 mr-2" />}
    link="https://github.com/username"
    username="username"
/>
```

### GithubWidget

**ファイル:** `app/components/GithubWidget.tsx`

**説明:**
GitHub用のウィジェット。BaseWidgetを拡張し、GitHubのアイコンとプロフィールリンクを表示します。

**使用例:**
```tsx
<GithubWidget />  // 設定済みのユーザー名が使用されます
```

### HatenaBlogWidget

**ファイル:** `app/components/HatenaBlogWidget.tsx`

**説明:**
はてなブログ用のウィジェット。BaseWidgetを拡張し、はてなブログのアイコンとプロフィールリンクを表示します。

**使用例:**
```tsx
<HatenaBlogWidget />  // 設定済みのユーザー名が使用されます
```

### SoundCloudWidget

**ファイル:** `app/components/SoundCloudWidget.tsx`

**説明:**
SoundCloud用のウィジェット。BaseWidgetを拡張し、SoundCloudのアイコンとプロフィールリンクを表示します。

**使用例:**
```tsx
<SoundCloudWidget />  // 設定済みのユーザー名が使用されます
```

### XWidget

**ファイル:** `app/components/XWidget.tsx`

**説明:**
Twitter/X用のウィジェット。BaseWidgetを拡張し、Xのアイコンとプロフィールリンクを表示します。

**使用例:**
```tsx
<XWidget />  // 設定済みのユーザー名が使用されます
```

### BooklogWidget

**ファイル:** `app/components/widgets/BooklogWidget.tsx`

**説明:**
Booklog用のウィジェット。BaseWidgetを拡張し、読書記録サービスBooklogのアイコンとプロフィールリンクを表示します。

**使用例:**
```tsx
<BooklogWidget />  // 設定済みのユーザー名が使用されます
```

### FF14Widget

**ファイル:** `app/components/widgets/FF14Widget.tsx`

**説明:**
Final Fantasy XIV用のウィジェット。BaseWidgetを拡張し、FF14のアイコンとキャラクタープロフィールリンクを表示します。

**使用例:**
```tsx
<FF14Widget />  // 設定済みのキャラクター情報が使用されます
```

### MicroblogWidget

**ファイル:** `app/components/widgets/MicroblogWidget.tsx`

**説明:**
マイクロブログ用のウィジェット。BaseWidgetを拡張し、内蔵のマイクロブログシステムへのリンクを表示します。

**使用例:**
```tsx
<MicroblogWidget />  // マイクロブログページへのリンクが表示されます
```

### TenhouWidget

**ファイル:** `app/components/widgets/TenhouWidget.tsx`

**説明:**
天鳳（麻雀ゲーム）用のウィジェット。BaseWidgetを拡張し、天鳳の統計情報ページへのリンクを表示します。

**使用例:**
```tsx
<TenhouWidget />  // 設定済みのユーザー名が使用されます
```

## レイアウトコンポーネント

### Header

**ファイル:** `app/components/Header.tsx`

**説明:**
サイトのヘッダーナビゲーションを提供するコンポーネント。ロゴとナビゲーションリンクを表示します。

### Footer

**ファイル:** `app/components/Footer.tsx`

**説明:**
サイトのフッター情報を提供するコンポーネント。著作権情報とフッターリンクを表示します。

### Layout

**ファイル:** `app/components/Layout.tsx`

**説明:**
アプリケーション全体のレイアウトを構成するコンポーネント。Header、メインコンテンツ、Footerを含みます。

### Sidebar

**ファイル:** `app/components/Sidebar.tsx`

**説明:**
サイドバーを表示するコンポーネント。複数のウィジェットコンポーネント（GithubWidget、HatenaBlogWidget、XWidget、SoundCloudWidget）を組み合わせて表示します。

**使用例:**
```tsx
<aside className="w-full lg:w-1/4 px-4">
    <Sidebar />
</aside>
```

## コンテンツ表示コンポーネント

### HatenaPosts

**ファイル:** `app/components/HatenaPosts.tsx`

**説明:**
はてなブログの最新記事を表示するコンポーネント。`/api/hatena`エンドポイントからデータを取得し、記事一覧を表示します。

**使用例:**
```tsx
<section>
    <h2 className="text-2xl font-bold mb-4">Hatena Posts</h2>
    <HatenaPosts />
</section>
```

### ZennPosts

**ファイル:** `app/components/ZennPosts.tsx`

**説明:**
Zennの最新記事を表示するコンポーネント。`/api/zenn`エンドポイントからデータを取得し、記事一覧を表示します。

**使用例:**
```tsx
<section>
    <h2 className="text-2xl font-bold mb-4">Zenn Posts</h2>
    <ZennPosts />
</section>
```

### GithubPosts

**ファイル:** `app/components/GithubPosts.tsx`

**説明:**
GitHubの最新リポジトリを表示するコンポーネント。`/api/github`エンドポイントからデータを取得し、リポジトリ一覧を表示します。

**使用例:**
```tsx
<section>
    <h2 className="text-2xl font-bold mb-4">GitHub Activity</h2>
    <GithubPosts />
</section>
```

### GithubReadme

**ファイル:** `app/components/GithubReadme.tsx`

**説明:**
GitHub上のREADMEファイルの内容を表示するコンポーネント。指定されたリポジトリのREADMEファイルをMarkdownとして表示します。

### SoundCloudPlayer

**ファイル:** `app/components/SoundCloudPlayer.tsx`

**説明:**
SoundCloudのプレイヤーを埋め込むコンポーネント。指定されたトラックまたはプレイリストをプレイヤーとして表示します。

**使用例:**
```tsx
<section>
    <h2 className="text-2xl font-bold mb-4">SoundCloud Player</h2>
    <SoundCloudPlayer />
</section>
```

### BooklogPosts

**ファイル:** `app/components/BooklogPosts.tsx`

**説明:**
Booklogの読書記録を表示するコンポーネント。`/api/booklog`エンドポイントからデータを取得し、最近読んだ本の一覧を表示します。

**使用例:**
```tsx
<section>
    <h2 className="text-2xl font-bold mb-4">読書記録</h2>
    <BooklogPosts />
</section>
```

### FF14Character

**ファイル:** `app/components/FF14Character.tsx`

**説明:**
Final Fantasy XIVのキャラクター情報を表示するコンポーネント。`/api/ff14`エンドポイントからデータを取得し、キャラクターの詳細情報、ジョブレベル、装備情報などを表示します。

**使用例:**
```tsx
<section>
    <h2 className="text-2xl font-bold mb-4">FF14キャラクター</h2>
    <FF14Character />
</section>
```

### TenhouStats

**ファイル:** `app/components/TenhouStats.tsx`

**説明:**
天鳳（麻雀ゲーム）の統計情報を表示するコンポーネント。`/api/tenhou`エンドポイントからデータを取得し、段位、レート、勝率などの統計情報を表示します。リアルタイム更新機能も含みます。

**使用例:**
```tsx
<section>
    <h2 className="text-2xl font-bold mb-4">天鳳統計</h2>
    <TenhouStats />
</section>
```

### MicroblogTimeline

**ファイル:** `app/components/MicroblogTimeline.tsx`

**説明:**
マイクロブログのタイムラインを表示するコンポーネント。`/api/microblog`エンドポイントからデータを取得し、投稿一覧を時系列で表示します。タグフィルタリングや検索機能も含みます。

**使用例:**
```tsx
<section>
    <h2 className="text-2xl font-bold mb-4">マイクロブログ</h2>
    <MicroblogTimeline />
</section>
```

### MicroblogPost

**ファイル:** `app/components/MicroblogPost.tsx`

**説明:**
個別のマイクロブログ投稿を表示するコンポーネント。投稿内容、タグ、投稿日時などを表示します。

### MicroblogEditor

**ファイル:** `app/components/MicroblogEditor.tsx`

**説明:**
マイクロブログの新規投稿・編集を行うコンポーネント。認証されたユーザーのみが利用できます。

### UnifiedFeed

**ファイル:** `app/components/UnifiedFeed.tsx`

**説明:**
複数のプラットフォーム（GitHub、はてなブログ、Zenn）からのコンテンツを統合して表示するコンポーネント。

**使用例:**
```tsx
<UnifiedFeed />
```

### FeedPosts

**ファイル:** `app/components/FeedPosts.tsx`

**説明:**
統一されたフォーマットでフィード記事を表示するための汎用コンポーネント。

**プロパティ:**
```typescript
interface FeedPostsProps {
    posts: Post[];           // 表示する投稿の配列
    loading?: boolean;       // ローディング状態
    error?: string;          // エラーメッセージ
}
```

### LoadingSkeleton

**ファイル:** `app/components/LoadingSkeleton.tsx`

**説明:**
データ読み込み中に表示するスケルトンUIコンポーネント。コンテンツの形状を模した読み込み中のプレースホルダーを提供します。

### SearchBar

**ファイル:** `app/components/SearchBar.tsx`

**説明:**
検索機能を提供するコンポーネント。マイクロブログの検索などで使用されます。

### ParallaxHero

**ファイル:** `app/components/ParallaxHero.tsx`

**説明:**
パララックス効果付きのヒーローセクションを表示するコンポーネント。トップページで使用されます。

### Profile

**ファイル:** `app/components/Profile.tsx`

**説明:**
プロフィール情報を表示するコンポーネント。自己紹介やスキル情報などを表示します。

### AuthModal

**ファイル:** `app/components/AuthModal.tsx`

**説明:**
認証用のモーダルダイアログコンポーネント。ログイン・ログアウト機能を提供します。

### OAuthLogin

**ファイル:** `app/components/OAuthLogin.tsx`

**説明:**
OAuth認証を行うコンポーネント。GitHubなどの外部サービスでの認証を処理します。

### ServerHatenaPosts

**ファイル:** `app/components/ServerHatenaPosts.tsx`

**説明:**
はてなブログの記事をサーバーサイドで取得・表示するコンポーネント。SSR（Server-Side Rendering）でパフォーマンスを最適化します。

### SubscriptionBadges

**ファイル:** `app/components/SubscriptionBadges.tsx`

**説明:**
サブスクリプション情報やバッジを表示するコンポーネント。

### MagneticButton

**ファイル:** `app/components/MagneticButton.tsx`

**説明:**
マウスホバー時に磁石のような動きをするインタラクティブなボタンコンポーネント。

### TenhouDataUpdater

**ファイル:** `app/components/TenhouDataUpdater.tsx`

**説明:**
天鳳の統計データを更新するためのコンポーネント。管理者用の機能を提供します。

### TenhouRealtimeUpdater

**ファイル:** `app/components/TenhouRealtimeUpdater.tsx`

**説明:**
天鳳のリアルタイムデータ更新機能を提供するコンポーネント。

### TenhouUpdateForm

**ファイル:** `app/components/TenhouUpdateForm.tsx`

**説明:**
天鳳データの手動更新フォームコンポーネント。

### DebugAuth

**ファイル:** `app/components/DebugAuth.tsx`

**説明:**
認証システムのデバッグ用コンポーネント。開発環境でのテスト用。

## アイコンコンポーネント

BaseIconコンポーネントをベースに、以下のアイコンコンポーネントが定義されています：

### BaseIcon

**ファイル:** `app/components/icons/BaseIcon.tsx`

**説明:**
すべてのアイコンの基本となるコンポーネント。アイコンの共通プロパティを定義します。

**プロパティ:**
```typescript
interface BaseIconProps {
    size?: number;            // アイコンのサイズ
    className?: string;       // 追加のCSSクラス
}
```

### GithubIcon

**ファイル:** `app/components/icons/GithubIcon.tsx`

**説明:**
GitHubのアイコンを表示するコンポーネント。

### HatenaIcon

**ファイル:** `app/components/icons/HatenaIcon.tsx`

**説明:**
はてなブログのアイコンを表示するコンポーネント。

### SoundCloudIcon

**ファイル:** `app/components/icons/SoundCloudIcon.tsx`

**説明:**
SoundCloudのアイコンを表示するコンポーネント。

### XIcon

**ファイル:** `app/components/icons/XIcon.tsx`

**説明:**
Twitter/Xのアイコンを表示するコンポーネント。

### BooklogIcon

**ファイル:** `app/components/icons/BooklogIcon.tsx`

**説明:**
Booklog（読書記録サービス）のアイコンを表示するコンポーネント。

### DiscordIcon

**ファイル:** `app/components/icons/DiscordIcon.tsx`

**説明:**
Discordのアイコンを表示するコンポーネント。

### FF14Icon

**ファイル:** `app/components/icons/FF14Icon.tsx`

**説明:**
Final Fantasy XIVのアイコンを表示するコンポーネント。

### MicroblogIcon

**ファイル:** `app/components/icons/MicroblogIcon.tsx`

**説明:**
マイクロブログシステムのアイコンを表示するコンポーネント。

### TenhouIcon

**ファイル:** `app/components/icons/TenhouIcon.tsx`

**説明:**
天鳳（麻雀ゲーム）のアイコンを表示するコンポーネント。

### MenuIcon

**ファイル:** `app/components/icons/MenuIcon.tsx`

**説明:**
メニューのアイコンを表示するコンポーネント。モバイル表示時のハンバーガーメニューなどに使用されます。

### index.tsx (アイコンエクスポート)

**ファイル:** `app/components/icons/index.tsx`

**説明:**
すべてのアイコンコンポーネントを集中管理し、エクスポートするファイル。アイコンのインポートを簡単にします。

**使用例:**
```tsx
import { GithubIcon, HatenaIcon, XIcon } from '@/app/components/icons';

// 使用例
<GithubIcon size={24} />
<HatenaIcon size={24} />
<XIcon size={24} />
```

### types.ts

**ファイル:** `app/components/icons/types.ts`

**説明:**
アイコンコンポーネントの共通型定義ファイル。IconPropsインターフェースなどを定義します。

### IconLibrary

**ファイル:** `app/components/icons/IconLibrary.tsx`

**説明:**
アイコンコンポーネントの実装を含むファイル。各プラットフォームのアイコンが実装されています。

**使用例:**
```tsx
import { GithubIcon, XIcon, HatenaIcon } from '@/app/components/icons/IconLibrary';

// 使用例
<GithubIcon size={24} />
<XIcon size={24} />
<HatenaIcon size={24} />
```

## コンポーネント間の関係

このプロジェクトのコンポーネントは以下のような階層関係になっています：

1. **レイアウトレベル**
   - Layout
     - Header
     - メインコンテンツ
     - Footer
   
2. **ページレベル**
   - Home (`app/page.tsx`)
     - ParallaxHero
     - Profile  
     - メインコンテンツセクション（HatenaPosts、ZennPosts、GithubPosts、SoundCloudPlayer）
     - Sidebar
   - 各専用ページ（GitHub、はてな、Zenn、SoundCloud、Booklog、FF14、天鳳、マイクロブログ）
   
3. **ウィジェットレベル**
   - BaseWidget (`app/components/widgets/BaseWidget.tsx`)
     - GithubWidget
     - HatenaBlogWidget
     - XWidget
     - SoundCloudWidget
     - BooklogWidget (`app/components/widgets/BooklogWidget.tsx`)
     - FF14Widget (`app/components/widgets/FF14Widget.tsx`)
     - MicroblogWidget (`app/components/widgets/MicroblogWidget.tsx`)
     - TenhouWidget (`app/components/widgets/TenhouWidget.tsx`)
   
4. **コンテンツ表示レベル**
   - FeedPosts
   - UnifiedFeed
   - 各プラットフォーム特有の表示コンポーネント：
     - HatenaPosts / ServerHatenaPosts
     - ZennPosts
     - GithubPosts / GithubReadme
     - BooklogPosts
     - FF14Character
     - TenhouStats
     - MicroblogTimeline / MicroblogPost
     - SoundCloudPlayer

5. **アイコンレベル**
   - BaseIcon (`app/components/icons/BaseIcon.tsx`)
     - 各プラットフォーム特有のアイコンコンポーネント：
       - GithubIcon
       - HatenaIcon
       - XIcon
       - SoundCloudIcon
       - BooklogIcon
       - DiscordIcon
       - FF14Icon
       - MicroblogIcon
       - TenhouIcon
       - MenuIcon
   - アイコン管理ファイル：
     - IconLibrary.tsx
     - index.tsx
     - types.ts

6. **認証・ユーザー管理レベル**
   - AuthModal
   - OAuthLogin
   - DebugAuth
   - MicroblogEditor

7. **UI/UXコンポーネント**
   - LoadingSkeleton
   - MagneticButton
   - SearchBar
   - SubscriptionBadges

8. **データ更新コンポーネント**
   - TenhouDataUpdater
   - TenhouRealtimeUpdater
   - TenhouUpdateForm

## スタイリング

コンポーネントのスタイリングには主にTailwind CSSが使用されています。共通のスタイルは`app/globals.css`で定義されており、各コンポーネントはインラインでTailwindのクラスを使用しています。

## コンポーネント拡張のベストプラクティス

1. **既存の構造を利用する**：新しいプラットフォームを追加する場合は、BaseWidgetを拡張し、既存のパターンに従います。
2. **分離された懸念事項**：データ取得ロジックとプレゼンテーションロジックを分離します。
3. **動的インポート**：パフォーマンスを向上させるために、必要に応じて`dynamic`インポートを使用します。
4. **レスポンシブデザイン**：すべての新しいコンポーネントは、モバイルファーストのアプローチでレスポンシブデザインを考慮する必要があります。
5. **アクセシビリティ**：新しいコンポーネントは適切なARIAロールとラベルを含める必要があります。
6. **ファイル構造の統一**：ウィジェットは`app/components/widgets/`、アイコンは`app/components/icons/`に配置。
7. **認証統合**：ユーザー認証が必要なコンポーネントはSupabase認証システムと連携。
8. **リアルタイム機能**：必要に応じてリアルタイムデータ更新コンポーネントを作成。

## 2024年更新履歴

- **新規追加されたコンポーネント**：BooklogWidget、FF14Widget、MicroblogWidget、TenhouWidget、BooklogPosts、FF14Character、TenhouStats、MicroblogTimeline、MicroblogPost、MicroblogEditor など
- **新規追加されたアイコン**：BooklogIcon、DiscordIcon、FF14Icon、MicroblogIcon、TenhouIcon
- **認証・UI機能の追加**：AuthModal、OAuthLogin、LoadingSkeleton、SearchBar、MagneticButton など
- **リアルタイム機能**：TenhouRealtimeUpdater、TenhouDataUpdater、TenhouUpdateForm
- **ファイル構造の最適化**：widgets/、icons/ ディレクトリへの分離、型定義の統一
