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

### MenuIcon

**ファイル:** `app/components/icons/MenuIcon.tsx`

**説明:**
メニューのアイコンを表示するコンポーネント。モバイル表示時のハンバーガーメニューなどに使用されます。

### IconLibrary

**ファイル:** `app/components/icons/IconLibrary.tsx`

**説明:**
すべてのアイコンコンポーネントをまとめたライブラリ。アイコンを名前で参照できるようにします。

**使用例:**
```tsx
import { IconLibrary } from './components/icons/IconLibrary';

// 使用例
<IconLibrary name="github" size={24} />
<IconLibrary name="hatena" size={24} />
<IconLibrary name="soundcloud" size={24} />
<IconLibrary name="x" size={24} />
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
     - メインコンテンツセクション（HatenaPosts、ZennPosts、GithubPosts、SoundCloudPlayer）
     - Sidebar
   - 各専用ページ（GitHub、はてな、Zenn、SoundCloud）
   
3. **ウィジェットレベル**
   - BaseWidget
     - GithubWidget
     - HatenaBlogWidget
     - XWidget
     - SoundCloudWidget
   
4. **コンテンツ表示レベル**
   - FeedPosts
   - UnifiedFeed
   - 各プラットフォーム特有の表示コンポーネント

5. **アイコンレベル**
   - BaseIcon
     - 各プラットフォーム特有のアイコンコンポーネント
   - IconLibrary

## スタイリング

コンポーネントのスタイリングには主にTailwind CSSが使用されています。共通のスタイルは`app/globals.css`で定義されており、各コンポーネントはインラインでTailwindのクラスを使用しています。

## コンポーネント拡張のベストプラクティス

1. **既存の構造を利用する**：新しいプラットフォームを追加する場合は、BaseWidgetを拡張し、既存のパターンに従います。
2. **分離された懸念事項**：データ取得ロジックとプレゼンテーションロジックを分離します。
3. **動的インポート**：パフォーマンスを向上させるために、必要に応じて`dynamic`インポートを使用します。
4. **レスポンシブデザイン**：すべての新しいコンポーネントは、モバイルファーストのアプローチでレスポンシブデザインを考慮する必要があります。
5. **アクセシビリティ**：新しいコンポーネントは適切なARIAロールとラベルを含める必要があります。
