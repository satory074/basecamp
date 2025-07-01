export interface Post {
    id: string;
    title: string;
    url: string;
    date: string;
    platform: "hatena" | "zenn" | "github" | "booklog" | "microblog";
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
    platform: "hatena" | "zenn" | "github" | "booklog" | "microblog";
    description?: string;
    thumbnail?: string;
    iconComponent?: React.ReactNode;
}
