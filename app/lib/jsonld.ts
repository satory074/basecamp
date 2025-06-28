export interface Person {
    "@type": "Person";
    name: string;
    url: string;
    sameAs: string[];
}

export interface WebSite {
    "@context": "https://schema.org";
    "@type": "WebSite";
    name: string;
    url: string;
    author: Person;
}

export interface BlogPosting {
    "@context": "https://schema.org";
    "@type": "BlogPosting";
    headline: string;
    url: string;
    datePublished: string;
    author: Person;
    image?: string;
    description?: string;
}

export function generateWebSiteSchema(siteTitle: string, siteUrl: string, author: Person): WebSite {
    return {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: siteTitle,
        url: siteUrl,
        author,
    };
}

export function generateBlogPostingSchema(
    post: {
        title: string;
        url: string;
        date: string;
        thumbnail?: string;
        description?: string;
    },
    author: Person
): BlogPosting {
    return {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        url: post.url,
        datePublished: post.date,
        author,
        ...(post.thumbnail && { image: post.thumbnail }),
        ...(post.description && { description: post.description }),
    };
}

export function generatePersonSchema(
    name: string,
    url: string,
    socialProfiles: string[]
): Person {
    return {
        "@type": "Person",
        name,
        url,
        sameAs: socialProfiles,
    };
}