import Profile from "./Profile";
import GithubWidget from "./GithubWidget";
import XWidget from "./XWidget";
import SoundCloudWidget from "./SoundCloudWidget";
import HatenaBlogWidget from "./HatenaBlogWidget";
import BooklogWidget from "./widgets/BooklogWidget";
import TenhouWidget from "./widgets/TenhouWidget";
import FF14Widget from "./widgets/FF14Widget";
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
            
            {/* モバイルでは2カラムグリッド、デスクトップでは縦並び */}
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 lg:space-y-4 lg:gap-0">
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