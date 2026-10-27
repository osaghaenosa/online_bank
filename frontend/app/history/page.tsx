'use client'
import { useState, useEffect, useCallback } from 'react'
import { api, fmtUSD } from '@/lib/api'
import { Card, Button, SectionHeader, Empty } from '@/components/ui'
import { TxRow } from '@/components/shared/TxRow'
import { Search, FileText, List, ArrowLeft, ArrowRight, Filter, TrendingUp, TrendingDown } from 'lucide-react'
import { useAuth } from '@/store/auth'

const STATUS_FILTERS = ['all', 'completed', 'pending', 'failed']
const TYPE_FILTERS   = ['all', 'credit', 'debit']
const CAT_FILTERS    = ['all', 'deposit', 'withdrawal', 'transfer_in', 'transfer_out', 'bill', 'crypto', 'shopping']

export default function HistoryPage() {
  const { toast, user } = useAuth()
  const [txs, setTxs]                 = useState<any[]>([])
  const [pagination, setPag]          = useState({ page: 1, pages: 1, total: 0 })
  const [stats, setStats]             = useState<any>({})
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [status, setStatus]           = useState('all')
  const [type, setType]               = useState('all')
  const [category, setCategory]       = useState('all')
  const [page, setPage]               = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [showExportPopup, setShowExportPopup] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = { page: String(page), limit: '10' }
      if (search)             params.search   = search
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
  }, [page, search, status, type, category, toast])

  useEffect(() => { load() }, [load])

  const totalIn  = stats?.credit?.total || 0
  const totalOut = stats?.debit?.total  || 0
  const netVal   = totalIn - totalOut

  const FilterBtn = ({ val, cur, set }: any) => (
    <button
      onClick={() => { set(val); setPage(1) }}
      className="px-3 py-1.5 text-xs font-semibold border transition-all cursor-pointer capitalize"
      style={{
        background: cur === val ? '#002B5B' : 'var(--color-surface)',
        borderColor: cur === val ? '#002B5B' : 'var(--color-border)',
        color: cur === val ? '#FFFFFF' : 'var(--color-muted)',
      }}
    >
      {val === 'all' ? 'All' : val.replace('_', ' ')}
    </button>
  )

  return (
    <>
      <div className="max-w-4xl space-y-4 sm:space-y-5 fade-up">
        {/* Summary cards — responsive 1-col on mobile, 3-col on tablet/desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {[
            {
              label: 'Total Credits (In)',
              value: fmtUSD(totalIn),
              color: '#0052CC',
              icon: TrendingUp,
            },
            {
              label: 'Total Debits (Out)',
              value: fmtUSD(totalOut),
              color: '#002B5B',
              icon: TrendingDown,
            },
            {
              label: 'Net Cash Flow',
              value: fmtUSD(netVal),
              color: netVal >= 0 ? '#0052CC' : '#DC2626',
              icon: TrendingUp,
            },
          ].map(({ label, value, color, icon: Icon }) => (
            <Card key={label} className="p-3.5 sm:p-4 flex sm:flex-col items-center sm:items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 flex items-center justify-center border flex-shrink-0"
                  style={{ background: '#EBF2FF', borderColor: '#93C5FD', color: '#0052CC' }}
                >
                  <Icon size={14} />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                  {label}
                </p>
              </div>
              <p className="text-base sm:text-xl font-bold font-mono whitespace-nowrap sm:mt-1" style={{ color }}>
                {value}
              </p>
            </Card>
          ))}
        </div>

        <Card className="p-4 sm:p-6">
          <SectionHeader
            title={`Transaction Audit History (${pagination.total})`}
            action={
              <Button variant="secondary" size="xs" onClick={() => setShowExportPopup(true)}>
                <FileText size={13} /> Export
              </Button>
            }
          />

          {/* Search + filter toggle */}
          <div className="flex gap-2 sm:gap-3 mb-4">
            <div className="flex-1 relative min-w-0">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-muted)' }} />
              <input
                placeholder="Search transactions..."
                className="w-full pl-9 pr-3 py-2 border text-xs sm:text-sm outline-none font-sans"
                style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
              />
            </div>
            <Button variant="secondary" size="sm" onClick={() => setShowFilters(!showFilters)}>
              <Filter size={13} /> <span className="hidden xs:inline">Filters</span>
            </Button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mb-4 p-3.5 sm:p-4 border space-y-3" style={{ background: '#F8FAFC', borderColor: '#CBD5E1' }}>
              <div>
                <p className="text-[11px] font-bold mb-1.5 uppercase tracking-wider" style={{ color: '#002B5B' }}>Status</p>
                <div className="flex flex-wrap gap-1.5">{STATUS_FILTERS.map(v => <FilterBtn key={v} val={v} cur={status} set={setStatus} />)}</div>
              </div>
              <div>
                <p className="text-[11px] font-bold mb-1.5 uppercase tracking-wider" style={{ color: '#002B5B' }}>Type</p>
                <div className="flex flex-wrap gap-1.5">{TYPE_FILTERS.map(v => <FilterBtn key={v} val={v} cur={type} set={setType} />)}</div>
              </div>
              <div>
                <p className="text-[11px] font-bold mb-1.5 uppercase tracking-wider" style={{ color: '#002B5B' }}>Category</p>
                <div className="flex flex-wrap gap-1.5">{CAT_FILTERS.map(v => <FilterBtn key={v} val={v} cur={category} set={setCategory} />)}</div>
              </div>
            </div>
          )}

          {/* List */}
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="shimmer h-16" />)}</div>
          ) : txs.length === 0 ? (
            <Empty icon={<List size={44} />} message="No transactions found" sub="Try adjusting your search or filters" />
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {txs.map(tx => <TxRow key={tx._id} tx={tx} showRef />)}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-5 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <Button variant="secondary" size="xs" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                <ArrowLeft size={14} />
              </Button>
              <span className="text-xs sm:text-sm font-semibold" style={{ color: 'var(--color-muted)' }}>
                Page {page} of {pagination.pages}
              </span>
              <Button variant="secondary" size="xs" disabled={page === pagination.pages} onClick={() => setPage(p => p + 1)}>
                <ArrowRight size={14} />
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* Export popup */}
      {showExportPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60">
          <div
            className="p-6 max-w-sm w-full text-center fade-up border-2"
            style={{ background: 'var(--color-surface)', borderColor: '#002B5B' }}
          >
            <div
              className="w-14 h-14 flex items-center justify-center mx-auto mb-4 border"
              style={{ background: '#EBF2FF', borderColor: '#0052CC' }}
            >
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                <path d="M4 24l6-6 5 5 9-10" stroke="#0052CC" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter"/>
              </svg>
            </div>
            <h3 className="font-bold text-base uppercase tracking-wider mb-2" style={{ color: '#002B5B' }}>
              Statement Dispatched
            </h3>
            <p className="text-xs sm:text-sm mb-1" style={{ color: 'var(--color-muted)' }}>
              Your official account statement is being sent to:
            </p>
            <p className="font-bold text-xs sm:text-sm mb-4 break-all" style={{ color: '#002B5B' }}>{user?.email}</p>
            <p className="text-xs mb-5" style={{ color: 'var(--color-muted)' }}>
              Please allow 1–3 minutes for the email to arrive. Check your spam folder if you don&apos;t see it.
            </p>
            <button
              onClick={() => setShowExportPopup(false)}
              className="w-full py-2.5 font-bold text-xs uppercase tracking-wider text-white transition-all hover:opacity-95"
              style={{ background: '#0052CC' }}
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}
    </>
  )
}
