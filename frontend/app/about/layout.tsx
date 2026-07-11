import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Us | NexaBanking',
  description: 'Learn about NexaBanking, our mission to revolutionize personal banking, and our commitment to security and transparency.',
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
