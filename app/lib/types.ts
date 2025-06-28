export interface Post {
    id: string;
    title: string;
    url: string;
    date: string;
    platform: "hatena" | "zenn" | "github" | "booklog";
    description?: string;
    collection?: string;
    thumbnail?: string;
    data?: {
        [key: string]: unknown;
        description?: string;
        thumbnail?: string;
    };
}

export interface FormattedPost {
    id: string;
    title: string;
    url: string;
    date: Date;
    platform: "hatena" | "zenn" | "github" | "booklog";
    description?: string;
    thumbnail?: string;
    iconComponent?: React.ReactNode;
}
