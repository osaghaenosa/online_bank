import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Services | Blue ridge Bank',
  description: 'Explore the suite of services Blue ridge Bank offers: from instant transfers and crypto integration to smart savings.',
}

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
