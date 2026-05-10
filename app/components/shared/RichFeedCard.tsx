"use client";

import type { Post } from "../../lib/types";
import { FeedCard } from "@/app/components/shared/FeedCard";
import { adaptPost } from "@/app/components/shared/feedCardAdapters";

interface RichFeedCardProps {
    post: Post;
    platform: string;
    posInSet?: number;
    setSize?: number;
}

export function RichFeedCard({ post, platform, posInSet, setSize }: RichFeedCardProps) {
    return <FeedCard {...adaptPost(post, platform, posInSet, setSize)} />;
}
