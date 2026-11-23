import { Metadata } from 'next'
import Link from 'next/link'
import { PublicNav } from '@/components/layout/PublicNav'
import { BrandLogo } from '@/components/shared/BrandLogo'

export const metadata: Metadata = {
  title: 'Market Insights & Institutional Updates | Blue ridge Bank',
  description: 'Read the latest financial research, treasury insights, and institutional news from Blue ridge Bank.',
}

const POSTS = [
  {
    code: 'RES-2026-01',
    slug: 'future-of-crypto-banking',
    title: 'The Evolution of Digital Asset Treasury in Institutional Banking',
    date: 'July 10, 2026',
    category: 'Digital Treasury',
    image: '/images/blog-digital-treasury.png',
    alt: 'Digital asset treasury and institutional multi-rail clearing architecture',
    excerpt: 'How multi-rail settlement and regulated digital asset custody are converging with traditional checking accounts.',
  },
  {
    code: 'RES-2026-02',
    slug: 'maximizing-smart-savings',
    title: '5 Capital Allocation Strategies for High-Yield Reserve Vaults',
    date: 'July 05, 2026',
    category: 'Wealth & Reserves',
    image: '/images/blog-reserve-vaults.png',
    alt: 'Wealth advisor reviewing capital allocation and reserve vaults',
    excerpt: 'Structured approaches to optimizing liquidity and yield using automated savings vaults and goal tracking.',
  },
  {
    code: 'RES-2026-03',
    slug: 'bank-grade-security-explained',
    title: 'Blue ridge Bank Cryptographic Security & Ledger Architecture',
    date: 'June 28, 2026',
    category: 'Security Briefing',
    image: '/images/blog-security-arch.png',
    alt: 'Cryptographic hardware and real-time financial telemetry studio',
    excerpt: 'An engineering overview of our 256-bit encryption, multi-token verification, and real-time fraud monitoring systems.',
  },
]

export default function BlogPage() {
  return (
    <div className="min-h-screen flex flex-col justify-between" style={{ background: '#F4F7FC', color: '#0A192F' }}>
      <div>
        <PublicNav />
        <section className="pt-28 sm:pt-36 pb-16 px-4 sm:px-6 brand-card-gradient text-white relative overflow-hidden">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            <div className="lg:col-span-7">
              <span className="inline-block px-3.5 py-1.5 rounded-full mb-4 text-xs font-semibold bg-white/15 text-blue-100">
                Institutional Research &amp; Briefings
              </span>
              <h1 className="font-display text-3xl sm:text-5xl font-bold text-white mb-4">
                Blue ridge Bank Market Insights
              </h1>
              <p className="text-base sm:text-lg max-w-2xl text-blue-100/90">
                Stay informed with research briefings, security advisories, and product updates from our banking and engineering teams.
              </p>
            </div>

            <div className="lg:col-span-5">
              <div className="relative animate-reveal">
                <div className="rounded-3xl overflow-hidden border-2 border-white/20 shadow-float bg-[#001F42]">
                  <img
                    src="/images/blog-digital-treasury.png"
                    alt="Blue ridge Bank institutional treasury research and market insights"
                    className="w-full h-56 sm:h-64 object-cover animate-ken-burns"
                  />
                </div>
                <div className="absolute bottom-3 left-3 sm:-left-3 rounded-2xl px-4 py-2.5 glass shadow-float animate-float">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#60A5FA] animate-live-dot flex-shrink-0" />
                    <span className="text-xs font-semibold text-white">2026 Research Briefings</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {POSTS.map(post => (
              <div
                key={post.slug}
                className="group bg-white rounded-3xl border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-48 sm:h-52 overflow-hidden bg-slate-100">
                    <img
                      src={post.image}
                      alt={post.alt}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-[11px] font-semibold bg-white/90 backdrop-blur-md text-[#002B5B] shadow-sm">
                      {post.category}
                    </span>
                  </div>
                  <div className="p-7 pb-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-mono text-slate-400">{post.code}</span>
                      <span className="text-xs text-slate-400">{post.date}</span>
                    </div>
                    <h2 className="font-display text-xl font-bold mb-3 text-[#002B5B]">
                      {post.title}
                    </h2>
                    <p className="text-sm leading-relaxed text-slate-500">
                      {post.excerpt}
                    </p>
                  </div>
                </div>
                <div className="mx-7 py-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Institutional Brief</span>
                  <Link
                    href="/auth/register"
                    className="text-xs font-semibold text-[#0052CC] hover:underline"
                  >
                    Read Briefing &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="py-10 px-4 sm:px-6 brand-card-gradient text-white">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <BrandLogo variant="light" size="sm" />
          <p className="text-xs text-blue-200">
            © 2026 Blue ridge Bank. All rights reserved. · support@theblueridges.com
          </p>
        </div>
      </footer>
    </div>
  )
}
