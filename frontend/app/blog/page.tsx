import { Metadata } from 'next'
import Link from 'next/link'
import { PublicNav } from '@/components/layout/PublicNav'

export const metadata: Metadata = {
  title: 'Blog | NexaBanking',
  description: 'Read the latest updates, financial tips, and company news from NexaBanking.',
}

const POSTS = [
  { slug: 'future-of-crypto-banking', title: 'The Future of Crypto Banking in 2026', date: 'Jul 10, 2026', excerpt: 'How cryptocurrencies are being seamlessly integrated into everyday banking.' },
  { slug: 'maximizing-smart-savings', title: '5 Ways to Maximize Your Smart Savings', date: 'Jul 05, 2026', excerpt: 'Tips and tricks to get the most out of our automated savings features.' },
  { slug: 'bank-grade-security-explained', title: 'NexaBanking Security Explained', date: 'Jun 28, 2026', excerpt: 'A deep dive into our 256-bit encryption and fraud monitoring systems.' },
]

export default function BlogPage() {
  return (
    <div className="min-h-screen" style={{ background: '#080E1C', color: '#fff' }}>
      <PublicNav />
      <div className="max-w-7xl mx-auto px-6 pt-32 pb-24">
        <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">NexaBanking <span style={{ color: '#10B981' }}>Blog</span></h1>
        <p className="text-white/60 mb-12 max-w-2xl text-lg">Stay updated with the latest in personal finance, product updates, and insights from our experts.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {POSTS.map((post) => (
            <div key={post.slug} className="rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1" style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)' }}>
              <p className="text-xs text-white/40 mb-3">{post.date}</p>
              <h2 className="text-xl font-semibold mb-3 text-white">{post.title}</h2>
              <p className="text-sm text-white/60 mb-6">{post.excerpt}</p>
              <Link href={`/blog/${post.slug}`} className="text-sm font-semibold flex items-center gap-2" style={{ color: '#10B981' }}>
                Read more &rarr;
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
