"use client";

import Link from "next/link";

// プラットフォームリンク
const platforms = [
  { name: "GitHub", url: "#", color: "hover:text-gray-600" },
  { name: "Twitter", url: "#", color: "hover:text-blue-400" },
  { name: "Hatena", url: "#", color: "hover:text-red-500" },
  { name: "Zenn", url: "#", color: "hover:text-cyan-500" },
  { name: "SoundCloud", url: "#", color: "hover:text-orange-500" },
];

// 最近の投稿
const posts = [
  { id: 1, title: "Next.js 15の新機能まとめ", platform: "Hatena", time: "2時間前", color: "bg-red-500" },
  { id: 2, title: "TypeScript 5.4の型推論改善", platform: "Zenn", time: "5時間前", color: "bg-cyan-500" },
  { id: 3, title: "basecamp - Updated repository", platform: "GitHub", time: "8時間前", color: "bg-gray-600" },
  { id: 4, title: "Ambient Piano Sessions #12", platform: "SoundCloud", time: "1日前", color: "bg-orange-500" },
  { id: 5, title: "「影響力の武器」読了", platform: "Booklog", time: "2日前", color: "bg-amber-600" },
  { id: 6, title: "四段昇格達成！", platform: "Tenhou", time: "3日前", color: "bg-green-600" },
  { id: 7, title: "Satory Nocturne - Lv90到達", platform: "FF14", time: "5日前", color: "bg-blue-500" },
  { id: 8, title: "React Server Componentsの実践", platform: "Zenn", time: "1週間前", color: "bg-cyan-500" },
  { id: 9, title: "vim-config v2.0 リリース", platform: "GitHub", time: "1週間前", color: "bg-gray-600" },
  { id: 10, title: "「Clean Architecture」読書中", platform: "Booklog", time: "2週間前", color: "bg-amber-600" },
];

export default function SplitScreenMockup() {
  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row">
      {/* Sidebar - Fixed on desktop */}
      <aside className="w-full md:w-72 md:min-h-screen md:fixed md:left-0 md:top-0 border-b md:border-b-0 md:border-r border-gray-200 bg-white">
        <div className="p-8 md:sticky md:top-0">
          {/* Back link */}
          <Link
            href="/design-mockups"
            className="text-gray-400 hover:text-gray-600 text-sm mb-8 block"
          >
            ← 戻る
          </Link>

          {/* Profile */}
          <div className="mb-8">
            <div className="w-16 h-16 bg-gray-200 mb-4" />
            <h1 className="text-xl font-bold tracking-tight">satory074</h1>
            <p className="text-gray-500 text-sm mt-1">Creative Developer</p>
            <p className="text-gray-400 text-sm">Tokyo, JP</p>
          </div>

          {/* Separator */}
          <div className="border-t border-gray-200 my-6" />

          {/* Platform Links */}
          <nav className="space-y-3">
            {platforms.map(platform => (
              <a
                key={platform.name}
                href={platform.url}
                className={`block text-gray-500 ${platform.color} transition-colors text-sm`}
              >
                {platform.name}
              </a>
            ))}
          </nav>

          {/* Separator */}
          <div className="border-t border-gray-200 my-6" />

          {/* Stats */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Repos</span>
              <span className="font-medium text-gray-900">42</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Posts</span>
              <span className="font-medium text-gray-900">156</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Books</span>
              <span className="font-medium text-gray-900">89</span>
            </div>
          </div>

          {/* Footer in sidebar */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-gray-300 text-xs">© 2025 Basecamp</p>
          </div>
        </div>
      </aside>

      {/* Main Content - Scrollable */}
      <main className="flex-1 md:ml-72">
        <div className="max-w-2xl mx-auto px-6 md:px-8 py-8">
          <h2 className="text-lg font-bold text-gray-900 mb-6 pb-4 border-b border-gray-200">
            Recent Posts
          </h2>

          <div className="space-y-0">
            {posts.map(post => (
              <a
                key={post.id}
                href="#"
                className="block group"
              >
                <article className="py-5 border-b border-gray-100 hover:bg-gray-50 transition-colors -mx-4 px-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-2 h-2 ${post.color}`} />
                    <span className="text-gray-500 text-xs font-medium">
                      {post.platform}
                    </span>
                    <span className="text-gray-300">•</span>
                    <span className="text-gray-400 text-xs">{post.time}</span>
                  </div>
                  <h3 className="text-gray-900 font-medium group-hover:text-gray-600 transition-colors">
                    {post.title}
                  </h3>
                </article>
              </a>
            ))}
          </div>

          {/* Load more */}
          <div className="text-center mt-8">
            <button className="text-gray-400 hover:text-gray-600 text-sm border-b border-gray-300 hover:border-gray-500 transition-colors">
              さらに読み込む
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
