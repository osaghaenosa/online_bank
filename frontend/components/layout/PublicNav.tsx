'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '@/store/auth'

const LINKS = [
  { href: '/home',     label: 'Home' },
  { href: '/about',    label: 'About' },
  { href: '/services', label: 'Services' },
  { href: '/contact',  label: 'Contact' },
]

export function PublicNav() {
  const [open,    setOpen]    = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const { user } = useAuth()

  // Only render auth-dependent content after client mount
  // This prevents server/client HTML mismatch (hydration error)
  useEffect(() => { setMounted(true) }, [])

  return (
    <nav className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(8,14,28,.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,.06)',
      }}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/home" className="text-xl font-display font-bold text-white">
          <span style={{ color: '#10B981' }}>N</span>exaBank
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-7">
          {LINKS.map(l => (
            <Link key={l.href} href={l.href}
              className={clsx('nav-link text-sm font-medium', pathname === l.href && 'text-white')}>
              {l.label}
            </Link>
          ))}
        </div>

        {/* CTA — only rendered after mount to avoid hydration mismatch */}
        <div className="hidden md:flex items-center gap-3">
          {!mounted ? (
            // Server + first paint: always show guest buttons (matches server HTML)
            <>
              <Link href="/auth/login"
                className="text-sm font-medium text-white/70 hover:text-white transition-colors">
                Sign In
              </Link>
              <Link href="/auth/register"
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ background: '#10B981' }}>
                Open Account
              </Link>
            </>
          ) : user ? (
            <Link href="/dashboard"
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: '#10B981' }}>
              Dashboard →
            </Link>
          ) : (
            <>
              <Link href="/auth/login"
                className="text-sm font-medium text-white/70 hover:text-white transition-colors">
                Sign In
              </Link>
              <Link href="/auth/register"
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ background: '#10B981' }}>
                Open Account
              </Link>
            </>
          )}
        </div>

        {/* Hamburger */}
        <button className="md:hidden text-white" onClick={() => setOpen(!open)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t px-6 py-4 space-y-3"
          style={{ background: 'rgba(8,14,28,.97)', borderColor: 'rgba(255,255,255,.08)' }}>
          {LINKS.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
              className="block text-sm font-medium text-white/70 hover:text-white py-1.5 transition-colors">
              {l.label}
            </Link>
          ))}
          <div className="pt-3 border-t flex flex-col gap-2" style={{ borderColor: 'rgba(255,255,255,.1)' }}>
            {mounted && user ? (
              <Link href="/dashboard" onClick={() => setOpen(false)}
                className="text-center py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: '#10B981' }}>
                Dashboard →
              </Link>
            ) : (
              <>
                <Link href="/auth/login" onClick={() => setOpen(false)}
                  className="text-center py-2.5 rounded-xl border text-sm font-semibold text-white"
                  style={{ borderColor: 'rgba(255,255,255,.2)' }}>
                  Sign In
                </Link>
                <Link href="/auth/register" onClick={() => setOpen(false)}
                  className="text-center py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: '#10B981' }}>
                  Open Account
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}