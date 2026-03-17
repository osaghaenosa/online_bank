// lib/api.ts  — all calls to the Express backend

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

function getToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('nexabank_token')
}

async function req(path: string, opts: RequestInit = {}) {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(opts.headers as Record<string, string> || {}),
  }
  const res = await fetch(`${BASE}${path}`, { ...opts, headers })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || data.message || 'Request failed')
  return data
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const api = {
  auth: {
    register: (body: object)          => req('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login:    (body: object)          => req('/auth/login',    { method: 'POST', body: JSON.stringify(body) }),
    me:       ()                      => req('/auth/me'),
    updateProfile: (body: object)     => req('/auth/profile', { method: 'PATCH', body: JSON.stringify(body) }),
    changePassword: (body: object)    => req('/auth/password', { method: 'PATCH', body: JSON.stringify(body) }),
  },

  // ── Dashboard / user ───────────────────────────────────────────────────────
  user: {
    dashboard:       ()               => req('/users/dashboard'),
    notifications:   ()               => req('/users/notifications'),
    markAllRead:     ()               => req('/users/notifications/read-all', { method: 'PATCH' }),
    markOneRead:     (id: string)     => req(`/users/notifications/${id}/read`, { method: 'PATCH' }),
  },

  // ── Transactions ───────────────────────────────────────────────────────────
  tx: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return req(`/transactions${qs}`)
    },
    get:      (id: string)            => req(`/transactions/${id}`),
    deposit:  (body: object)          => req('/transactions/deposit',  { method: 'POST', body: JSON.stringify(body) }),
    withdraw: (body: object)          => req('/transactions/withdraw', { method: 'POST', body: JSON.stringify(body) }),
    transfer: (body: object)          => req('/transactions/transfer', { method: 'POST', body: JSON.stringify(body) }),
    billPay:  (body: object)          => req('/transactions/bill-pay', { method: 'POST', body: JSON.stringify(body) }),
  },

  // ── Receipts ───────────────────────────────────────────────────────────────
  receipts: {
    get:      (txId: string)          => req(`/receipts/${txId}`),
    download: (txId: string)          => `${BASE}/receipts/${txId}/download?token=${getToken()}`,
  },

  // ── Admin ──────────────────────────────────────────────────────────────────
  admin: {
    dashboard:       ()               => req('/admin/dashboard'),
    users:           (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return req(`/admin/users${qs}`)
    },
    userDetail:      (id: string)     => req(`/admin/users/${id}`),
    toggleStatus:    (id: string)     => req(`/admin/users/${id}/toggle-status`, { method: 'PATCH' }),
    adjustBalance:   (body: object)   => req('/admin/balance-adjust', { method: 'POST', body: JSON.stringify(body) }),
    transactions:    (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return req(`/admin/transactions${qs}`)
    },
    updateTxStatus:  (id: string, body: object) => req(`/admin/transactions/${id}/status`, { method: 'PATCH', body: JSON.stringify(body) }),
    sendNotif:       (body: object)   => req('/admin/notifications/send', { method: 'POST', body: JSON.stringify(body) }),
  },
}

// ── Auth helpers ──────────────────────────────────────────────────────────────
export function saveToken(token: string) {
  localStorage.setItem('nexabank_token', token)
}
export function clearToken() {
  localStorage.removeItem('nexabank_token')
  localStorage.removeItem('nexabank_user')
}
export function isLoggedIn() {
  return !!getToken()
}

export const fmtUSD = (n: number) =>
  '$' + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')

export const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

export const fmtDateTime = (d: string) =>
  new Date(d).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

export const maskCard = (c: string) => '•••• •••• •••• ' + String(c).slice(-4)

export const COIN_PRICES: Record<string, number> = {
  BTC: 67420, ETH: 3210, USDT: 1, BNB: 580, SOL: 172,
}

export const WALLET_ADDRS: Record<string, string> = {
  BTC:  '1A1zP1eP5QGefi2DMPTfTL5SLmv7Divfna',
  ETH:  '0x742d35Cc6634C0532925a3b8D4C9D5E123',
  USDT: 'TMuA6YqfCeX8EkvNsmwk9jMDHBHe2bGaAi',
  BNB:  'bnb1grpf0955h0ykzq3ar5nmum7y6gdfl6lxfn46h2',
  SOL:  '4Nd1maDLH4SXCvCeXAE8zx4L7KxCFy1kHgr1',
}
