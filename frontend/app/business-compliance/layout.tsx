import { AuthGuardShell } from '@/components/layout/AuthGuardShell'

export default function BusinessComplianceLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuardShell>{children}</AuthGuardShell>
}
