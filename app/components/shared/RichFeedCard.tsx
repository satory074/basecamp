"use client";

import type { Post } from "../../lib/types";
import { ArticleCard } from "@/app/components/shared/ArticleCard";
import { MediaCard } from "@/app/components/shared/MediaCard";
import { GitHubCard } from "@/app/components/shared/GitHubCard";
import { StatCard } from "@/app/components/shared/StatCard";
import { FeedItemCard } from "@/app/components/shared/FeedItemCard";
import { GenericCategoryBadge } from "@/app/components/shared/GenericCategoryBadge";

/** Platform → card variant mapping */
const articlePlatforms = new Set(["hatena", "zenn", "note", "hatenabookmark"]);
const mediaPlatforms = new Set(["booklog", "filmarks", "spotify"]);
const statPlatforms = new Set(["tenhou", "duolingo"]);

interface RichFeedCardProps {
    post: Post;
    platform: string;
}

export function RichFeedCard({ post, platform }: RichFeedCardProps) {
    let cardContent: React.ReactNode;

    if (platform === "github") {
        cardContent = <GitHubCard post={post} />;
    } else if (articlePlatforms.has(platform)) {
        cardContent = <ArticleCard post={post} platform={platform} />;
    } else if (mediaPlatforms.has(platform)) {
        cardContent = <MediaCard post={post} platform={platform} />;
    } else if (statPlatforms.has(platform)) {
        cardContent = <StatCard post={post} platform={platform} />;
    } else {
        // Compact fallback (ff14, ff14-achievement, soundcloud, etc.)
        return <FeedItemCard post={post} platform={platform} />;
    }

    return (
        <article
            className={`feed-item platform-${platform} feed-item-featured`}
        >
            <div className="rich-card-wrapper">
                <GenericCategoryBadge platform={platform} post={post} />
                <div className="rich-card-body">
                    {cardContent}
                </div>
            </div>
        </article>
    );
}
