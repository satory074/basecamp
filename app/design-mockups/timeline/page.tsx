"use client";

import Link from "next/link";

// プラットフォーム別の色定義
const platformColors: Record<string, string> = {
  hatena: "bg-red-500",
  zenn: "bg-cyan-500",
  github: "bg-gray-600",
  soundcloud: "bg-orange-500",
  booklog: "bg-amber-600",
  tenhou: "bg-green-600",
  ff14: "bg-blue-500",
};

// サンプルデータ
const timeline = [
  { id: 1, title: "Next.js 15の新機能まとめ", platform: "hatena", time: "2時間前", url: "#" },
  { id: 2, title: "TypeScript 5.4の型推論改善", platform: "zenn", time: "5時間前", url: "#" },
  { id: 3, title: "basecamp - Updated repository", platform: "github", time: "8時間前", url: "#" },
  { id: 4, title: "Ambient Piano Sessions #12", platform: "soundcloud", time: "1日前", url: "#" },
  { id: 5, title: "「影響力の武器」読了", platform: "booklog", time: "2日前", url: "#" },
  { id: 6, title: "四段昇格達成！", platform: "tenhou", time: "3日前", url: "#" },
  { id: 7, title: "Satory Nocturne - Lv90到達", platform: "ff14", time: "5日前", url: "#" },
  { id: 8, title: "React Server Componentsの実践", platform: "zenn", time: "1週間前", url: "#" },
  { id: 9, title: "vim-config 新プラグイン追加", platform: "github", time: "1週間前", url: "#" },
  { id: 10, title: "「Clean Architecture」読書中", platform: "booklog", time: "2週間前", url: "#" },
];

export default function TimelineMockup() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold tracking-tight">BASECAMP</h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-500 text-sm">satory074</span>
              <Link
                href="/design-mockups"
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                ← 戻る
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Timeline */}
      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="space-y-0">
          {timeline.map((item, index) => (
            <a
              key={item.id}
              href={item.url}
              className="block group"
            >
              <article className="flex items-start gap-4 py-5 border-b border-gray-100 hover:bg-gray-50 transition-colors -mx-4 px-4">
                {/* Timeline dot */}
                <div className="flex flex-col items-center pt-1">
                  <div className={`w-3 h-3 ${platformColors[item.platform]}`} />
                  {index < timeline.length - 1 && (
                    <div className="w-px h-full bg-gray-100 mt-2" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-gray-500 text-xs font-medium uppercase tracking-wider">
                      {item.platform}
                    </span>
                  </div>
                  <h3 className="text-gray-900 font-medium group-hover:text-gray-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-gray-400 text-sm mt-1">{item.time}</p>
                </div>

                {/* Arrow */}
                <div className="text-gray-300 group-hover:text-gray-400 transition-colors pt-1">
                  →
                </div>
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
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-16">
        <div className="max-w-2xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {Object.entries(platformColors).map(([platform, color]) => (
                <div key={platform} className="flex items-center gap-1">
                  <div className={`w-2 h-2 ${color}`} />
                  <span className="text-xs text-gray-400 capitalize">{platform}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-gray-300 text-xs mt-4">© 2025 Basecamp</p>
        </div>
      </footer>
    </div>
  );
}
