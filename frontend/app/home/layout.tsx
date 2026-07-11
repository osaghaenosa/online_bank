import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Home | NexaBanking',
  description: 'Welcome to NexaBanking. The future of personal banking is here.',
}

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FinancialService",
            "name": "NexaBanking",
            "url": "https://nexabanking.com",
            "logo": "https://nexabanking.com/logo.png",
            "sameAs": [
              "https://twitter.com/nexabanking",
              "https://linkedin.com/company/nexabanking"
            ]
          })
        }}
      />
      {children}
    </>
  )
}
