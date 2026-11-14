import type { Post } from "../../lib/types";
import { FeedCard } from "@/app/components/shared/FeedCard";
import { adaptPost } from "@/app/components/shared/feedCardAdapters";

interface RichFeedCardProps {
    post: Post;
    platform: string;
    /** "time" = 日付見出しの下で使う (HH:mm だけ出す) */
    timeFormat?: "time" | "datetime";
}

export function RichFeedCard({ post, platform, timeFormat }: RichFeedCardProps) {
    return <FeedCard {...adaptPost(post, platform)} timeFormat={timeFormat} />;
}
