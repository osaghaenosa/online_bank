import type { Metadata } from 'next'
import './globals.css'
import { StoreProvider } from '@/store'
import { ThemeInjector } from '@/components/layout/ThemeInjector'
import { ToastContainer } from '@/components/ui/Toast'
import { AppShell } from '@/components/layout/AppShell'

export const metadata: Metadata = {
  title: 'NexaBank — Personal Banking',
  description: 'Modern banking for the modern world',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <StoreProvider>
          <ThemeInjector />
          <AppShell>{children}</AppShell>
          <ToastContainer />
        </StoreProvider>
      </body>
    </html>
  )
}
