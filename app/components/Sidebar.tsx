import Profile from "./Profile";
import GithubWidget from "./GithubWidget";
import XWidget from "./XWidget";
import SoundCloudWidget from "./SoundCloudWidget";
import HatenaBlogWidget from "./HatenaBlogWidget";
import type { Post } from "../lib/types";

interface SidebarProps extends React.PropsWithChildren {}

export default function Sidebar({}: SidebarProps) {
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
        <SoundCloudWidget />
      </div>
      <div>
        <HatenaBlogWidget />
      </div>
    </aside>
  );
}
