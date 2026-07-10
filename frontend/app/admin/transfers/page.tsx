'use client'
import { useEffect, useState, useCallback } from 'react'
import { api, fmtUSD, fmtDateTime } from '@/lib/api'
import { Card, SectionHeader, StatusBadge, Button } from '@/components/ui'
import {
  ArrowLeft, ArrowRight, Search, Globe, Building, CreditCard,
  Bitcoin, ArrowUpRight, RefreshCw, ChevronDown, ChevronUp, X
} from 'lucide-react'
import { useAuth } from '@/store/auth'

const CATEGORY_FILTERS = ['all', 'withdrawal', 'transfer_out', 'transfer_in']
const METHOD_LABELS: Record<string, string> = {
  ach: 'ACH Transfer', wire: 'Wire Transfer', iban: 'IBAN / Intl Wire',
  card: 'Debit Card', crypto_btc: 'Bitcoin', crypto_eth: 'Ethereum',
  crypto_usdt: 'USDT', crypto_bnb: 'BNB', crypto_sol: 'Solana',
  paypal: 'PayPal', cashapp: 'Cash App', venmo: 'Venmo', zelle: 'Zelle',
  internal: 'Internal', bank_transfer: 'Bank Transfer',
}

function MethodIcon({ method }: { method: string }) {
  if (method?.startsWith('crypto')) return <Bitcoin size={13} className="text-amber-500" />
  if (method === 'iban' || method === 'wire') return <Globe size={13} className="text-blue-500" />
  if (method === 'card') return <CreditCard size={13} className="text-purple-500" />
  return <Building size={13} className="text-emerald-500" />
}

function DestinationDetail({ tx }: { tx: any }) {
  const meta = tx.metadata || {}
  const bank = meta.bankDetails || {}
  const crypto = meta.cryptoDetails || {}

  if (tx.method === 'iban' && bank.iban) {
    return (
      <div className="space-y-1">
        <p className="text-xs font-semibold" style={{ color: 'var(--color-accent)' }}>🌍 IBAN / International Wire</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5">
          {bank.beneficiaryName && <Row label="Beneficiary" value={bank.beneficiaryName} />}
          {bank.iban           && <Row label="IBAN"        value={bank.iban} mono />}
          {bank.swiftBic       && <Row label="SWIFT/BIC"   value={bank.swiftBic} mono />}
          {bank.bankName       && <Row label="Bank"        value={bank.bankName} />}
          {bank.country        && <Row label="Country"     value={bank.country} />}
          {bank.bankAddress    && <Row label="Address"     value={bank.bankAddress} />}
        </div>
      </div>
    )
  }

  if (tx.method === 'wire' && (bank.bankName || bank.routingNumber || bank.accountNumber)) {
    return (
      <div className="space-y-1">
        <p className="text-xs font-semibold" style={{ color: 'var(--color-accent)' }}>🏦 Wire Transfer</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5">
          {bank.beneficiaryName && <Row label="Beneficiary" value={bank.beneficiaryName} />}
          {bank.bankName       && <Row label="Bank"           value={bank.bankName} />}
          {bank.routingNumber  && <Row label="Routing No."    value={bank.routingNumber} mono />}
          {bank.accountNumber  && <Row label="Account No."    value={bank.accountNumber} mono />}
        </div>
      </div>
    )
  }

  if (tx.method === 'ach' && (bank.bankName || bank.accountNumber)) {
    return (
      <div className="space-y-1">
        <p className="text-xs font-semibold" style={{ color: 'var(--color-accent)' }}>🏛️ ACH Transfer</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5">
          {bank.beneficiaryName && <Row label="Beneficiary" value={bank.beneficiaryName} />}
          {bank.bankName       && <Row label="Bank"           value={bank.bankName} />}
          {bank.routingNumber  && <Row label="Routing No."    value={bank.routingNumber} mono />}
          {bank.accountNumber  && <Row label="Account No."    value={bank.accountNumber} mono />}
        </div>
      </div>
    )
  }

  if (tx.method?.startsWith('crypto') && (crypto.walletAddress || tx.walletAddress)) {
    return (
      <div className="space-y-1">
        <p className="text-xs font-semibold" style={{ color: 'var(--color-accent)' }}>₿ Crypto Withdrawal</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5">
          {(crypto.coin || tx.cryptoCoin)       && <Row label="Coin"    value={crypto.coin || tx.cryptoCoin} />}
          {(crypto.network || tx.cryptoNetwork) && <Row label="Network" value={crypto.network || tx.cryptoNetwork} />}
          {(crypto.coinAmount || tx.cryptoAmount) && <Row label="Coin Amount" value={`${crypto.coinAmount || tx.cryptoAmount}`} mono />}
          {(crypto.walletAddress || tx.walletAddress) && (
            <div className="col-span-full">
              <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>Wallet Address</span>
              <p className="text-xs font-mono break-all mt-0.5">{crypto.walletAddress || tx.walletAddress}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (tx.category === 'transfer_out' || tx.category === 'transfer_in') {
    return (
      <div className="space-y-1">
        <p className="text-xs font-semibold" style={{ color: 'var(--color-accent)' }}>↔️ Internal Transfer</p>
        {meta.recipientId   && <Row label="Recipient ID"    value={meta.recipientId} mono />}
        {meta.recipientName && <Row label="Recipient Name"  value={meta.recipientName} />}
        {meta.senderName    && <Row label="From"            value={meta.senderName} />}
        {meta.note          && <Row label="Note"            value={meta.note} />}
      </div>
    )
  }

  return <p className="text-xs" style={{ color: 'var(--color-muted)' }}>No destination details recorded</p>
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>{label}</span>
      <p className={`text-xs mt-0.5 break-words ${mono ? 'font-mono' : 'font-medium'}`}>{value}</p>
    </div>
  )
}

export default function AdminTransfersPage() {
  const { toast } = useAuth()

  const [txs,        setTxs]       = useState<any[]>([])
  const [loading,    setLoading]   = useState(true)
  const [catFilter,  setCatFilter] = useState('all')
  const [search,     setSearch]    = useState('')
  const [page,       setPage]      = useState(1)
  const [pagination, setPag]       = useState({ pages: 1, total: 0 })
  const [expanded,   setExpanded]  = useState<Set<string>>(new Set())
  const [detail,     setDetail]    = useState<any>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = { page: String(page), limit: '30' }
      // Fetch only outgoing money movement categories
      if (catFilter !== 'all') params.category = catFilter
      else params.categories = 'withdrawal,transfer_out,transfer_in'
      if (search) params.search = search
      const d = await api.admin.transactions(params)
      setTxs(d.transactions || [])
      setPag(d.pagination || { pages: 1, total: 0 })
    } catch (err: any) {
      toast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }, [page, catFilter, search])

  useEffect(() => { load() }, [load])

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const filtered = txs.filter(tx => {
    if (catFilter === 'all') {
      return ['withdrawal', 'transfer_out', 'transfer_in'].includes(tx.category)
    }
    return tx.category === catFilter
  })

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header */}
      <Card className="p-4 sm:p-5">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <SectionHeader
            title="Transfers & Withdrawals"
            sub="Full audit trail — every outgoing payment, wire, IBAN transfer, crypto, and internal transfer"
          />
          <button onClick={load}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)', background: 'var(--color-bg)' }}>
            <RefreshCw size={12} /> Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Category tabs */}
          <div className="flex gap-1.5 flex-wrap">
            {CATEGORY_FILTERS.map(f => (
              <button key={f} onClick={() => { setCatFilter(f); setPage(1) }}
                className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all font-sans capitalize"
                style={{
                  background:   catFilter === f ? '#0F1C35' : 'var(--color-surface)',
                  borderColor:  catFilter === f ? '#0F1C35' : 'var(--color-border)',
                  color:        catFilter === f ? '#fff'    : 'var(--color-muted)',
                }}>
                {f === 'all' ? 'All Outgoing' : f.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-muted)' }} />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search by user, description, IBAN…"
              className="w-full pl-8 pr-4 py-2 rounded-xl border text-xs font-sans outline-none"
              style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
            />
          </div>
        </div>
      </Card>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Shown',     value: filtered.length,                                                              color: '#6366F1' },
          { label: 'Withdrawals',     value: filtered.filter(t => t.category === 'withdrawal').length,                     color: '#EF4444' },
          { label: 'Transfers Out',   value: filtered.filter(t => t.category === 'transfer_out').length,                   color: '#F59E0B' },
          { label: 'Total Volume',    value: fmtUSD(filtered.reduce((s, t) => s + (t.amount || 0), 0)),                    color: '#10B981' },
        ].map(s => (
          <Card key={s.label} className="p-3 sm:p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-muted)' }}>{s.label}</p>
            <p className="text-lg sm:text-xl font-bold font-mono" style={{ color: s.color }}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Transaction cards */}
      <Card className="p-4 sm:p-5">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="shimmer h-16 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center" style={{ color: 'var(--color-muted)' }}>
            <ArrowUpRight size={32} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">No transactions found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(tx => {
              const user = tx.userId
              const isExpanded = expanded.has(tx._id)
              const meta = tx.metadata || {}
              const bank = meta.bankDetails || {}
              const isIBAN = tx.method === 'iban' && bank.iban

              return (
                <div key={tx._id}
                  className="rounded-xl border overflow-hidden transition-all"
                  style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>

                  {/* Row header — always visible */}
                  <div className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
                    onClick={() => toggle(tx._id)}>

                    {/* Method icon */}
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'var(--color-bg)' }}>
                      <MethodIcon method={tx.method} />
                    </div>

                    {/* Description + user */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{tx.description}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {user && (
                          <span className="text-[10px]" style={{ color: 'var(--color-muted)' }}>
                            👤 {user.firstName} {user.lastName}
                          </span>
                        )}
                        {isIBAN && bank.beneficiaryName && (
                          <span className="text-[10px] text-blue-500 font-medium">
                            → {bank.beneficiaryName} ({bank.country})
                          </span>
                        )}
                        {tx.method?.startsWith('crypto') && (meta.cryptoDetails?.coin || tx.cryptoCoin) && (
                          <span className="text-[10px] text-amber-500 font-medium">
                            → {meta.cryptoDetails?.coin || tx.cryptoCoin}
                          </span>
                        )}
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                          style={{ background: 'var(--color-bg)', color: 'var(--color-muted)' }}>
                          {METHOD_LABELS[tx.method] || tx.method}
                        </span>
                      </div>
                    </div>

                    {/* Amount + date + status */}
                    <div className="text-right flex-shrink-0 hidden sm:block">
                      <p className={`text-sm font-bold font-mono ${tx.type === 'credit' ? 'text-emerald-500' : 'text-red-500'}`}>
                        {tx.type === 'credit' ? '+' : '-'}{fmtUSD(tx.amount)}
                      </p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-muted)' }}>
                        {fmtDateTime(tx.createdAt)}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <StatusBadge status={tx.status} />
                    </div>
                    <div className="flex-shrink-0" style={{ color: 'var(--color-muted)' }}>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                  </div>

                  {/* Mobile amount row */}
                  <div className="px-4 pb-2 flex items-center justify-between sm:hidden">
                    <p className={`text-sm font-bold font-mono ${tx.type === 'credit' ? 'text-emerald-500' : 'text-red-500'}`}>
                      {tx.type === 'credit' ? '+' : '-'}{fmtUSD(tx.amount)}
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--color-muted)' }}>{fmtDateTime(tx.createdAt)}</p>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t" style={{ borderColor: 'var(--color-border)' }}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Destination details */}
                        <div className="rounded-xl p-3.5" style={{ background: 'var(--color-bg)' }}>
                          <p className="text-[10px] font-bold uppercase tracking-wider mb-2.5" style={{ color: 'var(--color-muted)' }}>
                            Destination Details
                          </p>
                          <DestinationDetail tx={tx} />
                        </div>

                        {/* Transaction meta */}
                        <div className="rounded-xl p-3.5" style={{ background: 'var(--color-bg)' }}>
                          <p className="text-[10px] font-bold uppercase tracking-wider mb-2.5" style={{ color: 'var(--color-muted)' }}>
                            Transaction Info
                          </p>
                          <div className="space-y-1.5">
                            <Row label="Reference ID"  value={tx.transactionId || tx._id} mono />
                            <Row label="Amount"        value={fmtUSD(tx.amount)} />
                            {tx.fee > 0 && <Row label="Fee" value={fmtUSD(tx.fee)} />}
                            <Row label="Method"        value={METHOD_LABELS[tx.method] || tx.method || '—'} />
                            <Row label="Category"      value={tx.category?.replace(/_/g, ' ') || '—'} />
                            <Row label="Status"        value={tx.status} />
                            <Row label="Date"          value={fmtDateTime(tx.createdAt)} />
                            {tx.completedAt && <Row label="Completed" value={fmtDateTime(tx.completedAt)} />}
                            {user && (
                              <>
                                <Row label="Account Holder" value={`${user.firstName} ${user.lastName}`} />
                                <Row label="Email"          value={user.email} />
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              <ArrowLeft size={13} />
            </Button>
            <span className="text-xs sm:text-sm" style={{ color: 'var(--color-muted)' }}>
              Page {page} of {pagination.pages} ({pagination.total} total)
            </span>
            <Button variant="secondary" size="sm" disabled={page === pagination.pages} onClick={() => setPage(p => p + 1)}>
              <ArrowRight size={13} />
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
