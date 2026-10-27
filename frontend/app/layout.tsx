import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/store/auth'
import { ToastContainer } from '@/components/ui/Toast'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://theblueridges.com'),
  title: 'Blue ridge Bank — Institutional Personal & Commercial Banking',
  description: 'Secure, fast, and institutional banking for personal, commercial, and private wealth clients.',
  keywords: ['Blue ridge Bank', 'banking', 'personal banking', 'commercial banking', 'online banking', 'secure transfers'],
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/logo.png', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    shortcut: ['/logo.png'],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    title: 'Blue ridge Bank',
    statusBarStyle: 'black-translucent',
  },
  openGraph: {
    title: 'Blue ridge Bank — Institutional Personal & Commercial Banking',
    description: 'Secure, fast, and institutional banking for personal, commercial, and private wealth clients.',
    url: 'https://theblueridges.com',
    siteName: 'Blue ridge Bank',
    type: 'website',
    images: [
      {
        url: '/logo.png',
        width: 800,
        height: 800,
        alt: 'Blue ridge Bank Official Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blue ridge Bank — Institutional Personal & Commercial Banking',
    description: 'Secure, fast, and institutional banking for personal, commercial, and private wealth clients.',
    creator: '@blueridgebank',
    images: ['/logo.png'],
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
