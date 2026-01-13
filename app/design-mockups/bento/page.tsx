"use client";

import Link from "next/link";
import {
  CodeBracketIcon,
  NewspaperIcon,
  BookOpenIcon,
  MusicalNoteIcon,
  UserIcon,
  ChartBarIcon,
  SparklesIcon,
  ArrowRightIcon
} from "@heroicons/react/24/outline";

// Bento Box Grid Style Mock
export default function BentoMockPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 backdrop-blur-xl bg-black/50 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/design-mockups" className="text-sm text-white/60 hover:text-white transition-colors">
            ← スタイル選択に戻る
          </Link>
          <span className="text-xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            Basecamp
          </span>
          <div className="flex items-center gap-6 text-sm text-white/60">
            <a href="#" className="hover:text-white transition-colors">About</a>
            <a href="#" className="hover:text-white transition-colors">Works</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-6">
            <span className="bg-gradient-to-r from-white via-white/90 to-white/50 bg-clip-text text-transparent">
              Creative
            </span>
            <br />
            <span className="text-white/40">Developer</span>
          </h1>
          <p className="text-xl text-white/50 max-w-xl">
            Building digital experiences with modern technologies.
            Exploring the intersection of design and code.
          </p>
        </div>
      </section>

      {/* Bento Grid */}
      <section className="px-6 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-4 md:grid-cols-6 gap-4 auto-rows-[180px]">

            {/* Large Card - Profile */}
            <div className="col-span-4 md:col-span-2 row-span-2 bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-3xl p-8 border border-white/10 hover:border-white/20 transition-all duration-500 hover:scale-[1.02] group">
              <div className="h-full flex flex-col justify-between">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <UserIcon className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">satory074</h3>
                  <p className="text-white/50">Software Engineer & Creator</p>
                  <div className="mt-4 flex gap-2">
                    <span className="px-3 py-1 rounded-full bg-white/10 text-xs">TypeScript</span>
                    <span className="px-3 py-1 rounded-full bg-white/10 text-xs">React</span>
                    <span className="px-3 py-1 rounded-full bg-white/10 text-xs">Next.js</span>
                  </div>
                </div>
              </div>
            </div>

            {/* GitHub Card */}
            <div className="col-span-2 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-3xl p-6 border border-white/10 hover:border-white/20 transition-all duration-500 hover:scale-[1.02] group cursor-pointer">
              <div className="h-full flex flex-col justify-between">
                <CodeBracketIcon className="w-8 h-8 text-white/60 group-hover:text-white transition-colors" />
                <div>
                  <h3 className="text-lg font-semibold mb-1">GitHub</h3>
                  <p className="text-white/40 text-sm">42 repositories</p>
                </div>
              </div>
            </div>

            {/* Hatena Card */}
            <div className="col-span-2 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-3xl p-6 border border-orange-500/20 hover:border-orange-500/40 transition-all duration-500 hover:scale-[1.02] group cursor-pointer">
              <div className="h-full flex flex-col justify-between">
                <NewspaperIcon className="w-8 h-8 text-orange-400/60 group-hover:text-orange-400 transition-colors" />
                <div>
                  <h3 className="text-lg font-semibold mb-1">Hatena Blog</h3>
                  <p className="text-white/40 text-sm">Tech articles</p>
                </div>
              </div>
            </div>

            {/* Wide Card - Latest Post */}
            <div className="col-span-4 bg-gradient-to-r from-slate-800/50 via-slate-800/30 to-transparent rounded-3xl p-8 border border-white/10 hover:border-white/20 transition-all duration-500 hover:scale-[1.01] group cursor-pointer">
              <div className="h-full flex items-center justify-between">
                <div>
                  <span className="text-xs text-white/40 uppercase tracking-wider">Latest Post</span>
                  <h3 className="text-xl font-semibold mt-2 mb-2 group-hover:text-blue-400 transition-colors">
                    Building a Modern Portfolio with Next.js 15
                  </h3>
                  <p className="text-white/40 text-sm">A deep dive into App Router and Server Components...</p>
                </div>
                <ArrowRightIcon className="w-6 h-6 text-white/20 group-hover:text-white/60 group-hover:translate-x-2 transition-all" />
              </div>
            </div>

            {/* Zenn Card */}
            <div className="col-span-2 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-3xl p-6 border border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-500 hover:scale-[1.02] group cursor-pointer">
              <div className="h-full flex flex-col justify-between">
                <SparklesIcon className="w-8 h-8 text-cyan-400/60 group-hover:text-cyan-400 transition-colors" />
                <div>
                  <h3 className="text-lg font-semibold mb-1">Zenn</h3>
                  <p className="text-white/40 text-sm">Technical notes</p>
                </div>
              </div>
            </div>

            {/* SoundCloud Card */}
            <div className="col-span-2 row-span-2 bg-gradient-to-br from-orange-600/20 to-pink-600/20 rounded-3xl p-6 border border-orange-500/20 hover:border-orange-500/40 transition-all duration-500 hover:scale-[1.02] group cursor-pointer overflow-hidden relative">
              <div className="absolute inset-0 bg-[url('/music-wave.svg')] opacity-10" />
              <div className="h-full flex flex-col justify-between relative z-10">
                <MusicalNoteIcon className="w-8 h-8 text-orange-400/60 group-hover:text-orange-400 transition-colors" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">SoundCloud</h3>
                  <p className="text-white/40 text-sm mb-4">Music & Tracks</p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
                      <span className="text-xs">▶</span>
                    </div>
                    <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div className="w-1/3 h-full bg-orange-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Booklog Card */}
            <div className="col-span-2 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-3xl p-6 border border-amber-500/20 hover:border-amber-500/40 transition-all duration-500 hover:scale-[1.02] group cursor-pointer">
              <div className="h-full flex flex-col justify-between">
                <BookOpenIcon className="w-8 h-8 text-amber-400/60 group-hover:text-amber-400 transition-colors" />
                <div>
                  <h3 className="text-lg font-semibold mb-1">Reading</h3>
                  <p className="text-white/40 text-sm">128 books</p>
                </div>
              </div>
            </div>

            {/* Stats Card */}
            <div className="col-span-2 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-3xl p-6 border border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-500 hover:scale-[1.02] group cursor-pointer">
              <div className="h-full flex flex-col justify-between">
                <ChartBarIcon className="w-8 h-8 text-emerald-400/60 group-hover:text-emerald-400 transition-colors" />
                <div>
                  <h3 className="text-lg font-semibold mb-1">Tenhou</h3>
                  <p className="text-white/40 text-sm">Mahjong stats</p>
                </div>
              </div>
            </div>

            {/* Wide Footer Card */}
            <div className="col-span-4 md:col-span-6 bg-gradient-to-r from-slate-800/30 to-slate-800/10 rounded-3xl p-8 border border-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white/60">Want to connect?</h3>
                  <p className="text-white/30 text-sm mt-1">Let&apos;s build something together</p>
                </div>
                <button className="px-6 py-3 bg-white text-black rounded-full font-medium hover:bg-white/90 transition-colors">
                  Get in touch
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Style Info */}
      <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-auto">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
          <p className="text-sm text-white/60">
            <span className="text-white font-semibold">Bento Box Grid</span> - モダンなグリッドレイアウト
          </p>
        </div>
      </div>
    </div>
  );
}
