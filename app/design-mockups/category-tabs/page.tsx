"use client";

import Link from "next/link";
import { useState } from "react";

// プラットフォーム別の色定義
const platformColors: Record<string, { bg: string; text: string; dot: string }> = {
  hatena: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500" },
  zenn: { bg: "bg-cyan-50", text: "text-cyan-600", dot: "bg-cyan-500" },
  github: { bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-600" },
  soundcloud: { bg: "bg-orange-50", text: "text-orange-600", dot: "bg-orange-500" },
  booklog: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-600" },
  tenhou: { bg: "bg-green-50", text: "text-green-600", dot: "bg-green-600" },
  ff14: { bg: "bg-blue-50", text: "text-blue-600", dot: "bg-blue-500" },
};

// サンプルデータ
const samplePosts = [
  { id: 1, title: "Next.js 15の新機能まとめ", platform: "hatena", category: "tech", date: "2025-01-12" },
  { id: 2, title: "TypeScript 5.4の型推論改善", platform: "zenn", category: "tech", date: "2025-01-10" },
  { id: 3, title: "basecamp - Personal Homepage", platform: "github", category: "tech", date: "2025-01-08" },
  { id: 4, title: "Ambient Piano Sessions", platform: "soundcloud", category: "creative", date: "2025-01-06" },
  { id: 5, title: "影響力の武器", platform: "booklog", category: "creative", date: "2025-01-04" },
  { id: 6, title: "四段昇格達成！", platform: "tenhou", category: "gaming", date: "2025-01-02" },
  { id: 7, title: "Satory Nocturne - Lv90", platform: "ff14", category: "gaming", date: "2024-12-28" },
  { id: 8, title: "React Server Componentsの実践", platform: "zenn", category: "tech", date: "2024-12-25" },
];

const categories = [
  { id: "all", label: "ALL" },
  { id: "tech", label: "TECH" },
  { id: "creative", label: "CREATIVE" },
  { id: "gaming", label: "GAMING" },
];

export default function CategoryTabsMockup() {
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredPosts = activeCategory === "all"
    ? samplePosts
    : samplePosts.filter(post => post.category === activeCategory);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">satory074</h1>
              <p className="text-gray-500 text-sm mt-1">Creative Developer / Tokyo</p>
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

      {/* Category Tabs */}
      <nav className="border-b border-gray-200 sticky top-0 bg-white z-10">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex gap-1">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                  activeCategory === cat.id
                    ? "border-black text-black"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content Grid */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredPosts.map(post => {
            const colors = platformColors[post.platform];
            return (
              <article
                key={post.id}
                className={`p-5 border border-gray-200 hover:border-gray-300 transition-all cursor-pointer group ${colors.bg}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 mt-2 ${colors.dot}`} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 group-hover:text-gray-600 transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-2 text-xs">
                      <span className={`${colors.text} font-medium`}>
                        {post.platform}
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-400">{post.date}</span>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-400">
            {Object.keys(platformColors).map(platform => (
              <a
                key={platform}
                href="#"
                className="hover:text-gray-600 transition-colors capitalize"
              >
                {platform}
              </a>
            ))}
          </div>
          <p className="text-center text-gray-300 text-xs mt-4">© 2025 Basecamp</p>
        </div>
      </footer>
    </div>
  );
}
