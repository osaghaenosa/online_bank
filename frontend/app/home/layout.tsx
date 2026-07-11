import { Metadata } from 'next'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'Home | NexaBanking',
  description: 'Welcome to NexaBanking — secure, modern personal banking with instant transfers, crypto integration, and smart savings.',
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FinancialService',
  name: 'NexaBanking',
  url: 'https://nexabanking.com',
  logo: 'https://nexabanking.com/logo.png',
  description: 'Secure, modern personal banking with instant transfers, crypto integration, and smart savings.',
  areaServed: 'Worldwide',
  sameAs: [
    'https://twitter.com/nexabanking',
    'https://linkedin.com/company/nexabanking',
  ],
}

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script
        id="nexabanking-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        strategy="beforeInteractive"
      />
      {children}
    </>
  )
}
