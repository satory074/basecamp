"use client";

import Link from "next/link";

// Neobrutalism Style Mock
export default function BrutalMockPage() {
  return (
    <div className="min-h-screen bg-[#FFFEF0] text-black">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-[#FFFEF0]">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white border-4 border-black px-6 py-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between">
              <Link href="/design-mockups" className="text-sm hover:underline underline-offset-4">
                ← Back
              </Link>
              <span className="text-2xl font-black tracking-tight">BASECAMP</span>
              <div className="flex items-center gap-4">
                <a href="#" className="px-4 py-2 bg-[#FF6B6B] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all font-bold text-sm">
                  CONTACT
                </a>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-36 pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-[#FFE66D] border-4 border-black p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            <h1 className="text-6xl md:text-8xl font-black leading-none mb-6">
              CREATIVE<br />
              <span className="text-[#FF6B6B]">DEVELOPER</span>
            </h1>
            <p className="text-xl md:text-2xl font-bold max-w-xl">
              Building cool stuff on the internet since 2020.
            </p>
          </div>
        </div>
      </section>

      {/* Cards Grid */}
      <section className="px-6 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* Profile Card */}
            <div className="lg:col-span-2 bg-[#4ECDC4] border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
              <div className="flex items-start gap-6">
                <div className="w-24 h-24 bg-white border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <span className="text-4xl font-black">S</span>
                </div>
                <div>
                  <h2 className="text-3xl font-black mb-2">SATORY074</h2>
                  <p className="text-lg font-bold mb-4">Software Engineer from Tokyo</p>
                  <div className="flex flex-wrap gap-2">
                    {["TypeScript", "React", "Next.js"].map((skill) => (
                      <span key={skill} className="px-3 py-1 bg-white border-2 border-black font-bold text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* GitHub Card */}
            <div className="bg-[#292F36] text-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer">
              <div className="text-4xl mb-4">{"</>"}</div>
              <h3 className="text-2xl font-black mb-2">GITHUB</h3>
              <p className="font-bold text-white/80">42 repos</p>
              <div className="mt-4 flex gap-4 text-sm font-bold">
                <span>⭐ 156</span>
                <span>🍴 48</span>
              </div>
            </div>

            {/* Hatena Card */}
            <div className="bg-[#FF6B6B] border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-2xl font-black mb-2">HATENA</h3>
              <p className="font-bold">Tech Blog</p>
              <div className="mt-4 bg-white border-2 border-black p-3">
                <p className="text-sm font-bold truncate">Latest: Building Modern UIs...</p>
              </div>
            </div>

            {/* Zenn Card */}
            <div className="bg-[#95E1D3] border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer">
              <div className="text-4xl mb-4">✨</div>
              <h3 className="text-2xl font-black mb-2">ZENN</h3>
              <p className="font-bold">Tech Notes</p>
              <div className="mt-4 bg-white border-2 border-black p-3">
                <p className="text-sm font-bold">24 articles</p>
              </div>
            </div>

            {/* SoundCloud Card */}
            <div className="bg-[#FF9F43] border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer">
              <div className="text-4xl mb-4">🎵</div>
              <h3 className="text-2xl font-black mb-2">SOUNDCLOUD</h3>
              <p className="font-bold">Music</p>
              <div className="mt-4 flex items-center gap-3">
                <button className="w-12 h-12 bg-white border-2 border-black font-black text-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all">
                  ▶
                </button>
                <div className="flex-1 h-4 bg-white border-2 border-black">
                  <div className="w-1/3 h-full bg-black" />
                </div>
              </div>
            </div>

            {/* Booklog Card */}
            <div className="bg-[#DDA0DD] border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-2xl font-black mb-2">READING</h3>
              <p className="font-bold">128 books</p>
              <div className="mt-4 flex gap-1">
                {[1,2,3,4,5].map((star) => (
                  <span key={star} className="text-xl">{star <= 4 ? "★" : "☆"}</span>
                ))}
              </div>
            </div>

            {/* Tenhou Card */}
            <div className="bg-[#98D8C8] border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer">
              <div className="text-4xl mb-4">🀄</div>
              <h3 className="text-2xl font-black mb-2">TENHOU</h3>
              <p className="font-bold">Mahjong Stats</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="bg-white border-2 border-black p-2 text-center">
                  <p className="text-xs font-bold">RANK</p>
                  <p className="font-black">5段</p>
                </div>
                <div className="bg-white border-2 border-black p-2 text-center">
                  <p className="text-xs font-bold">RATE</p>
                  <p className="font-black">1856</p>
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div className="lg:col-span-3 bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { label: "REPOS", value: "42", color: "#292F36" },
                  { label: "POSTS", value: "128", color: "#FF6B6B" },
                  { label: "BOOKS", value: "256", color: "#DDA0DD" },
                  { label: "YEARS", value: "5+", color: "#4ECDC4" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="text-5xl md:text-6xl font-black" style={{ color: stat.color }}>
                      {stat.value}
                    </p>
                    <p className="text-sm font-black mt-2">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Card */}
            <div className="lg:col-span-3 bg-[#FFE66D] border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-3xl font-black mb-2">WANT TO WORK TOGETHER?</h3>
                  <p className="font-bold text-lg">Let&apos;s build something awesome!</p>
                </div>
                <button className="px-8 py-4 bg-[#FF6B6B] border-4 border-black font-black text-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                  GET IN TOUCH →
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t-4 border-black">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="font-black">© 2025 BASECAMP</span>
          <div className="flex gap-4">
            {["GitHub", "Twitter", "LinkedIn"].map((social) => (
              <a key={social} href="#" className="px-3 py-1 bg-black text-white font-bold text-sm hover:bg-[#FF6B6B] transition-colors">
                {social}
              </a>
            ))}
          </div>
        </div>
      </footer>

      {/* Style Info */}
      <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-auto z-50">
        <div className="bg-[#FFE66D] border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-sm font-black">
            NEOBRUTALISM - 太い枠とオフセットシャドウ
          </p>
        </div>
      </div>
    </div>
  );
}
