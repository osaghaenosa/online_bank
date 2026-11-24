'use client'
import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { PublicNav } from '@/components/layout/PublicNav'
import { BrandLogo } from '@/components/shared/BrandLogo'
import {
  API_CATEGORIES,
  ENDPOINTS,
  ERROR_CODES,
  LANGUAGES,
  PERMISSION_DOCS,
  EndpointDoc,
  HttpMethod,
  LanguageId,
  generateCodeSnippet,
} from '@/lib/apiDocsData'
import {
  Copy, Check, Search, Key, Eye, EyeOff,
  ChevronDown, ChevronRight, ExternalLink, Terminal,
  ShieldCheck, Lock, Zap, Download, ArrowRight
} from 'lucide-react'

function getDefaultBaseV1() {
  const envBase = process.env.NEXT_PUBLIC_BASE_URL?.trim()
  if (envBase) return envBase.replace(/\/$/, '') + '/api/v1'
  if (typeof window !== 'undefined') return `${window.location.origin}/api/v1`
  return 'https://theblueridges.com/api/v1'
}

const METHOD_STYLES: Record<HttpMethod, { bg: string; text: string; border: string }> = {
  GET: { bg: '#EBF2FF', text: '#0052CC', border: '#BFDBFE' },
  POST: { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' },
  PATCH: { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
  DELETE: { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' },
}

function TryItLive({
  endpoint,
  baseUrl,
  apiKey,
}: {
  endpoint: EndpointDoc
  baseUrl: string
  apiKey: string
}) {
  const [open, setOpen] = useState(false)
  const [pathVals, setPathVals] = useState<Record<string, string>>(() =>
    Object.fromEntries((endpoint.pathParams || []).map((p) => [p.name, p.example || 'me']))
  )
  const [queryVals, setQueryVals] = useState<Record<string, string>>(() => ({
    ...(endpoint.defaultQuery || {}),
  }))
  const [bodyText, setBodyText] = useState<string>(() =>
    endpoint.sampleBody ? JSON.stringify(endpoint.sampleBody, null, 2) : ''
  )
  const [idempotencyKey, setIdempotencyKey] = useState('')
  const [pinHeader, setPinHeader] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{
    status: number
    latencyMs: number
    headers: Record<string, string>
    body: string
    pdfUrl?: string
  } | null>(null)
  const [errMsg, setErrMsg] = useState('')

  const execute = async () => {
    setSending(true)
    setErrMsg('')
    setResult((prev) => {
      if (prev?.pdfUrl) URL.revokeObjectURL(prev.pdfUrl)
      return null
    })

    let resolvedPath = endpoint.path
    for (const p of endpoint.pathParams || []) {
      const val = (pathVals[p.name] || p.example || 'me').trim()
      resolvedPath = resolvedPath.replace(`:${p.name}`, encodeURIComponent(val))
    }

    const qsEntries = Object.entries(queryVals).filter(([, v]) => String(v).trim() !== '')
    const qs = qsEntries.length ? '?' + new URLSearchParams(qsEntries).toString() : ''
    const url = `${baseUrl.replace(/\/$/, '')}${resolvedPath}${qs}`

    const headers: Record<string, string> = {}
    if (endpoint.authRequired && apiKey.trim()) {
      headers['X-API-Key'] = apiKey.trim()
    }
    if (idempotencyKey.trim()) {
      headers['Idempotency-Key'] = idempotencyKey.trim()
    }
    if (pinHeader.trim()) {
      headers['X-Account-Pin'] = pinHeader.trim()
    }

    let bodyToSend: string | undefined
    if (['POST', 'PATCH'].includes(endpoint.method)) {
      if (bodyText.trim()) {
        try {
          JSON.parse(bodyText)
        } catch {
          setErrMsg('Request JSON body is invalid syntax.')
          setSending(false)
          return
        }
        headers['Content-Type'] = 'application/json'
        bodyToSend = bodyText
      }
    }

    const t0 = performance.now()
    try {
      const res = await fetch(url, {
        method: endpoint.method,
        headers,
        ...(bodyToSend !== undefined ? { body: bodyToSend } : {}),
      })
      const latencyMs = Math.round(performance.now() - t0)
      const respHeaders: Record<string, string> = {}
      ;['x-request-id', 'x-ratelimit-limit', 'x-ratelimit-remaining', 'x-idempotency-replayed', 'content-type'].forEach((h) => {
        const v = res.headers.get(h)
        if (v) respHeaders[h] = v
      })

      const contentType = res.headers.get('content-type') || ''
      if (endpoint.isBinary && res.ok && contentType.includes('application/pdf')) {
        const blob = await res.blob()
        const pdfUrl = URL.createObjectURL(blob)
        setResult({
          status: res.status,
          latencyMs,
          headers: respHeaders,
          body: `Received PDF binary (${blob.size.toLocaleString()} bytes). Use the download button below.`,
          pdfUrl,
        })
      } else {
        const text = await res.text()
        let formatted = text
        try {
          formatted = JSON.stringify(JSON.parse(text), null, 2)
        } catch {}
        setResult({
          status: res.status,
          latencyMs,
          headers: respHeaders,
          body: formatted,
        })
      }
    } catch (e: any) {
      setErrMsg(e?.message || 'Network request failed — confirm backend API server is running.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="border-t border-slate-100 bg-[#F8FAFC]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-5 py-3.5 flex items-center justify-between text-xs font-semibold hover:bg-[#EBF2FF]/60 transition-colors text-[#002B5B] cursor-pointer"
      >
        <span className="flex items-center gap-2">
          <Terminal size={14} className="text-[#0052CC]" />
          Interactive Live Playground — Test This Endpoint
        </span>
        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
      </button>

      {open && (
        <div className="p-5 border-t border-slate-100 space-y-4 bg-white">
          {endpoint.authRequired && !apiKey.trim() && (
            <div className="p-3.5 rounded-2xl text-xs bg-amber-50 border border-amber-200 text-amber-900">
              Enter your API key in the top <strong>Test API Key</strong> bar above before sending authenticated requests.
            </div>
          )}

          {/* Path parameters */}
          {endpoint.pathParams && endpoint.pathParams.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {endpoint.pathParams.map((p) => (
                <div key={p.name}>
                  <label className="block text-xs font-semibold mb-1.5 text-[#002B5B]">
                    Path Param: <span className="font-code text-[#0052CC]">:{p.name}</span>
                  </label>
                  <input
                    value={pathVals[p.name] || ''}
                    onChange={(e) => setPathVals({ ...pathVals, [p.name]: e.target.value })}
                    placeholder={p.example || ''}
                    className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:border-[#0052CC] px-3 py-2 text-xs font-code outline-none"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Query parameters */}
          {endpoint.queryParams && endpoint.queryParams.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {endpoint.queryParams.map((q) => (
                <div key={q.name}>
                  <label className="block text-xs font-semibold mb-1.5 text-[#002B5B]">
                    Query: <span className="font-code text-[#0052CC]">?{q.name}</span>
                  </label>
                  <input
                    value={queryVals[q.name] || ''}
                    onChange={(e) => setQueryVals({ ...queryVals, [q.name]: e.target.value })}
                    placeholder={q.description}
                    className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:border-[#0052CC] px-3 py-2 text-xs font-code outline-none"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Optional headers */}
          {(endpoint.idempotent || endpoint.id === 'card-get') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {endpoint.idempotent && (
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-[#002B5B]">
                    Optional <span className="font-code">Idempotency-Key</span> Header
                  </label>
                  <input
                    value={idempotencyKey}
                    onChange={(e) => setIdempotencyKey(e.target.value)}
                    placeholder="e.g. order-retry-001"
                    className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:border-[#0052CC] px-3 py-2 text-xs font-code outline-none"
                  />
                </div>
              )}
              {endpoint.id === 'card-get' && (
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-[#002B5B]">
                    Optional <span className="font-code">X-Account-Pin</span> Header
                  </label>
                  <input
                    value={pinHeader}
                    onChange={(e) => setPinHeader(e.target.value)}
                    placeholder="Required if reveal=true & PIN set"
                    className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:border-[#0052CC] px-3 py-2 text-xs font-code outline-none"
                  />
                </div>
              )}
            </div>
          )}

          {/* JSON Body editor */}
          {['POST', 'PATCH'].includes(endpoint.method) && (
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-[#002B5B]">
                JSON Request Body
              </label>
              <textarea
                rows={6}
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                className="w-full rounded-2xl border p-3.5 font-code text-xs outline-none"
                style={{ background: '#0F172A', color: '#E2E8F0', borderColor: '#1E293B' }}
              />
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={sending}
              onClick={execute}
              className="px-5 py-2.5 rounded-full text-xs font-semibold text-white shadow-brand transition-opacity disabled:opacity-50 cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #0052CC 0%, #003D99 100%)' }}
            >
              {sending ? 'Sending Request...' : `Send ${endpoint.method} Request`}
            </button>
          </div>

          {errMsg && (
            <div className="p-3.5 rounded-2xl border text-xs text-red-700 bg-red-50 border-red-200 font-medium">
              {errMsg}
            </div>
          )}

          {result && (
            <div className="rounded-2xl overflow-hidden border" style={{ borderColor: '#1E293B', background: '#0F172A' }}>
              <div className="px-4 py-2.5 border-b flex flex-wrap items-center justify-between gap-2 text-[11px] font-code" style={{ borderColor: '#1E293B', color: '#93C5FD' }}>
                <div className="flex items-center gap-3">
                  <span
                    className="px-2.5 py-0.5 rounded-full font-bold"
                    style={{
                      background: result.status < 300 ? '#059669' : result.status < 500 ? '#D97706' : '#DC2626',
                      color: '#FFFFFF',
                    }}
                  >
                    HTTP {result.status}
                  </span>
                  <span>{result.latencyMs}ms</span>
                  {result.headers['x-ratelimit-remaining'] !== undefined && (
                    <span>
                      RateLimit: {result.headers['x-ratelimit-remaining']}/{result.headers['x-ratelimit-limit']}
                    </span>
                  )}
                  {result.headers['x-idempotency-replayed'] && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-800 text-white">REPLAYED</span>
                  )}
                </div>
                {result.headers['x-request-id'] && (
                  <span className="text-slate-400">{result.headers['x-request-id']}</span>
                )}
              </div>
              <pre className="p-4 font-code text-xs overflow-x-auto max-h-96" style={{ color: '#E2E8F0' }}>
                {result.body}
              </pre>
              {result.pdfUrl && (
                <div className="p-3.5 border-t flex items-center justify-between" style={{ borderColor: '#1E293B', background: '#0B1E3B' }}>
                  <span className="text-xs text-blue-200">Certified PDF Receipt Ready</span>
                  <a
                    href={result.pdfUrl}
                    download="Blue_Ridge_Bank_Receipt.pdf"
                    className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-white inline-flex items-center gap-1.5"
                    style={{ background: '#0052CC' }}
                  >
                    <Download size={13} /> Save PDF
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ApiDocsPage() {
  const defaultBase = useMemo(() => getDefaultBaseV1(), [])
  const [baseUrl, setBaseUrl] = useState(defaultBase)
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_BASE_URL?.trim()) {
      setBaseUrl(`${window.location.origin}/api/v1`)
    }
  }, [])
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [language, setLanguage] = useState<LanguageId>('curl')
  const [search, setSearch] = useState('')
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(API_CATEGORIES.map((c) => [c, true]))
  )
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard?.writeText(text).catch(() => {})
    setCopiedId(id)
    setTimeout(() => setCopiedId((curr) => (curr === id ? null : curr)), 2000)
  }

  const filteredEndpoints = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return ENDPOINTS
    return ENDPOINTS.filter((ep) =>
      `${ep.title} ${ep.path} ${ep.method} ${ep.category} ${ep.summary} ${ep.permission || ''}`
        .toLowerCase()
        .includes(q)
    )
  }, [search])

  const groupedEndpoints = useMemo(() => {
    return API_CATEGORIES.map((cat) => ({
      category: cat,
      items: filteredEndpoints.filter((ep) => ep.category === cat),
    })).filter((g) => g.items.length > 0)
  }, [filteredEndpoints])

  return (
    <div className="min-h-screen" style={{ background: '#F4F7FC', color: '#0A192F' }}>
      <PublicNav />

      {/* ── Hero Banner ─────────────────────────────────────────────────────── */}
      <section className="pt-28 sm:pt-36 pb-12 px-4 sm:px-6 brand-card-gradient text-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-2xl">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="px-3.5 py-1 rounded-full text-xs font-semibold bg-white/15 text-blue-100">
                  REST API v1 · Developer Portal
                </span>
                <span className="px-3.5 py-1 rounded-full text-xs font-semibold bg-[#001F42]/60 border border-white/15 text-blue-200">
                  {ENDPOINTS.length} Endpoints · Any Language
                </span>
              </div>
              <h1 className="font-display text-3xl sm:text-5xl font-bold text-white mb-4 leading-tight">
                Blue ridge Bank Developer API
              </h1>
              <p className="text-sm sm:text-base leading-relaxed text-blue-100/90 mb-6">
                Connect any application, backend service, or programming language to Blue ridge Bank. Open accounts, query real-time balances and wealth portfolios, execute deposits, transfers, withdrawals, and bill payments, download certified PDF receipts, and verify client credentials using administrator-issued API keys.
              </p>

              <div className="flex flex-wrap gap-3">
                <a
                  href={`${baseUrl.replace(/\/$/, '')}/openapi.json`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-full text-xs font-semibold border border-white/25 inline-flex items-center gap-2 text-white bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <Download size={14} /> OpenAPI 3.0 JSON <ExternalLink size={12} />
                </a>
                <Link
                  href="/contact"
                  className="px-5 py-2.5 rounded-full text-xs font-semibold inline-flex items-center gap-2 text-[#002B5B] bg-white hover:bg-blue-50 transition-colors shadow-lg"
                >
                  Request API Access <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            <div className="lg:w-80 xl:w-96 flex-shrink-0">
              <div className="relative animate-reveal">
                <div className="rounded-2xl overflow-hidden border-2 border-white/20 shadow-float aspect-[16/9] bg-[#001F42]">
                  <img
                    src="/images/blog-security-arch.png"
                    alt="Blue ridge Bank developer API cryptographic architecture"
                    className="w-full h-full object-cover animate-ken-burns"
                  />
                </div>
                <div className="absolute bottom-3 left-3 rounded-xl px-3.5 py-2 glass shadow-float animate-float">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#60A5FA] animate-live-dot flex-shrink-0" />
                    <span className="text-[11px] font-semibold text-white">OpenAPI 3.0 · 9 Languages</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Base URL + Interactive API Key Bar */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl glass">
              <label className="block text-[11px] font-semibold mb-1.5 text-blue-200">
                API v1 Base URL
              </label>
              <div className="flex items-center gap-2">
                <input
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-xl font-code text-xs border border-white/15 bg-[#0F172A]/80 text-white outline-none"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(baseUrl, 'base-url')}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 text-white bg-[#0052CC] hover:bg-[#003D99] transition-colors cursor-pointer"
                >
                  {copiedId === 'base-url' ? <Check size={13} /> : <Copy size={13} />}
                  {copiedId === 'base-url' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="p-4 rounded-2xl glass">
              <label className="block text-[11px] font-semibold mb-1.5 text-blue-200">
                Test API Key (Injected Into All Snippets &amp; Live Playground Only)
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Key size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#60A5FA]" />
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="brb_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full pl-8 pr-9 py-2 rounded-xl font-code text-xs border border-white/15 bg-[#0F172A]/80 text-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    aria-label={showKey ? 'Hide API key' : 'Show API key'}
                  >
                    {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {apiKey && (
                  <button
                    type="button"
                    onClick={() => setApiKey('')}
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-white/10 text-blue-100 hover:text-white"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Content Layout ─────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sticky Left Navigation */}
        <aside className="lg:col-span-3 lg:sticky lg:top-28 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-4">
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter endpoints..."
                className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:border-[#0052CC] pl-8 pr-3 py-2 text-xs outline-none"
              />
            </div>

            <div className="space-y-0.5 pb-3 mb-3 border-b border-slate-100">
              <p className="text-[11px] font-semibold px-2.5 py-1 text-[#0052CC]">
                Getting Started
              </p>
              {[
                { href: '#getting-started', label: '1. Obtaining an API Key' },
                { href: '#authentication', label: '2. Authentication & Headers' },
                { href: '#identifiers', label: '3. Account Identifiers' },
                { href: '#envelopes', label: '4. Response & Error Formats' },
                { href: '#any-language', label: '5. SDKs & Any Language' },
              ].map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="block px-2.5 py-1.5 rounded-xl text-xs font-medium hover:bg-[#EBF2FF] transition-colors text-[#002B5B]"
                >
                  {l.label}
                </a>
              ))}
            </div>

            <div className="space-y-2 max-h-[58vh] overflow-y-auto pr-1">
              <p className="text-[11px] font-semibold px-2.5 text-[#0052CC]">
                Endpoint Reference ({filteredEndpoints.length})
              </p>
              {groupedEndpoints.map(({ category, items }) => {
                const isOpen = openCategories[category] !== false
                return (
                  <div key={category}>
                    <button
                      type="button"
                      onClick={() => setOpenCategories((p) => ({ ...p, [category]: !isOpen }))}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold hover:bg-slate-50 text-[#002B5B] cursor-pointer"
                    >
                      <span className="truncate">{category}</span>
                      {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                    </button>
                    {isOpen && (
                      <div className="space-y-0.5 pl-1 mt-0.5">
                        {items.map((ep) => {
                          const ms = METHOD_STYLES[ep.method]
                          return (
                            <a
                              key={ep.id}
                              href={`#${ep.id}`}
                              className="flex items-center gap-2 px-2 py-1.5 rounded-xl text-[11px] hover:bg-[#F4F7FC] transition-colors"
                            >
                              <span
                                className="font-code text-[9px] font-bold px-1.5 py-0.5 rounded-md border flex-shrink-0 w-12 text-center"
                                style={{ background: ms.bg, color: ms.text, borderColor: ms.border }}
                              >
                                {ep.method}
                              </span>
                              <span className="truncate font-medium text-slate-700">
                                {ep.title}
                              </span>
                            </a>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}

              <div className="pt-2 border-t border-slate-100 space-y-0.5">
                <a href="#scopes-reference" className="block px-2.5 py-1.5 rounded-xl text-xs font-medium hover:bg-[#EBF2FF] text-[#002B5B]">
                  Permission Scopes Reference
                </a>
                <a href="#errors-reference" className="block px-2.5 py-1.5 rounded-xl text-xs font-medium hover:bg-[#EBF2FF] text-[#002B5B]">
                  Error Codes Reference
                </a>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Documentation Column */}
        <main className="lg:col-span-9 space-y-8 min-w-0">
          {/* Global Language Switcher */}
          <div className="sticky top-16 sm:top-24 z-20 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 p-3.5 shadow-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#002B5B]">
                Code Examples Language:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {LANGUAGES.map((lang) => {
                  const active = language === lang.id
                  return (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => setLanguage(lang.id)}
                      className="px-3 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer"
                      style={{
                        background: active ? '#0052CC' : '#F4F7FC',
                        color: active ? '#FFFFFF' : '#002B5B',
                      }}
                    >
                      {lang.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ── Getting Started Sections ────────────────────────────────────── */}
          <section id="getting-started" className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-6 sm:p-8 space-y-6">
            <div>
              <span className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold bg-[#EBF2FF] text-[#0052CC] mb-2">
                Integration Guide
              </span>
              <h2 className="font-display text-2xl font-bold text-[#002B5B]">
                1. Obtaining Admin-Approved API Access
              </h2>
              <p className="text-sm mt-2 leading-relaxed text-slate-600">
                Blue ridge Bank operates an administrator-governed API. Only integrations and clients approved by the overall bank administrator can receive an API key. Upon approval, the administrator issues a secret key (<span className="font-code font-semibold">brb_live_...</span> or <span className="font-code font-semibold">brb_test_...</span>), defines your account scope (<span className="font-code">all</span>, <span className="font-code">owned</span>, or <span className="font-code">single_user</span>), sets your rate limit, and selects your allowed permission scopes.
              </p>
              <div className="mt-4 p-4 rounded-2xl border border-blue-200 bg-[#EBF2FF] text-xs leading-relaxed text-[#002B5B]">
                <p className="font-bold uppercase tracking-wider mb-1 text-[#0052CC]">
                  Frontend API Gateway &amp; Backend CORS Security
                </p>
                <p>
                  All external API calls are routed through the <strong>Frontend API Gateway</strong> (<span className="font-code font-semibold">{baseUrl}</span>), which securely forwards requests server-to-server to the core banking engine. Because the core backend remains protected by strict origin-locked CORS security and never exposes wildcard browser access, your integrations connect safely through the frontend gateway from any programming language or directly from this page&apos;s Live Playground. <strong>Always use this bank&apos;s full base URL (<span className="font-code">{baseUrl}</span>) in your code</strong> — never a relative path on your own website.
                </p>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-[#F4F7FC] border border-slate-200/60">
                  <ShieldCheck size={18} className="mb-2 text-[#0052CC]" />
                  <p className="text-xs font-bold mb-1 text-[#002B5B]">Partner / Full Scope</p>
                  <p className="text-xs text-slate-500">
                    Create new client bank accounts and manage deposits, transfers, withdrawals, cards, and wealth across accounts.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-[#F4F7FC] border border-slate-200/60">
                  <Lock size={18} className="mb-2 text-[#0052CC]" />
                  <p className="text-xs font-bold mb-1 text-[#002B5B]">Single-Client Scope</p>
                  <p className="text-xs text-slate-500">
                    Locked to one specific bank account. Use <span className="font-code font-bold">/accounts/me/...</span> for every call.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-[#F4F7FC] border border-slate-200/60">
                  <Zap size={18} className="mb-2 text-[#0052CC]" />
                  <p className="text-xs font-bold mb-1 text-[#002B5B]">Idempotent &amp; Audited</p>
                  <p className="text-xs text-slate-500">
                    Safe retries via <span className="font-code">Idempotency-Key</span>, real-time rate-limit headers, and 30-day request audit logs.
                  </p>
                </div>
              </div>
            </div>

            <div id="authentication" className="pt-5 border-t border-slate-100">
              <h3 className="font-display text-lg font-bold mb-2 text-[#002B5B]">
                2. Authentication &amp; Required Headers
              </h3>
              <p className="text-sm mb-3 text-slate-600">
                Authenticate every protected request using either the <span className="font-code font-semibold">X-API-Key</span> header or a standard HTTP <span className="font-code font-semibold">Authorization: Bearer</span> header.
              </p>
              <pre className="p-4 rounded-2xl font-code text-xs overflow-x-auto" style={{ background: '#0F172A', color: '#E2E8F0' }}>
{`# Option A (Recommended)
X-API-Key: ${apiKey.trim() || 'brb_live_your_secret_api_key'}

# Option B (Standard Bearer)
Authorization: Bearer ${apiKey.trim() || 'brb_live_your_secret_api_key'}

# Optional Idempotency Header (for safe POST retries)
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000`}
              </pre>
            </div>

            <div id="identifiers" className="pt-5 border-t border-slate-100">
              <h3 className="font-display text-lg font-bold mb-2 text-[#002B5B]">
                3. Account Identifiers (<span className="font-code">:accountId</span>)
              </h3>
              <p className="text-sm mb-3 text-slate-600">
                Anywhere an endpoint expects <span className="font-code font-semibold">:accountId</span>, you may pass any of these formats:
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <li className="p-3 rounded-2xl bg-[#F4F7FC]">
                  <span className="font-code font-bold text-[#0052CC]">me</span> — Resolves automatically to the client account bound to your API key.
                </li>
                <li className="p-3 rounded-2xl bg-[#F4F7FC]">
                  <span className="font-code font-bold text-[#0052CC]">482910384712</span> — The client&apos;s 12-digit Blue ridge Bank account number.
                </li>
                <li className="p-3 rounded-2xl bg-[#F4F7FC]">
                  <span className="font-code font-bold text-[#0052CC]">673f1c8a9e2b1d0012a4b5c6</span> — The account&apos;s MongoDB ObjectId.
                </li>
                <li className="p-3 rounded-2xl bg-[#F4F7FC]">
                  <span className="font-code font-bold text-[#0052CC]">client@example.com</span> — URL-encoded account email address.
                </li>
              </ul>
            </div>

            <div id="envelopes" className="pt-5 border-t border-slate-100">
              <h3 className="font-display text-lg font-bold mb-2 text-[#002B5B]">
                4. Standard Response, Error &amp; Rate-Limit Headers
              </h3>
              <p className="text-sm mb-3 text-slate-600">
                Every JSON response includes a unique <span className="font-code">requestId</span> and rate-limit telemetry headers: <span className="font-code">X-RateLimit-Limit</span>, <span className="font-code">X-RateLimit-Remaining</span>, and <span className="font-code">X-RateLimit-Reset</span>.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold mb-1.5 text-[#059669]">Success Envelope</p>
                  <pre className="p-3.5 rounded-2xl font-code text-xs overflow-x-auto" style={{ background: '#0F172A', color: '#E2E8F0' }}>
{`{
  "success": true,
  "requestId": "req_4f2a9c10b7d8e1a2",
  "data": { ... },
  "meta": { "pagination": { ... } }
}`}
                  </pre>
                </div>
                <div>
                  <p className="text-xs font-semibold mb-1.5 text-red-600">Error Envelope</p>
                  <pre className="p-3.5 rounded-2xl font-code text-xs overflow-x-auto" style={{ background: '#0F172A', color: '#FCA5A5' }}>
{`{
  "success": false,
  "requestId": "req_4f2a9c10b7d8e1a2",
  "error": {
    "code": "INSUFFICIENT_FUNDS",
    "message": "Insufficient funds..."
  }
}`}
                  </pre>
                </div>
              </div>
            </div>

            <div id="any-language" className="pt-5 border-t border-slate-100">
              <h3 className="font-display text-lg font-bold mb-2 text-[#002B5B]">
                5. Integrating in Any Programming Language
              </h3>
              <p className="text-sm mb-3 text-slate-600">
                Because API v1 uses pure standard HTTPS + JSON with header-based authentication, you can connect using any HTTP library in any language. Use the switcher above to inspect ready-to-run snippets in <strong>9 languages</strong> (cURL, JavaScript/Node.js, Python, PHP, Go, Java, C#, Ruby, Rust), or import our live OpenAPI 3.0 specification into <strong>Postman</strong>, <strong>Insomnia</strong>, or <strong>OpenAPI Generator</strong> to auto-generate typed SDK clients for <strong>50+ languages</strong>:
              </p>
              <pre className="p-3.5 rounded-2xl font-code text-xs overflow-x-auto" style={{ background: '#0F172A', color: '#93C5FD' }}>
{`# Generate a typed SDK in any language (e.g. typescript-fetch, kotlin, swift5, dart)
npx @openapitools/openapi-generator-cli generate \\
  -i ${baseUrl.replace(/\/$/, '')}/openapi.json \\
  -g typescript-fetch \\
  -o ./blueridge-sdk`}
              </pre>
            </div>
          </section>

          {/* ── Endpoint Cards ──────────────────────────────────────────────── */}
          {groupedEndpoints.map(({ category, items }) => (
            <div key={category} className="space-y-5">
              <div className="pb-2 flex items-center justify-between">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-[#002B5B]">
                  {category}
                </h2>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#EBF2FF] text-[#0052CC]">
                  {items.length} Endpoint{items.length > 1 ? 's' : ''}
                </span>
              </div>

              {items.map((ep) => {
                const ms = METHOD_STYLES[ep.method]
                const snippet = generateCodeSnippet(ep, language, baseUrl, apiKey)
                const respStr =
                  typeof ep.sampleResponse === 'string'
                    ? ep.sampleResponse
                    : JSON.stringify(ep.sampleResponse, null, 2)

                return (
                  <article
                    key={ep.id}
                    id={ep.id}
                    className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden scroll-mt-36"
                  >
                    {/* Header */}
                    <div className="p-5 sm:p-6 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2 min-w-0">
                          <span
                            className="font-code text-xs font-bold px-3 py-1 rounded-full border"
                            style={{ background: ms.bg, color: ms.text, borderColor: ms.border }}
                          >
                            {ep.method}
                          </span>
                          <code className="font-code text-xs sm:text-sm font-bold break-all text-[#002B5B]">
                            {baseUrl.replace(/\/$/, '')}{ep.path}
                          </code>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {ep.permission ? (
                            <span className="font-code text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-[#EBF2FF] text-[#002B5B]">
                              scope: {ep.permission}
                            </span>
                          ) : (
                            <span className="font-code text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-600">
                              {ep.authRequired ? 'any valid key' : 'public (no key)'}
                            </span>
                          )}
                          {ep.idempotent && (
                            <span className="font-code text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-[#ECFDF5] text-[#059669]">
                              idempotent
                            </span>
                          )}
                          {ep.isBinary && (
                            <span className="font-code text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-amber-50 text-amber-800">
                              application/pdf
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="font-display text-lg font-bold text-[#002B5B]">{ep.title}</h3>
                        <p className="text-sm mt-1 leading-relaxed text-slate-600">{ep.summary}</p>
                      </div>

                      {ep.notes && ep.notes.length > 0 && (
                        <div className="p-3.5 rounded-2xl space-y-1 text-xs bg-[#EBF2FF] text-[#002B5B]">
                          {ep.notes.map((n, i) => <p key={i}>• {n}</p>)}
                        </div>
                      )}

                      {/* Parameter Tables */}
                      {ep.pathParams && ep.pathParams.length > 0 && (
                        <ParamTable title="Path Parameters" params={ep.pathParams} />
                      )}
                      {ep.queryParams && ep.queryParams.length > 0 && (
                        <ParamTable title="Query Parameters" params={ep.queryParams} />
                      )}
                      {ep.bodyParams && ep.bodyParams.length > 0 && (
                        <ParamTable title="JSON Body Fields" params={ep.bodyParams} />
                      )}

                      {/* Code Snippet + Response */}
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        <div className="rounded-2xl overflow-hidden flex flex-col" style={{ background: '#0F172A' }}>
                          <div className="px-4 py-2.5 border-b flex items-center justify-between text-[11px]" style={{ borderColor: '#1E293B', color: '#93C5FD' }}>
                            <span className="font-semibold">
                              Example Request · {LANGUAGES.find((l) => l.id === language)?.label}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(snippet, `code-${ep.id}`)}
                              className="px-2.5 py-1 rounded-full inline-flex items-center gap-1 text-[10px] font-semibold text-white bg-white/10 hover:bg-white/20 cursor-pointer"
                            >
                              {copiedId === `code-${ep.id}` ? <Check size={11} /> : <Copy size={11} />}
                              {copiedId === `code-${ep.id}` ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                          <pre className="p-4 font-code text-xs overflow-x-auto flex-1 max-h-80" style={{ color: '#E2E8F0' }}>
                            {snippet}
                          </pre>
                        </div>

                        <div className="rounded-2xl overflow-hidden flex flex-col" style={{ background: '#0F172A' }}>
                          <div className="px-4 py-2.5 border-b flex items-center justify-between text-[11px]" style={{ borderColor: '#1E293B', color: '#6EE7B7' }}>
                            <span className="font-semibold">
                              Example Response ({ep.method === 'POST' ? '201' : '200'})
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(respStr, `resp-${ep.id}`)}
                              className="px-2.5 py-1 rounded-full inline-flex items-center gap-1 text-[10px] font-semibold text-white bg-white/10 hover:bg-white/20 cursor-pointer"
                            >
                              {copiedId === `resp-${ep.id}` ? <Check size={11} /> : <Copy size={11} />}
                              {copiedId === `resp-${ep.id}` ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                          <pre className="p-4 font-code text-xs overflow-x-auto flex-1 max-h-80" style={{ color: '#CBD5E1' }}>
                            {respStr}
                          </pre>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Try It Live */}
                    <TryItLive endpoint={ep} baseUrl={baseUrl} apiKey={apiKey} />
                  </article>
                )
              })}
            </div>
          ))}

          {/* ── Scopes Reference Table ──────────────────────────────────────── */}
          <section id="scopes-reference" className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-6 sm:p-8 space-y-4 scroll-mt-36">
            <div>
              <span className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold bg-[#EBF2FF] text-[#0052CC] mb-2">
                Authorization Matrix
              </span>
              <h2 className="font-display text-xl font-bold text-[#002B5B]">
                API Permission Scopes Reference
              </h2>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F4F7FC] text-[#002B5B] border-b border-slate-200/80">
                    <th className="py-3 px-4 font-semibold">Scope</th>
                    <th className="py-3 px-4 font-semibold">Domain</th>
                    <th className="py-3 px-4 font-semibold">Authorized Capability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {PERMISSION_DOCS.map((p) => (
                    <tr key={p.scope} className="hover:bg-[#F4F7FC]/70">
                      <td className="py-3 px-4 font-code font-bold text-[#0052CC]">{p.scope}</td>
                      <td className="py-3 px-4 font-semibold text-[#002B5B]">{p.group}</td>
                      <td className="py-3 px-4 text-slate-600">{p.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ── Error Codes Reference Table ─────────────────────────────────── */}
          <section id="errors-reference" className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-6 sm:p-8 space-y-4 scroll-mt-36">
            <div>
              <span className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold bg-[#EBF2FF] text-[#0052CC] mb-2">
                Diagnostics
              </span>
              <h2 className="font-display text-xl font-bold text-[#002B5B]">
                Error Codes Reference
              </h2>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F4F7FC] text-[#002B5B] border-b border-slate-200/80">
                    <th className="py-3 px-4 font-semibold">HTTP</th>
                    <th className="py-3 px-4 font-semibold">Error Code</th>
                    <th className="py-3 px-4 font-semibold">Meaning</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ERROR_CODES.map((e) => (
                    <tr key={e.code} className="hover:bg-[#F4F7FC]/70">
                      <td className="py-3 px-4 font-code font-bold text-[#002B5B]">{e.http}</td>
                      <td className="py-3 px-4 font-code font-bold text-red-600">{e.code}</td>
                      <td className="py-3 px-4 text-slate-600">{e.meaning}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>

      {/* ── Institutional Footer ────────────────────────────────────────────── */}
      <footer className="py-10 mt-12 brand-card-gradient text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <BrandLogo variant="light" size="sm" />
          <p className="text-xs text-center text-blue-100">
            Blue ridge Bank External Banking API v1 · Support: <a href="mailto:support@theblueridges.com" className="underline text-white">support@theblueridges.com</a>
          </p>
          <div className="flex gap-5 text-xs text-blue-200">
            <Link href="/home" className="hover:text-white">Bank Home</Link>
            <Link href="/services" className="hover:text-white">Services</Link>
            <Link href="/contact" className="hover:text-white">Request Access</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function ParamTable({ title, params }: { title: string; params: Array<{ name: string; type: string; required?: boolean; description: string }> }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-[#002B5B]">{title}</p>
      <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#F4F7FC] border-b border-slate-200/80 text-slate-500">
              <th className="py-2.5 px-3.5 font-semibold">Field</th>
              <th className="py-2.5 px-3.5 font-semibold">Type</th>
              <th className="py-2.5 px-3.5 font-semibold">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {params.map((p) => (
              <tr key={p.name}>
                <td className="py-2.5 px-3.5 font-code font-bold whitespace-nowrap text-[#002B5B]">
                  {p.name}
                  {p.required && <span className="ml-1.5 text-[10px] text-red-600 font-sans font-semibold">required</span>}
                </td>
                <td className="py-2.5 px-3.5 font-code text-[11px] text-[#0052CC]">{p.type}</td>
                <td className="py-2.5 px-3.5 text-slate-600">{p.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
