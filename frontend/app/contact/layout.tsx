import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us | NexaBanking',
  description: 'Get in touch with NexaBanking. We are here to help you 24/7 with any inquiries or issues.',
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
