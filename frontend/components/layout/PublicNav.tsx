'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Menu, X, PhoneCall, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/store/auth'
import { BrandLogo } from '@/components/shared/BrandLogo'

const LINKS = [
  { href: '/home',     label: 'Overview' },
  { href: '/services', label: 'Banking Services' },
  { href: '/about',    label: 'Institution' },
  { href: '/blog',     label: 'Market Insights' },
  { href: '/contact',  label: 'Client Support' },
]

export function PublicNav() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const { user } = useAuth()

  useEffect(() => { setMounted(true) }, [])

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Top Institutional Utility Bar */}
      <div
        className="hidden sm:block border-b text-[11px] font-mono"
        style={{ background: '#001F42', borderColor: '#1E3A5F', color: '#BFDBFE' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-8 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5 font-semibold text-white">
              <ShieldCheck size={12} style={{ color: '#60A5FA' }} />
              FDIC INSURED INSTITUTION · ROUTING #021000021
            </span>
            <span className="hidden lg:inline">256-BIT ENCRYPTED LEDGER</span>
          </div>
          <div className="flex items-center gap-5">
            <a href="mailto:support@theblueridges.com" className="hover:text-white flex items-center gap-1">
              <PhoneCall size={11} /> support@theblueridges.com
            </a>
            <Link href="/contact" className="hover:text-white underline">
              Branch &amp; Wire Desk
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <nav
        className="border-b-2"
        style={{
          background: '#002B5B',
          borderColor: '#0052CC',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/home" className="flex items-center">
            <BrandLogo variant="light" size="md" />
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center h-full">
            {LINKS.map(l => {
              const active = pathname === l.href
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className="h-full flex items-center px-4 text-xs font-bold uppercase tracking-wider transition-colors border-b-4"
                  style={{
                    color: active ? '#FFFFFF' : '#BFDBFE',
                    borderColor: active ? '#60A5FA' : 'transparent',
                    background: active ? '#001F42' : 'transparent',
                  }}
                >
                  {l.label}
                </Link>
              )
            })}
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-2.5">
            {!mounted ? (
              <>
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white border transition-colors"
                  style={{ borderColor: '#60A5FA', background: 'transparent' }}
                >
                  Client Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white border transition-colors"
                  style={{ background: '#0052CC', borderColor: '#0052CC' }}
                >
                  Open Account
                </Link>
              </>
            ) : user ? (
              <Link
                href="/dashboard"
                className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white"
                style={{ background: '#0052CC' }}
              >
                Banking Portal →
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white border transition-colors hover:bg-white/10"
                  style={{ borderColor: '#60A5FA' }}
                >
                  Client Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white border transition-colors"
                  style={{ background: '#0052CC', borderColor: '#0052CC' }}
                >
                  Open Account
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden p-2 text-white border"
            style={{ borderColor: '#1E3A5F', background: '#001F42' }}
            onClick={() => setOpen(!open)}
            aria-label="Toggle Menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div
            className="md:hidden border-t px-4 py-4 space-y-1"
            style={{ background: '#001F42', borderColor: '#1E3A5F' }}
          >
            {LINKS.map(l => {
              const active = pathname === l.href
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2.5 text-xs font-bold uppercase tracking-wider border-l-4"
                  style={{
                    color: active ? '#FFFFFF' : '#BFDBFE',
                    borderColor: active ? '#0052CC' : 'transparent',
                    background: active ? '#002B5B' : 'transparent',
                  }}
                >
                  {l.label}
                </Link>
              )
            })}
            <div className="pt-3 mt-2 border-t grid grid-cols-2 gap-2" style={{ borderColor: '#1E3A5F' }}>
              {mounted && user ? (
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="col-span-2 text-center py-2.5 text-xs font-bold uppercase tracking-wider text-white"
                  style={{ background: '#0052CC' }}
                >
                  Banking Portal →
                </Link>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    onClick={() => setOpen(false)}
                    className="text-center py-2.5 border text-xs font-bold uppercase tracking-wider text-white"
                    style={{ borderColor: '#60A5FA' }}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/register"
                    onClick={() => setOpen(false)}
                    className="text-center py-2.5 text-xs font-bold uppercase tracking-wider text-white"
                    style={{ background: '#0052CC' }}
                  >
                    Open Account
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}