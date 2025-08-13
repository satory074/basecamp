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
        <aside className="space-y-4">
            {/* コンパクトプロフィール */}
            <div className="glass-card p-4">
                <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">S</span>
                    </div>
                    <div>
                        <h3 className="font-semibold">satory074</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Web Developer</p>
                    </div>
                </div>
            </div>
            
            {/* クイックリンク */}
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
                <a href="https://github.com/satory074" className="glass-card p-3 flex items-center space-x-2 hover:scale-105 transition-transform duration-200">
                    <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                        <span className="text-xs">GH</span>
                    </div>
                    <span className="text-sm font-medium">GitHub</span>
                </a>
                
                <a href="https://twitter.com/satory074" className="glass-card p-3 flex items-center space-x-2 hover:scale-105 transition-transform duration-200">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <span className="text-xs">X</span>
                    </div>
                    <span className="text-sm font-medium">Twitter</span>
                </a>
                
                <a href="https://satory074.hatenablog.com" className="glass-card p-3 flex items-center space-x-2 hover:scale-105 transition-transform duration-200">
                    <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                        <span className="text-xs">HB</span>
                    </div>
                    <span className="text-sm font-medium">Hatena</span>
                </a>
                
                <a href="https://zenn.dev/satory074" className="glass-card p-3 flex items-center space-x-2 hover:scale-105 transition-transform duration-200">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <span className="text-xs">ZN</span>
                    </div>
                    <span className="text-sm font-medium">Zenn</span>
                </a>
            </div>
        </aside>
    );
}