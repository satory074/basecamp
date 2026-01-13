"use client";

import Link from "next/link";

const mockups = [
  {
    id: "category-tabs",
    title: "A: カテゴリタブ型",
    description: "コンテンツをカテゴリ（TECH/CREATIVE/GAMING）で整理し、タブで切り替え。フィルタリングでユーザーが興味に応じて表示を変更可能。",
    preview: "bg-white border border-gray-200",
    accentColor: "bg-blue-500",
    features: ["タブフィルタリング", "カードグリッド", "カテゴリ整理"],
  },
  {
    id: "timeline",
    title: "B: タイムライン型",
    description: "SNSフィード風の時系列リスト。各プラットフォームを色付きドットで識別し、活動の活発さをアピール。",
    preview: "bg-white border border-gray-200",
    accentColor: "bg-green-500",
    features: ["時系列表示", "色付きドット", "SNS風フィード"],
  },
  {
    id: "dashboard",
    title: "C: ダッシュボード型",
    description: "統計数値を前面に出した2カラムのウィジェット構成。一目で全体像がわかるデータ重視デザイン。",
    preview: "bg-white border border-gray-200",
    accentColor: "bg-purple-500",
    features: ["統計重視", "2カラム構成", "ウィジェット"],
  },
  {
    id: "split-screen",
    title: "D: スプリットスクリーン型",
    description: "固定サイドバーにプロフィール、右側にスクロール可能なコンテンツエリア。プロフェッショナルな印象。",
    preview: "bg-white border border-gray-200",
    accentColor: "bg-orange-500",
    features: ["固定サイドバー", "スクロールコンテンツ", "プロ印象"],
  },
];

export default function DesignMockupsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-gray-900">
            新デザインモックアップ
          </h1>
          <p className="text-gray-600 text-lg mb-2">
            コンテンツ分析に基づく4つのレイアウト案
          </p>
          <p className="text-gray-500 text-sm">
            白ベース + プラットフォーム別アクセントカラー
          </p>
          <Link
            href="/"
            className="inline-block mt-4 text-gray-600 hover:text-black border-b border-gray-400 hover:border-black transition-colors"
          >
            ← 現在のサイトに戻る
          </Link>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {mockups.map((mockup) => (
            <Link
              key={mockup.id}
              href={`/design-mockups/${mockup.id}`}
              className="group block"
            >
              <div className="bg-white overflow-hidden border border-gray-200 hover:border-gray-400 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                {/* Preview Area */}
                <div
                  className={`h-40 ${mockup.preview} flex items-center justify-center relative overflow-hidden`}
                >
                  <div className={`w-3 h-3 ${mockup.accentColor} mr-2`} />
                  <span className="text-gray-600 text-sm font-medium">
                    クリックでプレビュー
                  </span>
                </div>

                {/* Content */}
                <div className="p-6 border-t border-gray-100">
                  <h2 className="text-lg font-bold mb-2 text-gray-900 group-hover:text-gray-600 transition-colors">
                    {mockup.title}
                  </h2>
                  <p className="text-gray-500 text-sm mb-4 leading-relaxed">
                    {mockup.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {mockup.features.map((feature) => (
                      <span
                        key={feature}
                        className="px-3 py-1 bg-gray-100 text-gray-600 text-xs border border-gray-200"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Previous mockups link */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-gray-500 text-sm text-center mb-4">以前のモックアップ</p>
          <div className="flex justify-center gap-4 flex-wrap">
            {["bento", "minimal", "glass", "brutal"].map((id) => (
              <Link
                key={id}
                href={`/design-mockups/${id}`}
                className="text-gray-400 hover:text-gray-600 text-sm border-b border-gray-300 hover:border-gray-500"
              >
                {id}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
