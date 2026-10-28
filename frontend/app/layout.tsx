import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '@/store/auth'
import { ToastContainer } from '@/components/ui/Toast'
import { PwaRegistrar } from '@/components/shared/PwaRegistrar'

export const viewport: Viewport = {
  themeColor: '#002B5B',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://theblueridges.com'),
  title: 'Blue ridge Bank — Institutional Personal & Commercial Banking',
  description: 'Secure, fast, and institutional banking for personal, commercial, and private wealth clients.',
  keywords: ['Blue ridge Bank', 'banking', 'personal banking', 'commercial banking', 'online banking', 'secure transfers'],
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/logo.png', sizes: '512x512', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    shortcut: ['/icon-192.png'],
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
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Blue ridge Bank" />
        <meta name="application-name" content="Blue ridge Bank" />
        <meta name="msapplication-TileColor" content="#002B5B" />
        <meta name="theme-color" content="#002B5B" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        <AuthProvider>
          {children}
          <ToastContainer />
          <PwaRegistrar />
        </AuthProvider>
      </body>
    </html>
  )
}
