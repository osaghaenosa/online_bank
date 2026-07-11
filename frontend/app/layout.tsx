import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/store/auth'
import { ToastContainer } from '@/components/ui/Toast'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://nexabanking.com'),
  title: 'NexaBanking — Modern Personal Banking',
  description: 'Secure, fast, and intelligent banking for the modern world.',
  keywords: ['banking', 'personal banking', 'crypto banking', 'online banking', 'secure transfers'],
  openGraph: {
    title: 'NexaBanking — Modern Personal Banking',
    description: 'Secure, fast, and intelligent banking for the modern world.',
    url: 'https://nexabanking.com',
    siteName: 'NexaBanking',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NexaBanking — Modern Personal Banking',
    description: 'Secure, fast, and intelligent banking for the modern world.',
    creator: '@nexabanking',
  },
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
