'use client'
import { useState, useMemo } from 'react'
import { useStore } from '@/store'
import { Card, Button, Input, Empty, SectionHeader } from '@/components/ui'
import { TxRow } from '@/components/shared/TxRow'
import { Search, FileText, List, ArrowLeft, ArrowRight } from 'lucide-react'

const FILTERS = ['All', 'Deposits', 'Withdrawals', 'Transfers', 'Crypto'] as const
type Filter = typeof FILTERS[number]

const PER_PAGE = 10

export default function HistoryPage() {
  const { myTxs, toast } = useStore()
  const [filter, setFilter] = useState<Filter>('All')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    return myTxs.filter(tx => {
      const matchFilter =
        filter === 'All' ||
        (filter === 'Deposits' && tx.type === 'credit') ||
        (filter === 'Withdrawals' && tx.type === 'debit' && tx.cat !== 'crypto') ||
        (filter === 'Transfers' && tx.cat === 'transfer') ||
        (filter === 'Crypto' && tx.cat === 'crypto')

      const matchSearch =
        !search ||
        tx.desc.toLowerCase().includes(search.toLowerCase()) ||
        String(tx.amount).includes(search)

      return matchFilter && matchSearch
    })
  }, [myTxs, filter, search])

  const pages = Math.ceil(filtered.length / PER_PAGE)
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <div className="max-w-4xl">
      <Card className="p-6">
        <SectionHeader
          title="Transaction History"
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => toast('CSV export complete! File saved.', 'success')}
            >
              <FileText size={14} /> Export
            </Button>
          }
        />

        {/* Search + filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-muted)' }} />
            <input
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none font-sans"
              style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              placeholder="Search transactions..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => { setFilter(f); setPage(1) }}
                className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all font-sans cursor-pointer"
                style={{
                  background: filter === f ? 'var(--color-primary)' : 'var(--color-surface)',
                  borderColor: filter === f ? 'var(--color-primary)' : 'var(--color-border)',
                  color: filter === f ? '#fff' : 'var(--color-muted)',
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Transaction list */}
        {paged.length === 0 ? (
          <Empty icon={<List size={48} />} message="No transactions found" />
        ) : (
          paged.map(tx => <TxRow key={tx.id} tx={tx} showRef />)
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-5 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <Button
              variant="secondary"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              <ArrowLeft size={14} />
            </Button>
            <span className="text-sm" style={{ color: 'var(--color-muted)' }}>
              Page {page} of {pages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={page === pages}
              onClick={() => setPage(p => p + 1)}
            >
              <ArrowRight size={14} />
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
