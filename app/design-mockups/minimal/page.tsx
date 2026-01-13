"use client";

import Link from "next/link";

// Minimal Monochrome Style Mock
export default function MinimalMockPage() {
  return (
    <div className="min-h-screen bg-white text-black">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-8 py-6 bg-white border-b border-black">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/design-mockups" className="text-sm text-black/50 hover:text-black transition-colors">
            ← Back
          </Link>
          <span className="text-lg font-bold tracking-tight">BASECAMP</span>
          <div className="flex items-center gap-8 text-sm">
            <a href="#" className="hover:underline underline-offset-4">Work</a>
            <a href="#" className="hover:underline underline-offset-4">About</a>
            <a href="#" className="hover:underline underline-offset-4">Contact</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-24 px-8 border-b border-black">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-[12vw] md:text-[10vw] font-bold leading-[0.85] tracking-tighter">
            CREATIVE<br />
            <span className="text-black/20">DEVELOPER</span>
          </h1>
        </div>
      </section>

      {/* Info Grid */}
      <section className="px-8 py-16 border-b border-black">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-0">
          <div className="border-r border-black pr-8 py-4">
            <span className="text-xs uppercase tracking-widest text-black/40">Location</span>
            <p className="text-lg mt-2">Tokyo, Japan</p>
          </div>
          <div className="border-r border-black px-8 py-4">
            <span className="text-xs uppercase tracking-widest text-black/40">Focus</span>
            <p className="text-lg mt-2">Web Development</p>
          </div>
          <div className="pl-8 py-4">
            <span className="text-xs uppercase tracking-widest text-black/40">Status</span>
            <p className="text-lg mt-2">Available for work</p>
          </div>
        </div>
      </section>

      {/* Content List */}
      <section className="px-8 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-xs uppercase tracking-widest text-black/40 mb-12">Recent Work</h2>

          {/* List Items */}
          <div className="space-y-0">
            {[
              { title: "Building a Modern Portfolio", platform: "Hatena", date: "2025.01" },
              { title: "React Server Components Deep Dive", platform: "Zenn", date: "2025.01" },
              { title: "basecamp", platform: "GitHub", date: "2025.01" },
              { title: "TypeScript Design Patterns", platform: "Hatena", date: "2024.12" },
              { title: "Next.js 15 Migration Guide", platform: "Zenn", date: "2024.12" },
            ].map((item, i) => (
              <div
                key={i}
                className="group border-t border-black py-8 flex items-center justify-between cursor-pointer hover:bg-black hover:text-white transition-all duration-300 px-4 -mx-4"
              >
                <div className="flex items-center gap-8">
                  <span className="text-sm text-black/40 group-hover:text-white/40 w-16">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-2xl md:text-3xl font-medium">{item.title}</h3>
                </div>
                <div className="flex items-center gap-8">
                  <span className="text-sm text-black/40 group-hover:text-white/40">{item.platform}</span>
                  <span className="text-sm">{item.date}</span>
                  <span className="text-2xl group-hover:translate-x-2 transition-transform">→</span>
                </div>
              </div>
            ))}
            <div className="border-t border-black" />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-8 py-16 bg-black text-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-xs uppercase tracking-widest text-white/40 mb-12">Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "Repositories", value: "42" },
              { label: "Blog Posts", value: "128" },
              { label: "Books Read", value: "256" },
              { label: "Years Active", value: "5+" },
            ].map((stat, i) => (
              <div key={i}>
                <p className="text-6xl md:text-7xl font-bold">{stat.value}</p>
                <p className="text-sm text-white/40 mt-2 uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platforms */}
      <section className="px-8 py-16 border-b border-black">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-xs uppercase tracking-widest text-black/40 mb-12">Platforms</h2>
          <div className="flex flex-wrap gap-4">
            {["GitHub", "Hatena", "Zenn", "SoundCloud", "Booklog", "Tenhou", "FF14"].map((platform) => (
              <a
                key={platform}
                href="#"
                className="px-6 py-3 border-2 border-black hover:bg-black hover:text-white transition-all duration-300 text-sm uppercase tracking-wider"
              >
                {platform}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="px-8 py-24">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-8">Let&apos;s work together</h2>
          <a
            href="#"
            className="inline-block px-12 py-4 bg-black text-white text-lg hover:bg-black/80 transition-colors"
          >
            Get in touch
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 py-8 border-t border-black">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-black/40">
          <span>© 2025 Basecamp</span>
          <span>Minimal Design</span>
        </div>
      </footer>

      {/* Style Info */}
      <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-auto">
        <div className="bg-black text-white rounded-none p-4 border border-black">
          <p className="text-sm">
            <span className="font-bold">Minimal Monochrome</span> - Swiss Design風
          </p>
        </div>
      </div>
    </div>
  );
}
