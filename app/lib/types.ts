export interface Post {
    collection: string;
    id: string;
    data: {
        title: string;
        pubdate: string;
        link?: string;
        description?: string;
    };
}
