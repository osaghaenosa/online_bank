'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Menu, X, ShieldCheck, ArrowRight } from 'lucide-react'
import { useAuth } from '@/store/auth'
import { BrandLogo } from '@/components/shared/BrandLogo'
import { WhatsAppIcon } from '@/components/shared/WhatsAppIcon'
import clsx from 'clsx'

const LINKS = [
  { href: '/home',     label: 'Overview' },
  { href: '/services', label: 'Banking Services' },
  { href: '/docs',     label: 'API Docs' },
  { href: '/about',    label: 'Institution' },
  { href: '/blog',     label: 'Market Insights' },
  { href: '/contact',  label: 'Support' },
]

export function PublicNav() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const { user } = useAuth()

  useEffect(() => { setMounted(true) }, [])

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Top Trust Bar */}
      <div
        className="hidden sm:block border-b border-white/10 text-[11px]"
        style={{ background: '#001F42', color: '#BFDBFE' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-8 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5 font-medium text-white/90">
              <ShieldCheck size={12} className="text-[#60A5FA]" />
              FDIC Insured Institution · Routing #021000021
            </span>
            <span className="hidden lg:inline text-blue-200/70">256-Bit Encrypted Ledger</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://wa.me/12488346313"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold inline-flex items-center gap-1.5 transition-colors"
              title="Chat with Blue ridge Bank on WhatsApp"
            >
              <WhatsAppIcon size={14} />
              <span>+1 (248) 834-6313</span>
            </a>
            <a href="mailto:support@theblueridges.com" className="hover:text-white">
              support@theblueridges.com
            </a>
          </div>
        </div>
      </div>

      {/* Main Frosted Navigation Bar */}
      <nav
        className="border-b border-white/10 backdrop-blur-xl"
        style={{ background: 'rgba(0, 43, 91, 0.94)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/home" className="flex items-center">
            <BrandLogo variant="light" size="md" />
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {LINKS.map(l => {
              const active = pathname === l.href
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={clsx(
                    'px-3.5 py-2 rounded-full text-xs font-semibold transition-all',
                    active
                      ? 'bg-white/15 text-white'
                      : 'text-blue-100/85 hover:text-white hover:bg-white/10'
                  )}
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
                  className="px-4 py-2 rounded-full text-xs font-semibold text-white border border-white/25 hover:bg-white/10 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="px-5 py-2 rounded-full text-xs font-semibold text-white shadow-brand transition-transform hover:scale-[1.02]"
                  style={{ background: 'linear-gradient(135deg, #0052CC 0%, #003D99 100%)' }}
                >
                  Open Account
                </Link>
              </>
            ) : user ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-semibold text-white shadow-brand transition-transform hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, #0052CC 0%, #003D99 100%)' }}
              >
                <span>Banking Portal</span>
                <ArrowRight size={13} />
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="px-4 py-2 rounded-full text-xs font-semibold text-white border border-white/25 hover:bg-white/10 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="px-5 py-2 rounded-full text-xs font-semibold text-white shadow-brand transition-transform hover:scale-[1.02]"
                  style={{ background: 'linear-gradient(135deg, #0052CC 0%, #003D99 100%)' }}
                >
                  Open Account
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden w-10 h-10 rounded-full text-white bg-white/10 border border-white/15 flex items-center justify-center cursor-pointer"
            onClick={() => setOpen(!open)}
            aria-label="Toggle Menu"
          >
            {open ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div
            className="md:hidden border-t border-white/10 px-4 py-4 space-y-1.5 rounded-b-3xl shadow-2xl"
            style={{ background: '#001F42' }}
          >
            {LINKS.map(l => {
              const active = pathname === l.href
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={clsx(
                    'block px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors',
                    active ? 'bg-[#0052CC] text-white' : 'text-blue-100 hover:bg-white/10'
                  )}
                >
                  {l.label}
                </Link>
              )
            })}
            <div className="pt-3 mt-2 border-t border-white/10 grid grid-cols-2 gap-2.5">
              {mounted && user ? (
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="col-span-2 text-center py-2.5 rounded-full text-xs font-semibold text-white shadow-brand"
                  style={{ background: '#0052CC' }}
                >
                  Banking Portal →
                </Link>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    onClick={() => setOpen(false)}
                    className="text-center py-2.5 rounded-full border border-white/25 text-xs font-semibold text-white"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/register"
                    onClick={() => setOpen(false)}
                    className="text-center py-2.5 rounded-full text-xs font-semibold text-white shadow-brand"
                    style={{ background: '#0052CC' }}
                  >
                    Open Account
                  </Link>
                </>
              )}
            </div>
            <div className="pt-2.5 mt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-blue-100">
              <a
                href="https://wa.me/12488346313"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-white font-semibold"
              >
                <WhatsAppIcon size={14} />
                <span>+1 (248) 834-6313</span>
              </a>
              <a href="mailto:support@theblueridges.com" className="text-blue-200 hover:text-white truncate ml-2">
                support@theblueridges.com
              </a>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
