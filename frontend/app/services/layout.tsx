import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Services | NexaBanking',
  description: 'Explore the suite of services NexaBanking offers: from instant transfers and crypto integration to smart savings.',
}

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
