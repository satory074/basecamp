import Profile from "./Profile";
import GithubWidget from "./GithubWidget";
import XWidget from "./XWidget";
import SoundCloudWidget from "./SoundCloudWidget";
import HatenaBlogWidget from "./HatenaBlogWidget";
import FeedPosts from "./FeedPosts";
import type { Post } from "../lib/types";

interface SidebarProps {}

export default function Sidebar({}: SidebarProps) {
  const fetchRecentPosts = async (): Promise<Post[]> => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      const apiUrl = new URL("/api/zenn", baseUrl).toString();
      const res = await fetch(apiUrl);
      const data = await res.json();
      return data;
    } catch (error) {
      console.error("Failed to fetch recent posts:", error);
      return [];
    }
  };
  return (
    <aside className="w-64 p-4">
      <Profile />
      <div>
        <GithubWidget />
      </div>
      <div>
        <XWidget />
      </div>
      <div>
        <HatenaBlogWidget />
      </div>
      <div>
        <SoundCloudWidget />
      </div>
    </aside>
  );
}
