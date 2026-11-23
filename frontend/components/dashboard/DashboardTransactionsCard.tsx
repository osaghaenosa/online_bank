'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, ArrowRight, List } from 'lucide-react'
import { TxRow } from '@/components/shared/TxRow'
import { Empty } from '@/components/ui'
import clsx from 'clsx'

type FilterKey = 'all' | 'completed' | 'pending' | 'credit' | 'debit'

export function DashboardTransactionsCard({ transactions }: { transactions: any[] }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterKey>('all')

  const counts = useMemo(() => {
    let completed = 0
    let pending = 0
    let credit = 0
    let debit = 0
    for (const tx of transactions) {
      if (tx.status === 'completed') completed++
      if (tx.status === 'pending' || tx.status === 'processing') pending++
      if (tx.type === 'credit') credit++
      if (tx.type === 'debit') debit++
    }
    return {
      all: transactions.length,
      completed,
      pending,
      credit,
      debit,
    }
  }, [transactions])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return transactions
      .filter(tx => {
        if (filter === 'completed' && tx.status !== 'completed') return false
        if (filter === 'pending' && tx.status !== 'pending' && tx.status !== 'processing') return false
        if (filter === 'credit' && tx.type !== 'credit') return false
        if (filter === 'debit' && tx.type !== 'debit') return false
        if (!q) return true
        return (
          String(tx.description || '').toLowerCase().includes(q) ||
          String(tx.transactionId || '').toLowerCase().includes(q) ||
          String(tx.status || '').toLowerCase().includes(q) ||
          String(tx.category || '').toLowerCase().includes(q) ||
          String(tx.recipientName || '').toLowerCase().includes(q)
        )
      })
      .slice(0, 7)
  }, [transactions, search, filter])

  const pills: Array<{ key: FilterKey; label: string; count: number; dot?: string }> = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'completed', label: 'Completed', count: counts.completed, dot: '#10B981' },
    { key: 'pending', label: 'Pending', count: counts.pending, dot: '#F59E0B' },
    { key: 'credit', label: 'Credits', count: counts.credit, dot: '#0052CC' },
    { key: 'debit', label: 'Debits', count: counts.debit, dot: '#64748B' },
  ]

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-5 sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-display font-bold text-base sm:text-lg text-[#002B5B]">
            Recent Activities
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Live account movements &amp; cleared settlements
          </p>
        </div>
        <Link
          href="/history"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#F4F7FC] hover:bg-[#EBF2FF] text-xs font-semibold text-[#0052CC] transition-colors"
        >
          <span>View All</span>
          <ArrowRight size={13} />
        </Link>
      </div>

      {/* UXDA Search & Status Count Pills */}
      <div className="space-y-3 mb-4">
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by description, reference ID, or status…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#F8FAFC] focus:bg-white border border-slate-200/80 focus:border-[#0052CC] focus:ring-4 focus:ring-blue-500/10 text-xs sm:text-sm outline-none transition-all text-[#0A192F]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
          {pills.map(p => {
            const active = filter === p.key
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => setFilter(p.key)}
                className={clsx(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 cursor-pointer',
                  active
                    ? 'bg-[#002B5B] text-white shadow-sm'
                    : 'bg-[#F4F7FC] text-slate-600 hover:bg-[#EBF2FF] hover:text-[#002B5B]'
                )}
              >
                {p.dot && (
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: active ? '#60A5FA' : p.dot }}
                  />
                )}
                <span>{p.label}:</span>
                <span className={active ? 'text-blue-200' : 'text-[#0052CC]'}>{p.count}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Transaction Feed */}
      {filtered.length === 0 ? (
        <Empty
          icon={<List size={22} />}
          message="No matching ledger activities"
          sub={search || filter !== 'all' ? 'Try clearing your search or switching status filter' : 'Your recent transactions will appear here'}
        />
      ) : (
        <div className="divide-y divide-slate-100">
          {filtered.map((tx: any) => (
            <TxRow key={tx._id} tx={tx} />
          ))}
        </div>
      )}
    </div>
  )
}
