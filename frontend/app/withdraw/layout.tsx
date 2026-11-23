import { AuthGuardShell } from '@/components/layout/AuthGuardShell'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuardShell>{children}</AuthGuardShell>
}
