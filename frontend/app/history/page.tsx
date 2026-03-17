'use client'
import { useState, useEffect, useCallback } from 'react'
import { api, fmtUSD } from '@/lib/api'
import { Card, Button, SectionHeader, Empty, StatusBadge } from '@/components/ui'
import { TxRow } from '@/components/shared/TxRow'
import { Search, FileText, List, ArrowLeft, ArrowRight, Filter } from 'lucide-react'
import { useAuth } from '@/store/auth'

const STATUS_FILTERS = ['all','completed','pending','failed']
const TYPE_FILTERS   = ['all','credit','debit']
const CAT_FILTERS    = ['all','deposit','withdrawal','transfer_in','transfer_out','bill','crypto','shopping']

export default function HistoryPage() {
  const { toast } = useAuth()
  const [txs, setTxs]         = useState<any[]>([])
  const [pagination, setPag]   = useState({ page: 1, pages: 1, total: 0 })
  const [stats, setStats]      = useState<any>({})
  const [loading, setLoading]  = useState(true)
  const [search, setSearch]    = useState('')
  const [status, setStatus]    = useState('all')
  const [type, setType]        = useState('all')
  const [category, setCategory]= useState('all')
  const [page, setPage]        = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = { page: String(page), limit: '10' }
      if (search)   params.search   = search
      if (status !== 'all')   params.status   = status
      if (type !== 'all')     params.type     = type
      if (category !== 'all') params.category = category
      const data = await api.tx.list(params)
      setTxs(data.transactions)
      setPag(data.pagination)
      setStats(data.stats)
    } catch (err: any) {
      toast(err.message || 'Failed to load transactions', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, search, status, type, category])

  useEffect(() => { load() }, [load])

  const totalIn  = stats?.credit?.total || 0
  const totalOut = stats?.debit?.total  || 0

  const FilterBtn = ({ val, cur, set, label }: any) => (
    <button onClick={() => { set(val); setPage(1) }}
      className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all font-sans cursor-pointer capitalize"
      style={{
        background: cur === val ? '#0F1C35' : 'var(--color-surface)',
        borderColor: cur === val ? '#0F1C35' : 'var(--color-border)',
        color: cur === val ? '#fff' : 'var(--color-muted)',
      }}>
      {val === 'all' ? 'All' : val.replace('_', ' ')}
    </button>
  )

  return (
    <div className="max-w-4xl space-y-5 fade-up">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total In',  value: fmtUSD(totalIn),  color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Total Out', value: fmtUSD(totalOut), color: 'text-red-500',     bg: 'bg-red-50' },
          { label: 'Net',       value: fmtUSD(totalIn - totalOut), color: totalIn >= totalOut ? 'text-emerald-600' : 'text-red-500', bg: 'bg-slate-50' },
        ].map(({ label, value, color, bg }) => (
          <Card key={label} className="p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-muted)' }}>{label}</p>
            <p className={`text-xl font-bold font-mono ${color}`}>{value}</p>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <SectionHeader title={`Transaction History (${pagination.total})`} action={
          <Button variant="secondary" size="sm" onClick={() => toast('CSV export ready!', 'success')}>
            <FileText size={14} /> Export
          </Button>
        } />

        {/* Search + filter toggle */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-muted)' }} />
            <input placeholder="Search transactions..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none font-sans"
              style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
          </div>
          <Button variant="secondary" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter size={14} /> Filters
          </Button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mb-4 p-4 rounded-xl space-y-3" style={{ background: 'var(--color-bg)' }}>
            <div>
              <p className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Status</p>
              <div className="flex flex-wrap gap-2">{STATUS_FILTERS.map(v => <FilterBtn key={v} val={v} cur={status} set={setStatus} />)}</div>
            </div>
            <div>
              <p className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Type</p>
              <div className="flex flex-wrap gap-2">{TYPE_FILTERS.map(v => <FilterBtn key={v} val={v} cur={type} set={setType} />)}</div>
            </div>
            <div>
              <p className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Category</p>
              <div className="flex flex-wrap gap-2">{CAT_FILTERS.map(v => <FilterBtn key={v} val={v} cur={category} set={setCategory} />)}</div>
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="shimmer h-16 rounded-xl" />)}</div>
        ) : txs.length === 0 ? (
          <Empty icon={<List size={48} />} message="No transactions found" sub="Try adjusting your search or filters" />
        ) : (
          txs.map(tx => <TxRow key={tx._id} tx={tx} showRef />)
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-5 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              <ArrowLeft size={14} />
            </Button>
            <span className="text-sm" style={{ color: 'var(--color-muted)' }}>Page {page} of {pagination.pages}</span>
            <Button variant="secondary" size="sm" disabled={page === pagination.pages} onClick={() => setPage(p => p + 1)}>
              <ArrowRight size={14} />
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
