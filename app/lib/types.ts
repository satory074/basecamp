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
    tags?: string[];
    category?: string;
}

/** Note 記事 */
export interface NotePost extends BasePost {
    platform: "note";
    likes?: number;
    creatorName?: string;
}

/** Hatena Bookmark ブックマーク記録 */
export interface HatenaBookmarkPost extends BasePost {
    platform: "hatenabookmark";
    bookmarkCount?: number;
}

/** Filmarks 視聴記録 */
export interface FilmarksPost extends BasePost {
    platform: "filmarks";
    contentType?: "movie" | "drama" | "anime";
    rating?: number;
}

/** Spotify 再生/プレイリスト記録 */
export interface SpotifyPost extends BasePost {
    platform: "spotify";
    artist?: string;
    albumName?: string;
    sourceType?: "recently_played" | "playlist_added";
    playlistName?: string;
}

/** FF14 アチーブメント */
export interface FF14AchievementPost extends BasePost {
    platform: "ff14-achievement";
    category?: string; // バトル、クエスト、探検等
}

/** X (Twitter) ポスト */
export interface XPost extends BasePost {
    platform: "x";
    tweetId: string;
    category: "post" | "like" | "bookmark";
}

/** Duolingo 学習記録 */
export interface DuolingoPost extends BasePost {
    platform: "duolingo";
    category?: "daily" | "milestone";
    xpGained?: number;
    streak?: number;
}

/** Steam 実績 */
export interface SteamPost extends BasePost {
    platform: "steam";
    gameName?: string;
    gameId?: number;
}

/** Swarm (Foursquare) チェックイン */
export interface SwarmPost extends BasePost {
    platform: "swarm";
    venueName?: string;
    venueCategory?: string;
    city?: string;
    shout?: string;
}

/** 泣いた記録 */
export interface NaitaPost extends BasePost {
    platform: "naita";
    sourcePlatform: string;
    mediaType: string;
    notes?: string;
    watchedAt: string;
}

/** AI生成日記エントリ */
export interface DiaryPost extends BasePost {
    platform: "diary";
    content?: string; // full diary text (same as description)
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
export type PlatformPost = GitHubPost | HatenaPost | ZennPost | BooklogPost | NotePost | HatenaBookmarkPost | FilmarksPost | SpotifyPost | FF14AchievementPost | XPost | DuolingoPost | SteamPost | SwarmPost | NaitaPost | DiaryPost | GenericPost;

// ============================
// Legacy Type (後方互換性)
// ============================

/** @deprecated 新規コードではPlatformPostを使用してください */
export interface Post {
    id: string;
    title: string;
    url: string;
    date: string;
    platform: "hatena" | "zenn" | "github" | "booklog" | "note" | "hatenabookmark" | "filmarks" | "spotify" | "ff14-achievement" | "x" | "steam" | "swarm" | "microblog" | string;
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
// App Catalog Types
// ============================

/** Featured App エントリ（GitHub topic "featured-app" から自動生成） */
export interface AppEntry {
    id: string;            // repo 名（例: "tenji"）
    name: string;          // 表示名（repo description 由来 or repo 名）
    description?: string;  // repo description
    url: string;           // 公開 URL（repo の homepage）
    repoUrl: string;       // GitHub repo URL
    tags: string[];        // GitHub topics（"featured-app" を除く）
    thumbnailPath: string; // ローカル画像パス（例: "/images/apps/tenji.jpg" or placeholder）
    hasOgImage: boolean;   // og:image 取得成功したか（プレースホルダ表示判定用）
    createdAt: string;     // repo created_at
    stars?: number;        // repo stars
}

export interface AppsFile {
    lastUpdated: string;
    apps: AppEntry[];
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
