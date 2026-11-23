import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Developer API Documentation | Blue ridge Bank',
  description:
    'Integrate Blue ridge Bank REST API v1 in any programming language: account creation, balances, deposits, withdrawals, transfers, PDF receipts, cards, wealth, and webhooks/chat.',
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
