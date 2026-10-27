import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Us | Blue ridge Bank',
  description: 'Learn about Blue ridge Bank, our mission to revolutionize personal banking, and our commitment to security and transparency.',
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
