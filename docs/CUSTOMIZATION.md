# カスタマイズガイド

このドキュメントでは、Basecampプロジェクトをカスタマイズして、自分のニーズに合わせる方法について説明します。

## 目次

1. [基本的な設定](#基本的な設定)
2. [UIのカスタマイズ](#uiのカスタマイズ)
3. [新しいプラットフォームの追加](#新しいプラットフォームの追加)
4. [コンポーネントの変更](#コンポーネントの変更)
5. [デプロイの設定](#デプロイの設定)

## 基本的な設定

### プロフィール情報の変更

プロフィール情報や連携サービスの設定は、`app/lib/config.ts`ファイルで管理されています。このファイルを編集することで、サイトのタイトル、説明、各プラットフォームのユーザー名などを変更できます。

```typescript
// app/lib/config.ts
export const config = {
    siteTitle: "あなたのサイトタイトル",
    siteDescription: "あなたのサイトの説明",
    profiles: {
        github: {
            username: "あなたのGitHubユーザー名",
            url: "https://github.com/あなたのGitHubユーザー名",
        },
        twitter: {
            username: "あなたのTwitterユーザー名",
            url: "https://twitter.com/あなたのTwitterユーザー名",
        },
        hatena: {
            username: "あなたのはてなブログユーザー名",
            url: "https://あなたのはてなブログURL",
        },
        soundcloud: {
            username: "あなたのSoundCloudユーザー名",
            url: "https://soundcloud.com/あなたのSoundCloudユーザー名",
        },
        zenn: {
            username: "あなたのZennユーザー名",
            url: "https://zenn.dev/あなたのZennユーザー名",
        },
    },
    apiEndpoints: {
        github: "/api/github",
        zenn: "/api/zenn",
        hatena: "/api/hatena",
    },
};
```

### サイトメタデータの変更

サイトのメタデータ（タイトル、説明など）は、`app/layout.tsx`ファイルで設定されています。このファイルは`config.ts`から設定を読み込みますが、必要に応じて直接編集することも可能です。

```tsx
// app/layout.tsx
export const metadata: Metadata = {
    title: config.siteTitle,
    description: config.siteDescription,
    // 以下のような追加メタデータを設定できます
    keywords: "personal, homepage, blog, portfolio",
    openGraph: {
        type: 'website',
        title: config.siteTitle,
        description: config.siteDescription,
        url: 'https://あなたのサイトURL',
    },
};
```

## UIのカスタマイズ

### テーマカラーの変更

Tailwind CSSの設定は`tailwind.config.ts`ファイルで管理されています。このファイルを編集して、テーマカラー、フォントサイズ、ブレイクポイントなどを変更できます。

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    // あなたのプライマリカラーを設定
                    50: "#f0f9ff",
                    100: "#e0f2fe",
                    // ... 他のシェード
                    900: "#0c4a6e",
                },
                secondary: {
                    // あなたのセカンダリカラーを設定
                },
            },
            fontFamily: {
                sans: ['"Noto Sans JP"', 'sans-serif'],
                // カスタムフォントを追加できます
            },
        },
    },
    plugins: [],
    darkMode: 'class', // または 'media'
};

export default config;
```

### グローバルスタイルの変更

グローバルCSSスタイルは`app/globals.css`ファイルで定義されています。このファイルを編集して、全体のスタイルを変更できます。

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* カスタム変数の定義 */
:root {
    --foreground-rgb: 0, 0, 0;
    --background-rgb: 255, 255, 255;
}

/* ダークモードの設定 */
@media (prefers-color-scheme: dark) {
    :root {
        --foreground-rgb: 255, 255, 255;
        --background-rgb: 30, 30, 30;
    }
}

/* グローバルスタイルの追加 */
@layer base {
    body {
        color: rgb(var(--foreground-rgb));
        background: rgb(var(--background-rgb));
    }
    
    h1, h2, h3, h4, h5, h6 {
        font-weight: 700;
    }
    
    a {
        @apply text-blue-600 dark:text-blue-400;
        text-decoration: none;
    }
    
    a:hover {
        text-decoration: underline;
    }
}

/* カスタムコンポーネントクラスの追加 */
@layer components {
    .card {
        @apply bg-white dark:bg-gray-800 rounded-lg shadow-md p-4;
    }
    
    .button {
        @apply px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700;
    }
}
```

### コンポーネントのスタイル変更

各コンポーネントのスタイルはコンポーネントファイル内のTailwind CSSクラスで定義されています。例えば、`BaseWidget`コンポーネントのスタイルを変更するには、`app/components/widgets/BaseWidget.tsx`ファイルを編集します。

```tsx
// app/components/widgets/BaseWidget.tsx
export default function BaseWidget({ title, icon, link, username }: BaseWidgetProps) {
    return (
        // クラスを変更してスタイルをカスタマイズ
        <div className="p-6 border-2 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
            <h2 className="text-2xl font-bold mb-3 text-blue-600 dark:text-blue-400">{title}</h2>
            <a href={link} target="_blank" rel="noopener noreferrer" className="flex items-center group">
                <div className="mr-3 text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {icon}
                </div>
                <p className="text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {username}
                </p>
            </a>
        </div>
    );
}
```

### 画像とアイコンの変更

プロフィール画像やファビコンなどの静的アセットは`public`ディレクトリに保存されています。これらのファイルを置き換えることで、イメージを変更できます。

- ファビコン: `public/favicon.ico`
- プロフィール画像: `public/images/profile.png`
- その他のアイコン: `public/*.svg`

## 新しいプラットフォームの追加

新しいプラットフォームを追加するには、以下の手順に従います。

### 1. 設定の追加

まず、`app/lib/config.ts`に新しいプラットフォームの設定を追加します。

```typescript
// app/lib/config.ts
export const config = {
    // 既存の設定...
    profiles: {
        // 既存のプロファイル...
        newPlatform: {
            username: "あなたの新しいプラットフォームのユーザー名",
            url: "https://newplatform.com/あなたのユーザー名",
        },
    },
    apiEndpoints: {
        // 既存のエンドポイント...
        newPlatform: "/api/newPlatform",
    },
};
```

### 2. APIエンドポイントの作成

次に、`app/api/`ディレクトリに新しいAPIエンドポイントを作成します。

```typescript
// app/api/newPlatform/route.ts
import { NextResponse } from "next/server";
import { config } from "../../lib/config";
import type { Post } from "../../lib/types";

export async function GET() {
    try {
        // 新しいプラットフォームからデータを取得するロジック
        const response = await fetch(`https://api.newplatform.com/users/${config.profiles.newPlatform.username}/content`);
        
        if (!response.ok) {
            throw new Error(`API returned ${response.status}`);
        }
        
        const data = await response.json();
        
        // 取得したデータをPost型に変換
        const posts: Post[] = data.map((item: any) => ({
            id: item.id.toString(),
            title: item.title,
            url: item.url,
            date: item.publishedAt,
            platform: "newPlatform",
            collection: "newPlatform",
            data: {
                // プラットフォーム固有のデータ
                description: item.description,
                image: item.imageUrl,
                // ...その他のデータ
            },
        }));
        
        return NextResponse.json(posts);
    } catch (error) {
        console.error("Failed to fetch data:", error);
        return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
    }
}
```

### 3. ウィジェットコンポーネントの作成

新しいプラットフォーム用のウィジェットコンポーネントを作成します。

```tsx
// app/components/NewPlatformWidget.tsx
"use client";

import { faGlobe } from "@fortawesome/free-solid-svg-icons"; // 適切なアイコンを選択
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import BaseWidget from "./widgets/BaseWidget";
import { config } from "../lib/config";

export default function NewPlatformWidget() {
    const username = config.profiles.newPlatform.username;
    
    return (
        <BaseWidget
            title="New Platform"
            icon={<FontAwesomeIcon icon={faGlobe} className="w-6 h-6 mr-2" />}
            link={config.profiles.newPlatform.url}
            username={username}
        />
    );
}
```

### 4. コンテンツ表示コンポーネントの作成

新しいプラットフォームのコンテンツを表示するコンポーネントを作成します。

```tsx
// app/components/NewPlatformPosts.tsx
"use client";

import { useEffect, useState } from "react";
import type { Post } from "../lib/types";
import { config } from "../lib/config";

export default function NewPlatformPosts() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
        async function fetchPosts() {
            try {
                const response = await fetch(config.apiEndpoints.newPlatform);
                
                if (!response.ok) {
                    throw new Error(`API returned ${response.status}`);
                }
                
                const data = await response.json();
                setPosts(data);
            } catch (error) {
                console.error("Error fetching posts:", error);
                setError("Failed to load posts");
            } finally {
                setLoading(false);
            }
        }
        
        fetchPosts();
    }, []);
    
    if (loading) return <div className="animate-pulse">Loading...</div>;
    if (error) return <div className="text-red-500">{error}</div>;
    
    return (
        <div className="space-y-4">
            {posts.map((post) => (
                <div key={post.id} className="border p-4 rounded-lg">
                    <h3 className="text-xl font-bold mb-2">
                        <a href={post.url} target="_blank" rel="noopener noreferrer"
                           className="hover:underline">
                            {post.title}
                        </a>
                    </h3>
                    {post.data?.description && (
                        <p className="text-gray-600 dark:text-gray-300 mb-2">
                            {post.data.description}
                        </p>
                    )}
                    <p className="text-sm text-gray-500">
                        {new Date(post.date).toLocaleDateString('ja-JP')}
                    </p>
                </div>
            ))}
        </div>
    );
}
```

### 5. 専用ページの作成

新しいプラットフォーム用の専用ページを作成します。

```tsx
// app/newPlatform/page.tsx
"use client";

import NewPlatformPosts from "../components/NewPlatformPosts";

export default function NewPlatformPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">New Platform</h1>
            <NewPlatformPosts />
        </div>
    );
}
```

### 6. サイドバーとホームページに新しいプラットフォームを追加

サイドバーとホームページに新しいプラットフォームのウィジェットとコンテンツを追加します。

```tsx
// app/components/Sidebar.tsx
import NewPlatformWidget from "./NewPlatformWidget";

export default function Sidebar() {
    return (
        <div className="space-y-4">
            <Profile />
            <GithubWidget />
            <HatenaBlogWidget />
            <XWidget />
            <SoundCloudWidget />
            <NewPlatformWidget /> {/* 新しいウィジェットを追加 */}
        </div>
    );
}

// app/page.tsx
import dynamic from "next/dynamic";
import Link from "next/link";

// 動的インポート
const NewPlatformPosts = dynamic(() => import("./components/NewPlatformPosts"));

export default function Home() {
    return (
        <div className="container mx-auto px-4">
            {/* 既存のセクション */}
            
            {/* 新しいセクションを追加 */}
            <section>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">New Platform</h2>
                    <Link href="/newPlatform" className="text-blue-600 hover:text-blue-800">
                        View all →
                    </Link>
                </div>
                <NewPlatformPosts />
            </section>
            
            {/* サイドバー */}
        </div>
    );
}
```

## コンポーネントの変更

### 既存コンポーネントの変更

既存のコンポーネントを変更する場合は、対応するファイルを編集します。例えば、`Header`コンポーネントを変更するには、`app/components/Header.tsx`を編集します。

```tsx
// app/components/Header.tsx
"use client";

export default function Header() {
    return (
        <header className="bg-blue-600 text-white shadow-md">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                <div className="flex items-center">
                    <a href="/" className="font-bold text-2xl">My Basecamp</a>
                </div>
                
                <nav>
                    <ul className="flex space-x-6">
                        <li><a href="/" className="hover:underline">Home</a></li>
                        <li><a href="/github" className="hover:underline">GitHub</a></li>
                        <li><a href="/hatena" className="hover:underline">Blog</a></li>
                        <li><a href="/zenn" className="hover:underline">Zenn</a></li>
                        <li><a href="/soundcloud" className="hover:underline">Music</a></li>
                        <li><a href="/newPlatform" className="hover:underline">New Platform</a></li> {/* 新しいナビゲーションリンク */}
                    </ul>
                </nav>
            </div>
        </header>
    );
}
```

### コンポーネントのレスポンシブデザイン

コンポーネントのレスポンシブデザインを調整するには、Tailwind CSSの`sm`、`md`、`lg`、`xl`、`2xl`のブレイクポイント修飾子を使用します。

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    {/* レスポンシブなグリッドアイテム */}
</div>
```

## デプロイの設定

### Vercelへのデプロイ

Vercelへのデプロイは、以下の手順に従います：

1. [Vercel](https://vercel.com/)でアカウントを作成
2. GitHubリポジトリを連携
3. 必要な環境変数を設定（APIキーなど）
4. デプロイを開始

### カスタムドメインの設定

Vercelでカスタムドメインを設定するには：

1. Vercelダッシュボードの「Domains」セクションに移動
2. 「Add」ボタンをクリック
3. カスタムドメインを入力
4. DNSプロバイダでの設定を完了

### 環境変数の設定

APIキーなどの機密情報は環境変数として設定することをお勧めします。これらの変数は、Vercelダッシュボードの「Environment Variables」セクションで設定できます。

```
// 例：APIキーを環境変数として設定
GITHUB_API_KEY=あなたのGitHubAPIキー
```

これらの環境変数は、`process.env`オブジェクトを通じてアクセスできます：

```typescript
const apiKey = process.env.GITHUB_API_KEY;
```

## まとめ

このガイドでは、Basecampプロジェクトをカスタマイズするための様々な方法について説明しました。基本的な設定から、UIのカスタマイズ、新しいプラットフォームの追加、コンポーネントの変更、デプロイの設定まで、幅広いカスタマイズオプションがあります。

これらの手順に従って、Basecampプロジェクトを自分のニーズに合わせてカスタマイズしてください。何か質問がある場合は、GitHubリポジトリのIssueセクションで質問してください。
