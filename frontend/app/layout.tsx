import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/store/auth'
import { ToastContainer } from '@/components/ui/Toast'

export const metadata: Metadata = {
  title: 'NexaBank — Modern Personal Banking',
  description: 'Secure, fast, and intelligent banking for the modern world.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AuthProvider>
          {children}
          <ToastContainer />
        </AuthProvider>
      </body>
    </html>
  )
}
