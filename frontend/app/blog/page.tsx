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
    date: 'JULY 10, 2026',
    category: 'DIGITAL TREASURY',
    excerpt: 'How multi-rail settlement and regulated digital asset custody are converging with traditional checking accounts.',
  },
  {
    code: 'RES-2026-02',
    slug: 'maximizing-smart-savings',
    title: '5 Capital Allocation Strategies for High-Yield Reserve Vaults',
    date: 'JULY 05, 2026',
    category: 'WEALTH & RESERVES',
    excerpt: 'Structured approaches to optimizing liquidity and yield using automated savings vaults and goal tracking.',
  },
  {
    code: 'RES-2026-03',
    slug: 'bank-grade-security-explained',
    title: 'Blue ridge Bank Cryptographic Security & Ledger Architecture',
    date: 'JUNE 28, 2026',
    category: 'SECURITY BRIEFING',
    excerpt: 'An engineering overview of our 256-bit encryption, multi-token verification, and real-time fraud monitoring systems.',
  },
]

export default function BlogPage() {
  return (
    <div className="min-h-screen flex flex-col justify-between" style={{ background: '#F2F5F9', color: '#0A192F' }}>
      <div>
        <PublicNav />
        <section
          className="pt-28 sm:pt-36 pb-16 px-4 sm:px-6 border-b-4"
          style={{ background: '#002B5B', borderColor: '#0052CC', color: '#FFFFFF' }}
        >
          <div className="max-w-7xl mx-auto">
            <div
              className="inline-block px-3 py-1 mb-4 text-xs font-mono uppercase tracking-widest font-bold"
              style={{ background: '#0052CC', color: '#FFFFFF' }}
            >
              INSTITUTIONAL RESEARCH &amp; BRIEFINGS
            </div>
            <h1 className="font-display text-3xl sm:text-5xl font-bold text-white mb-4">
              Blue ridge Bank Market Insights
            </h1>
            <p className="text-base sm:text-lg max-w-2xl" style={{ color: '#BFDBFE' }}>
              Stay informed with research briefings, security advisories, and product updates from our banking and engineering teams.
            </p>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {POSTS.map(post => (
              <div
                key={post.slug}
                className="bg-white border p-7 flex flex-col justify-between"
                style={{ borderColor: '#CBD5E1', borderTop: '4px solid #002B5B' }}
              >
                <div>
                  <div className="flex items-center justify-between mb-4 pb-3 border-b" style={{ borderColor: '#E2E8F0' }}>
                    <span
                      className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase"
                      style={{ background: '#EBF2FF', color: '#0052CC' }}
                    >
                      {post.category}
                    </span>
                    <span className="text-[11px] font-mono" style={{ color: '#64748B' }}>{post.date}</span>
                  </div>
                  <h2 className="font-display text-xl font-bold mb-3" style={{ color: '#002B5B' }}>
                    {post.title}
                  </h2>
                  <p className="text-sm leading-relaxed mb-6" style={{ color: '#475569' }}>
                    {post.excerpt}
                  </p>
                </div>
                <div className="pt-4 border-t flex items-center justify-between" style={{ borderColor: '#E2E8F0' }}>
                  <span className="text-[10px] font-mono" style={{ color: '#64748B' }}>{post.code}</span>
                  <Link
                    href="/auth/register"
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: '#0052CC' }}
                  >
                    Read Briefing &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer
        className="border-t-4 py-10 px-4 sm:px-6"
        style={{ background: '#002B5B', borderColor: '#0052CC', color: '#FFFFFF' }}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <BrandLogo variant="light" size="sm" />
          <p className="text-xs" style={{ color: '#93C5FD' }}>
            © 2026 Blue ridge Bank. All rights reserved. · support@theblueridges.com
          </p>
        </div>
      </footer>
    </div>
  )
}
