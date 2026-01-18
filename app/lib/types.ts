// ============================
// Base Types
// ============================

/** 全プラットフォーム共通の基本フィールド */
export interface BasePost {
    id: string;
    title: string;
    url: string;
    date: string;
    description?: string;
    thumbnail?: string;
}

// ============================
// Platform-Specific Types
// ============================

/** GitHub リポジトリ */
export interface GitHubPost extends BasePost {
    platform: "github";
    stars?: number;
    forks?: number;
    language?: string;
    lastCommit?: string;
    contributors?: number;
}

/** Hatena Blog 記事 */
export interface HatenaPost extends BasePost {
    platform: "hatena";
    likes?: number;
    comments?: number;
    tags?: string[];
    category?: string;
}

/** Zenn 記事 */
export interface ZennPost extends BasePost {
    platform: "zenn";
    likes?: number;
    comments?: number;
    views?: number;
    tags?: string[];
}

/** Booklog 読書記録 */
export interface BooklogPost extends BasePost {
    platform: "booklog";
    rating?: number;
    status?: "read" | "reading" | "want_to_read";
    pages?: number;
    finishedDate?: string;
    publisher?: string;
    author?: string;
    genre?: string;
}

/** Note 記事 */
export interface NotePost extends BasePost {
    platform: "note";
    likes?: number;
    creatorName?: string;
}

/** Filmarks 視聴記録 */
export interface FilmarksPost extends BasePost {
    platform: "filmarks";
    contentType?: "movie" | "drama" | "anime";
    rating?: number;
}

/** その他のプラットフォーム */
export interface GenericPost extends BasePost {
    platform: "soundcloud" | "tenhou" | "ff14" | "microblog";
    [key: string]: unknown;
}

// ============================
// Union Type
// ============================

/** 全プラットフォームの投稿を表すUnion型 */
export type PlatformPost = GitHubPost | HatenaPost | ZennPost | BooklogPost | NotePost | FilmarksPost | GenericPost;

// ============================
// Legacy Type (後方互換性)
// ============================

/** @deprecated 新規コードではPlatformPostを使用してください */
export interface Post {
    id: string;
    title: string;
    url: string;
    date: string;
    platform: "hatena" | "zenn" | "github" | "booklog" | "note" | "filmarks" | "microblog" | string;
    description?: string;
    collection?: string;
    thumbnail?: string;
    // エンゲージメント指標
    likes?: number;
    stars?: number;
    forks?: number;
    comments?: number;
    views?: number;
    // タグ・カテゴリー情報
    tags?: string[];
    category?: string;
    // GitHub固有の情報
    language?: string;
    lastCommit?: string;
    contributors?: number;
    // Booklog固有の情報
    rating?: number;
    status?: "read" | "reading" | "want_to_read";
    pages?: number;
    finishedDate?: string;
    publisher?: string;
    // 汎用データフィールド（後方互換性）
    data?: {
        [key: string]: unknown;
    };
}

// ============================
// Formatted Types
// ============================

export interface FormattedPost {
    id: string;
    title: string;
    url: string;
    date: Date;
    platform: string;
    description?: string;
    thumbnail?: string;
    iconComponent?: React.ReactNode;
    // エンゲージメント指標
    likes?: number;
    stars?: number;
    forks?: number;
    comments?: number;
    views?: number;
    // タグ・カテゴリー情報
    tags?: string[];
    category?: string;
    // プラットフォーム固有の情報
    language?: string;
    lastCommit?: string;
    contributors?: number;
    rating?: number;
    status?: "read" | "reading" | "want_to_read";
    pages?: number;
    finishedDate?: string;
    publisher?: string;
}

// ============================
// Deck Types
// ============================

export interface DeckItem {
    id: string;
    name: string;
    url: string;
    icon: string;
}

export interface DeckCategory {
    id: string;
    name: string;
    items: DeckItem[];
}

export interface DeckData {
    categories: DeckCategory[];
}

// ============================
// API Response Types
// ============================

export interface ApiResponse<T> {
    data: T;
    error?: string;
}

export interface Stats {
    repos: number;
    posts: number;
    books: number;
}
