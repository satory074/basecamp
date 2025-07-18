import Profile from "./Profile";
import GithubWidget from "./GithubWidget";
import XWidget from "./XWidget";
import SoundCloudWidget from "./SoundCloudWidget";
import HatenaBlogWidget from "./HatenaBlogWidget";
import BooklogWidget from "./widgets/BooklogWidget";
import TenhouWidget from "./widgets/TenhouWidget";
import FF14Widget from "./widgets/FF14Widget";
import MicroblogWidget from "./widgets/MicroblogWidget";
import SubscriptionBadges from "./SubscriptionBadges";

export default function Sidebar() {
    return (
        <aside className="space-y-6">
            <div className="modern-card glass-card p-6">
                <Profile />
            </div>
            
            <div className="modern-card glass-card p-6">
                <h2 className="text-lg font-semibold mb-4">サブスクリプション</h2>
                <SubscriptionBadges />
            </div>
            
            <div className="space-y-4">
                <div className="modern-card glass-card clickable-card p-4 hover:scale-105 transition-transform duration-300">
                    <GithubWidget />
                </div>
                
                <div className="modern-card glass-card clickable-card p-4 hover:scale-105 transition-transform duration-300">
                    <XWidget />
                </div>
                
                <div className="modern-card glass-card clickable-card p-4 hover:scale-105 transition-transform duration-300">
                    <MicroblogWidget />
                </div>
                
                <div className="modern-card glass-card clickable-card p-4 hover:scale-105 transition-transform duration-300">
                    <SoundCloudWidget />
                </div>
                
                <div className="modern-card glass-card clickable-card p-4 hover:scale-105 transition-transform duration-300">
                    <HatenaBlogWidget />
                </div>
                
                <div className="modern-card glass-card clickable-card p-4 hover:scale-105 transition-transform duration-300">
                    <BooklogWidget />
                </div>
                
                <div className="modern-card glass-card clickable-card p-4 hover:scale-105 transition-transform duration-300">
                    <TenhouWidget />
                </div>
                
                <div className="modern-card glass-card clickable-card p-4 hover:scale-105 transition-transform duration-300">
                    <FF14Widget />
                </div>
            </div>
        </aside>
    );
}