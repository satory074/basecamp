export interface Post {
    id: string;
    title: string;
    url: string;
    date: string;
    platform: "hatena" | "zenn" | "github";
    description?: string;
    collection?: string;
    data?: {
        [key: string]: any;
    };
}

export interface FormattedPost {
    id: string;
    title: string;
    url: string;
    date: Date;
    platform: "hatena" | "zenn" | "github";
    description?: string;
    iconComponent?: React.ReactNode;
}
