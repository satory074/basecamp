export interface Post {
    id: string;
    title: string;
    url: string;
    date: string;
    collection?: string;
    data?: {
        title?: string;
        pubdate?: string;
        link?: string;
        description?: string;
    };
}

export interface UnifiedPost {
    id: string;
    title: string;
    url: string;
    date: Date;
    platform: "hatena" | "zenn";
    description?: string;
}
