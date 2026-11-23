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

  useEffect(() => {
    if (typeof window === 'undefined') return
    const q = new URLSearchParams(window.location.search).get('search')
    if (q) setSearch(q)
  }, [])

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
      className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer capitalize"
      style={{
        background: cur === val ? '#0052CC' : '#FFFFFF',
        border: cur === val ? '1px solid #0052CC' : '1px solid #E2E8F0',
        color: cur === val ? '#FFFFFF' : '#475569',
      }}
    >
      {val === 'all' ? 'All' : val.replace('_', ' ')}
    </button>
  )

  return (
    <>
      <div className="max-w-4xl space-y-5 fade-up">
        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label: 'Total Credits (In)',
              value: fmtUSD(totalIn),
              color: '#059669',
              bg: '#ECFDF5',
              icon: TrendingUp,
            },
            {
              label: 'Total Debits (Out)',
              value: fmtUSD(totalOut),
              color: '#002B5B',
              bg: '#F1F5F9',
              icon: TrendingDown,
            },
            {
              label: 'Net Cash Flow',
              value: fmtUSD(netVal),
              color: netVal >= 0 ? '#0052CC' : '#DC2626',
              bg: '#EBF2FF',
              icon: TrendingUp,
            },
          ].map(({ label, value, color, bg, icon: Icon }) => (
            <Card key={label} className="p-4 sm:p-5 flex sm:flex-col items-center sm:items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: bg, color }}
                >
                  <Icon size={15} />
                </div>
                <p className="text-xs font-semibold text-slate-500">
                  {label}
                </p>
              </div>
              <p className="text-base sm:text-xl font-bold font-mono whitespace-nowrap sm:mt-1" style={{ color }}>
                {value}
              </p>
            </Card>
          ))}
        </div>

        <Card className="p-5 sm:p-6">
          <SectionHeader
            title={`Transaction Audit History (${pagination.total})`}
            action={
              <Button variant="secondary" size="xs" className="rounded-full" onClick={() => setShowExportPopup(true)}>
                <FileText size={13} /> Export
              </Button>
            }
          />

          {/* Search + filter toggle */}
          <div className="flex gap-2.5 mb-4">
            <div className="flex-1 relative min-w-0">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                placeholder="Search transactions..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:border-[#0052CC] focus:ring-4 focus:ring-blue-500/10 text-xs sm:text-sm outline-none font-sans transition-all text-[#0A192F]"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
              />
            </div>
            <Button variant="secondary" size="sm" className="rounded-xl" onClick={() => setShowFilters(!showFilters)}>
              <Filter size={14} /> <span className="hidden xs:inline">Filters</span>
            </Button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mb-5 p-4 rounded-2xl border border-slate-200/80 bg-[#F4F7FC] space-y-3">
              <div>
                <p className="text-xs font-semibold mb-1.5 text-[#002B5B]">Status</p>
                <div className="flex flex-wrap gap-1.5">{STATUS_FILTERS.map(v => <FilterBtn key={v} val={v} cur={status} set={setStatus} />)}</div>
              </div>
              <div>
                <p className="text-xs font-semibold mb-1.5 text-[#002B5B]">Type</p>
                <div className="flex flex-wrap gap-1.5">{TYPE_FILTERS.map(v => <FilterBtn key={v} val={v} cur={type} set={setType} />)}</div>
              </div>
              <div>
                <p className="text-xs font-semibold mb-1.5 text-[#002B5B]">Category</p>
                <div className="flex flex-wrap gap-1.5">{CAT_FILTERS.map(v => <FilterBtn key={v} val={v} cur={category} set={setCategory} />)}</div>
              </div>
            </div>
          )}

          {/* List */}
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="shimmer h-16" />)}</div>
          ) : txs.length === 0 ? (
            <Empty icon={<List size={24} />} message="No transactions found" sub="Try adjusting your search or filters" />
          ) : (
            <div className="divide-y divide-slate-100">
              {txs.map(tx => <TxRow key={tx._id} tx={tx} showRef />)}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-5 pt-4 border-t border-slate-100">
              <Button variant="secondary" size="xs" className="rounded-full" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                <ArrowLeft size={14} />
              </Button>
              <span className="text-xs sm:text-sm font-semibold text-slate-500">
                Page {page} of {pagination.pages}
              </span>
              <Button variant="secondary" size="xs" className="rounded-full" disabled={page === pagination.pages} onClick={() => setPage(p => p + 1)}>
                <ArrowRight size={14} />
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* Export popup */}
      {showExportPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#00142B]/55 backdrop-blur-sm">
          <div className="p-6 sm:p-7 max-w-sm w-full text-center fade-up rounded-3xl bg-white shadow-float border border-slate-200/80">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 bg-[#EBF2FF] text-[#0052CC]">
              <FileText size={24} />
            </div>
            <h3 className="font-display font-bold text-lg mb-2 text-[#002B5B]">
              Statement Dispatched
            </h3>
            <p className="text-xs sm:text-sm mb-1 text-slate-500">
              Your official account statement is being sent to:
            </p>
            <p className="font-bold text-xs sm:text-sm mb-4 break-all text-[#002B5B]">{user?.email}</p>
            <p className="text-xs mb-5 text-slate-400">
              Please allow 1–3 minutes for the email to arrive. Check your spam folder if you don&apos;t see it.
            </p>
            <button
              onClick={() => setShowExportPopup(false)}
              className="w-full py-3 rounded-full font-semibold text-xs text-white shadow-brand transition-all hover:opacity-95 cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #0052CC 0%, #003D99 100%)' }}
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}
    </>
  )
}
