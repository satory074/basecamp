export interface Person {
    "@type": "Person";
    name: string;
    url: string;
    sameAs: string[];
    jobTitle?: string;
    worksFor?: Organization;
    alumniOf?: string[];
    knowsAbout?: string[];
}

export interface Organization {
    "@type": "Organization";
    name: string;
    url?: string;
}

export interface WebSite {
    "@context": "https://schema.org";
    "@type": "WebSite";
    name: string;
    url: string;
    description: string;
    author: Person;
    inLanguage: string;
    copyrightYear: number;
    copyrightHolder: Person;
    potentialAction?: SearchAction;
}

export interface SearchAction {
    "@type": "SearchAction";
    target: {
        "@type": "EntryPoint";
        urlTemplate: string;
    };
    "query-input": string;
}

export interface ProfilePage {
    "@context": "https://schema.org";
    "@type": "ProfilePage";
    name: string;
    url: string;
    description: string;
    about: Person;
    inLanguage: string;
    isPartOf: WebSite;
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

export function generateWebSiteSchema(siteTitle: string, siteUrl: string, description: string, author: Person): WebSite {
    return {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: siteTitle,
        url: siteUrl,
        description,
        author,
        inLanguage: "ja-JP",
        copyrightYear: new Date().getFullYear(),
        copyrightHolder: author,
        potentialAction: {
            "@type": "SearchAction",
            target: {
                "@type": "EntryPoint",
                urlTemplate: `${siteUrl}/search?q={search_term_string}`
            },
            "query-input": "required name=search_term_string"
        }
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
        jobTitle: "Web Developer",
        knowsAbout: [
            "JavaScript",
            "TypeScript", 
            "React",
            "Next.js",
            "Node.js",
            "Web Development",
            "Frontend Development",
            "Full Stack Development"
        ]
    };
}

export function generateProfilePageSchema(
    siteTitle: string,
    siteUrl: string,
    description: string,
    author: Person,
    website: WebSite
): ProfilePage {
    return {
        "@context": "https://schema.org",
        "@type": "ProfilePage",
        name: `${author.name} - Profile`,
        url: siteUrl,
        description,
        about: author,
        inLanguage: "ja-JP",
        isPartOf: website
    };
}