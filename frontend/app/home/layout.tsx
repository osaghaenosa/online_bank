import { Metadata } from 'next'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'Home | Blue ridge Bank',
  description: 'Welcome to Blue ridge Bank — secure, modern personal banking with instant transfers, crypto integration, and smart savings.',
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FinancialService',
  name: 'Blue ridge Bank',
  url: 'https://theblueridges.com',
  logo: 'https://theblueridges.com/logo.png',
  description: 'Secure, modern personal banking with instant transfers, crypto integration, and smart savings.',
  areaServed: 'Worldwide',
  sameAs: [
    'https://twitter.com/blueridgebank',
    'https://linkedin.com/company/blueridgebank',
  ],
}

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script
        id="blueridgebank-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        strategy="beforeInteractive"
      />
      {children}
    </>
  )
}
