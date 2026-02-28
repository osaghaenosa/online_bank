import { TxCat } from '@/store'

export const fmtUSD = (n: number) =>
  '$' + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')

export const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

export const fmtTime = (d: string) =>
  new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

export const maskCard = (card: string) => '•••• •••• •••• ' + card.replace(/ /g, '').slice(-4)

export const catIcon = (cat: TxCat): string => {
  const map: Record<TxCat, string> = {
    income: 'TrendingUp',
    transfer: 'Send',
    shopping: 'ShoppingBag',
    food: 'Coffee',
    bills: 'Building2',
    crypto: 'Bitcoin',
    entertainment: 'Zap',
    health: 'Heart',
    transport: 'Car',
  }
  return map[cat] ?? 'Circle'
}

export const catColor = (cat: TxCat): string => {
  const map: Record<TxCat, string> = {
    income: 'bg-emerald-100 text-emerald-700',
    transfer: 'bg-blue-100 text-blue-700',
    shopping: 'bg-orange-100 text-orange-700',
    food: 'bg-yellow-100 text-yellow-700',
    bills: 'bg-red-100 text-red-700',
    crypto: 'bg-purple-100 text-purple-700',
    entertainment: 'bg-violet-100 text-violet-700',
    health: 'bg-pink-100 text-pink-700',
    transport: 'bg-slate-100 text-slate-700',
  }
  return map[cat] ?? 'bg-gray-100 text-gray-700'
}

export const COIN_PRICES: Record<string, number> = {
  BTC: 67420,
  ETH: 3210,
  USDT: 1,
  BNB: 580,
  SOL: 172,
}

export const WALLET_ADDRS: Record<string, string> = {
  BTC: '1A1zP1eP5QGefi2DMPTfTL5SLmv7Divfna',
  ETH: '0x742d35Cc6634C0532925a3b8D4C9D5E123',
  USDT: 'TMuA6YqfCeX8EkvNsmwk9jMDHBHe2bGaAi',
  BNB: 'bnb1grpf0955h0ykzq3ar5nmum7y6gdfl6lxfn46h2',
  SOL: '4Nd1maDLH4SXCvCeXAE8zx4L7KxCFy1kHgr1',
}
