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
