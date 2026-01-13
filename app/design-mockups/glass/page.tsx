"use client";

import Link from "next/link";
import {
  CodeBracketIcon,
  NewspaperIcon,
  BookOpenIcon,
  MusicalNoteIcon,
  SparklesIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

// Glassmorphism Style Mock
export default function GlassMockPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Gradient Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-pink-500">
        {/* Floating Blobs */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-[float_8s_ease-in-out_infinite]" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-[float_8s_ease-in-out_infinite_2s]" />
        <div className="absolute bottom-20 left-1/2 w-96 h-96 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-[float_8s_ease-in-out_infinite_4s]" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
          <div className="max-w-6xl mx-auto">
            <div className="backdrop-blur-xl bg-white/10 rounded-2xl px-6 py-4 border border-white/20 shadow-xl">
              <div className="flex items-center justify-between">
                <Link href="/design-mockups" className="text-sm text-white/70 hover:text-white transition-colors">
                  ← Back
                </Link>
                <span className="text-xl font-bold text-white">Basecamp</span>
                <div className="flex items-center gap-6 text-sm text-white/70">
                  <a href="#" className="hover:text-white transition-colors">About</a>
                  <a href="#" className="hover:text-white transition-colors">Works</a>
                  <a href="#" className="px-4 py-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors text-white">
                    Contact
                  </a>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="pt-36 pb-12 px-6">
          <div className="max-w-6xl mx-auto text-center">
            <div className="inline-block backdrop-blur-xl bg-white/10 rounded-3xl px-8 py-4 border border-white/20 mb-8">
              <span className="text-white/80">Welcome to my portfolio</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 drop-shadow-lg">
              Creative<br />
              <span className="bg-gradient-to-r from-white via-pink-200 to-white bg-clip-text text-transparent">
                Developer
              </span>
            </h1>
            <p className="text-xl text-white/70 max-w-xl mx-auto">
              Building beautiful digital experiences with modern technologies
            </p>
          </div>
        </section>

        {/* Glass Cards Grid */}
        <section className="px-6 pb-20">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

              {/* Profile Card */}
              <div className="lg:col-span-2 backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl hover:bg-white/15 transition-all duration-500 hover:scale-[1.02] hover:shadow-pink-500/20">
                <div className="flex items-start gap-6">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center shadow-lg">
                    <span className="text-3xl text-white font-bold">S</span>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white mb-2">satory074</h2>
                    <p className="text-white/60 mb-4">Software Engineer & Creator based in Tokyo</p>
                    <div className="flex flex-wrap gap-2">
                      {["TypeScript", "React", "Next.js", "Node.js"].map((skill) => (
                        <span key={skill} className="px-3 py-1 bg-white/10 rounded-full text-white/80 text-sm border border-white/10">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* GitHub Card */}
              <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-6 border border-white/20 shadow-2xl hover:bg-white/15 transition-all duration-500 hover:scale-[1.02] group cursor-pointer">
                <CodeBracketIcon className="w-10 h-10 text-white/60 mb-4 group-hover:text-white transition-colors" />
                <h3 className="text-xl font-semibold text-white mb-2">GitHub</h3>
                <p className="text-white/50 text-sm mb-4">42 repositories</p>
                <div className="flex items-center gap-2 text-white/40 text-sm">
                  <span>⭐ 156 stars</span>
                  <span>•</span>
                  <span>🍴 48 forks</span>
                </div>
              </div>

              {/* Hatena Card */}
              <div className="backdrop-blur-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-3xl p-6 border border-orange-300/30 shadow-2xl hover:from-orange-500/30 hover:to-red-500/30 transition-all duration-500 hover:scale-[1.02] group cursor-pointer">
                <NewspaperIcon className="w-10 h-10 text-orange-300 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-semibold text-white mb-2">Hatena Blog</h3>
                <p className="text-white/50 text-sm mb-4">Tech articles & thoughts</p>
                <p className="text-orange-200/80 text-sm">Latest: Building Modern UIs</p>
              </div>

              {/* Zenn Card */}
              <div className="backdrop-blur-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-3xl p-6 border border-cyan-300/30 shadow-2xl hover:from-cyan-500/30 hover:to-blue-500/30 transition-all duration-500 hover:scale-[1.02] group cursor-pointer">
                <SparklesIcon className="w-10 h-10 text-cyan-300 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-semibold text-white mb-2">Zenn</h3>
                <p className="text-white/50 text-sm mb-4">Technical notes & tips</p>
                <p className="text-cyan-200/80 text-sm">24 articles published</p>
              </div>

              {/* SoundCloud Card */}
              <div className="backdrop-blur-xl bg-gradient-to-br from-orange-600/20 to-pink-600/20 rounded-3xl p-6 border border-orange-300/30 shadow-2xl hover:from-orange-600/30 hover:to-pink-600/30 transition-all duration-500 hover:scale-[1.02] group cursor-pointer">
                <MusicalNoteIcon className="w-10 h-10 text-orange-300 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-semibold text-white mb-2">SoundCloud</h3>
                <p className="text-white/50 text-sm mb-4">Music & Tracks</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 flex items-center justify-center">
                    <span className="text-white">▶</span>
                  </div>
                  <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="w-1/2 h-full bg-gradient-to-r from-orange-400 to-pink-400 rounded-full" />
                  </div>
                </div>
              </div>

              {/* Booklog Card */}
              <div className="backdrop-blur-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-3xl p-6 border border-amber-300/30 shadow-2xl hover:from-amber-500/30 hover:to-yellow-500/30 transition-all duration-500 hover:scale-[1.02] group cursor-pointer">
                <BookOpenIcon className="w-10 h-10 text-amber-300 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-semibold text-white mb-2">Reading</h3>
                <p className="text-white/50 text-sm mb-4">Books & Reviews</p>
                <p className="text-amber-200/80 text-sm">128 books completed</p>
              </div>

              {/* Stats Card */}
              <div className="backdrop-blur-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-3xl p-6 border border-emerald-300/30 shadow-2xl hover:from-emerald-500/30 hover:to-teal-500/30 transition-all duration-500 hover:scale-[1.02] group cursor-pointer">
                <ChartBarIcon className="w-10 h-10 text-emerald-300 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-semibold text-white mb-2">Tenhou</h3>
                <p className="text-white/50 text-sm mb-4">Mahjong statistics</p>
                <div className="flex gap-4 text-emerald-200/80 text-sm">
                  <span>Rank: 5dan</span>
                  <span>Rate: 1856</span>
                </div>
              </div>

              {/* Wide CTA Card */}
              <div className="lg:col-span-3 backdrop-blur-xl bg-white/5 rounded-3xl p-8 border border-white/10 shadow-2xl">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">Interested in working together?</h3>
                    <p className="text-white/50">Let&apos;s create something amazing</p>
                  </div>
                  <button className="px-8 py-4 bg-gradient-to-r from-pink-500 to-violet-500 rounded-2xl text-white font-semibold shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 hover:scale-105 transition-all duration-300">
                    Get in Touch
                  </button>
                </div>
              </div>

            </div>
          </div>
        </section>
      </div>

      {/* Style Info */}
      <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-auto z-50">
        <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-4 border border-white/20">
          <p className="text-sm text-white/80">
            <span className="text-white font-semibold">Glassmorphism</span> - 透明感とブラー効果
          </p>
        </div>
      </div>

      {/* Custom Animation Styles */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(5deg); }
        }
      `}</style>
    </div>
  );
}
