export interface Post {
    id: string;
    title: string;
    url: string;
    date: string;
    platform: "hatena" | "zenn" | "github" | "booklog" | "microblog";
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
    // 汎用データフィールド（既存のデータと後方互換性を保つ）
    data?: {
        [key: string]: unknown;
        description?: string;
        thumbnail?: string;
        // 新しいフィールドも受け入れる
        likes?: number;
        stars?: number;
        forks?: number;
        comments?: number;
        views?: number;
        tags?: string[];
        category?: string;
        language?: string;
        lastCommit?: string;
        contributors?: number;
        rating?: number;
        status?: "read" | "reading" | "want_to_read";
        pages?: number;
        finishedDate?: string;
        publisher?: string;
        author?: string;
        genre?: string;
    };
}

export interface FormattedPost {
    id: string;
    title: string;
    url: string;
    date: Date;
    platform: "hatena" | "zenn" | "github" | "booklog" | "microblog";
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
