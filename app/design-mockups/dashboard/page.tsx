"use client";

import Link from "next/link";

// 統計データ
const stats = [
  { label: "Repos", value: "42", icon: "💻" },
  { label: "Posts", value: "156", icon: "📝" },
  { label: "Books", value: "89", icon: "📚" },
  { label: "Games", value: "1,200+", icon: "🎮" },
];

// 最近のアクティビティ
const activities = [
  { id: 1, text: "Hatenaに新しい記事を投稿", platform: "hatena", time: "2時間前" },
  { id: 2, text: "basecampリポジトリを更新", platform: "github", time: "5時間前" },
  { id: 3, text: "天鳳で四段に昇格", platform: "tenhou", time: "1日前" },
  { id: 4, text: "「影響力の武器」を読了", platform: "booklog", time: "2日前" },
  { id: 5, text: "新曲をSoundCloudにアップ", platform: "soundcloud", time: "3日前" },
];

// おすすめコンテンツ
const featured = [
  { id: 1, title: "Next.js 15の新機能まとめ", platform: "hatena", views: "1.2k" },
  { id: 2, title: "basecamp", platform: "github", stars: "24" },
];

const platformColors: Record<string, string> = {
  hatena: "text-red-500",
  zenn: "text-cyan-500",
  github: "text-gray-600",
  soundcloud: "text-orange-500",
  booklog: "text-amber-600",
  tenhou: "text-green-600",
  ff14: "text-blue-500",
};

export default function DashboardMockup() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight">satory074</h1>
              <p className="text-gray-500 text-sm">Creative Developer</p>
            </div>
            <Link
              href="/design-mockups"
              className="text-gray-400 hover:text-gray-600 text-sm"
            >
              ← 戻る
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map(stat => (
            <div
              key={stat.label}
              className="bg-white border border-gray-200 p-6 text-center hover:border-gray-300 transition-colors"
            >
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-gray-500 text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Latest Activity */}
          <div className="bg-white border border-gray-200 p-6">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>📊</span> Latest Activity
            </h2>
            <div className="space-y-4">
              {activities.map(activity => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0"
                >
                  <div className={`text-sm ${platformColors[activity.platform]}`}>●</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-700 text-sm">{activity.text}</p>
                    <p className="text-gray-400 text-xs mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Featured Content */}
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 p-6">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>🎯</span> Featured
              </h2>
              <div className="space-y-3">
                {featured.map(item => (
                  <a
                    key={item.id}
                    href="#"
                    className="block p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <h3 className="font-medium text-gray-900">{item.title}</h3>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <span className="capitalize">{item.platform}</span>
                      {item.views && <span>• {item.views} views</span>}
                      {item.stars && <span>• ⭐ {item.stars}</span>}
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Now Playing */}
            <div className="bg-white border border-gray-200 p-6">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>🎵</span> Now Playing
              </h2>
              <div className="bg-orange-50 p-4 border border-orange-200">
                <p className="text-orange-700 font-medium">Ambient Piano Sessions #12</p>
                <p className="text-orange-500 text-sm mt-1">SoundCloud • 3:42</p>
                <div className="mt-3 flex items-center gap-2">
                  <div className="w-full bg-orange-200 h-1">
                    <div className="bg-orange-500 h-1 w-1/3" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Links */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex flex-wrap justify-center gap-6">
            {Object.entries(platformColors).map(([platform, color]) => (
              <a
                key={platform}
                href="#"
                className={`${color} hover:opacity-70 text-sm font-medium capitalize transition-opacity`}
              >
                {platform}
              </a>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-8">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <p className="text-gray-400 text-xs text-center">© 2025 Basecamp</p>
        </div>
      </footer>
    </div>
  );
}
