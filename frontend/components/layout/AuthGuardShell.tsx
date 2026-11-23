'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/store/auth'
import { AppShell } from '@/components/layout/AppShell'
import { BrandLogo } from '@/components/shared/BrandLogo'

export function AuthGuardShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.replace('/auth/login')
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#F4F7FC' }}>
        <div className="bg-white rounded-3xl p-8 shadow-float border border-slate-200/80 text-center max-w-xs w-full">
          <div className="flex justify-center mb-5">
            <BrandLogo variant="dark" size="md" />
          </div>
          <div className="w-9 h-9 border-[3px] border-[#EBF2FF] border-t-[#0052CC] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-medium text-slate-500">Securing your banking session…</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return <AppShell>{children}</AppShell>
}
