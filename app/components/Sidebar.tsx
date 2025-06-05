import Profile from "./Profile";
import GithubWidget from "./GithubWidget";
import XWidget from "./XWidget";
import SoundCloudWidget from "./SoundCloudWidget";
import HatenaBlogWidget from "./HatenaBlogWidget";

interface SidebarProps extends React.PropsWithChildren {}

export default function Sidebar({}: SidebarProps) {
    return (
        <aside className="space-y-6">
            <div className="modern-card glass-card p-6">
                <Profile />
            </div>
            
            <div className="space-y-4">
                <div className="modern-card glass-card clickable-card p-4 hover:scale-105 transition-transform duration-300">
                    <GithubWidget />
                </div>
                
                <div className="modern-card glass-card clickable-card p-4 hover:scale-105 transition-transform duration-300">
                    <XWidget />
                </div>
                
                <div className="modern-card glass-card clickable-card p-4 hover:scale-105 transition-transform duration-300">
                    <SoundCloudWidget />
                </div>
                
                <div className="modern-card glass-card clickable-card p-4 hover:scale-105 transition-transform duration-300">
                    <HatenaBlogWidget />
                </div>
            </div>
        </aside>
    );
}