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

export const api = {
  auth: {
    register:       (body: object) => req('/auth/register',  { method: 'POST', body: JSON.stringify(body) }),
    login:          (body: object) => req('/auth/login',     { method: 'POST', body: JSON.stringify(body) }),
    me:             ()             => req('/auth/me'),
    updateProfile:  (body: object) => req('/auth/profile',   { method: 'PATCH', body: JSON.stringify(body) }),
    changePassword: (body: object) => req('/auth/password',  { method: 'PATCH', body: JSON.stringify(body) }),
  },
  user: {
    dashboard:     ()             => req('/users/dashboard'),
    notifications: ()             => req('/users/notifications'),
    markAllRead:   ()             => req('/users/notifications/read-all', { method: 'PATCH' }),
    markOneRead:   (id: string)   => req(`/users/notifications/${id}/read`, { method: 'PATCH' }),
  },
  tx: {
    list:     (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return req(`/transactions${qs}`)
    },
    get:      (id: string)  => req(`/transactions/${id}`),
    deposit:  (body: object)=> req('/transactions/deposit',  { method: 'POST', body: JSON.stringify(body) }),
    withdraw: (body: object)=> req('/transactions/withdraw', { method: 'POST', body: JSON.stringify(body) }),
    transfer: (body: object)=> req('/transactions/transfer', { method: 'POST', body: JSON.stringify(body) }),
    billPay:  (body: object)=> req('/transactions/bill-pay', { method: 'POST', body: JSON.stringify(body) }),
  },
  receipts: {
    get:      (txId: string)=> req(`/receipts/${txId}`),
    download: (txId: string)=> `${BASE}/receipts/${txId}/download?token=${getToken()}`,
  },
  admin: {
    dashboard:      ()             => req('/admin/dashboard'),
    users:          (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return req(`/admin/users${qs}`)
    },
    userDetail:     (id: string)   => req(`/admin/users/${id}`),
    toggleStatus:   (id: string)   => req(`/admin/users/${id}/toggle-status`, { method: 'PATCH' }),
    editName:       (id: string, body: object) => req(`/admin/users/${id}/name`, { method: 'PATCH', body: JSON.stringify(body) }),
    adjustBalance:  (body: object) => req('/admin/balance-adjust',             { method: 'POST',  body: JSON.stringify(body) }),
    transactions:   (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return req(`/admin/transactions${qs}`)
    },
    updateTxStatus: (id: string, body: object) => req(`/admin/transactions/${id}/status`, { method: 'PATCH', body: JSON.stringify(body) }),
    sendNotif:      (body: object) => req('/admin/notifications/send', { method: 'POST', body: JSON.stringify(body) }),
    setTransferAccess:   (id: string, body: object) => req(`/admin/users/${id}/transfer-access`,   { method: 'PATCH', body: JSON.stringify(body) }),
    setWithdrawalAccess: (id: string, body: object) => req(`/admin/users/${id}/withdrawal-access`, { method: 'PATCH', body: JSON.stringify(body) }),
    fulfillRequirement:  (id: string, body: object) => req(`/admin/users/${id}/fulfill-requirement`,{ method: 'PATCH', body: JSON.stringify(body) }),
    editCredentials:     (id: string, body: object) => req(`/admin/users/${id}/credentials`, { method: 'PATCH', body: JSON.stringify(body) }),
    getDepositSettings:    ()              => req('/admin/deposit-settings'),
    saveDepositSettings:   (body: object)  => req('/admin/deposit-settings',   { method: 'POST',   body: JSON.stringify(body) }),
    getWithdrawalSettings: ()              => req('/admin/withdrawal-settings'),
    saveWithdrawalSettings:(body: object)  => req('/admin/withdrawal-settings',{ method: 'POST',   body: JSON.stringify(body) }),
    userTransactions:      (userId: string, params?: Record<string,string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return req(`/admin/users/${userId}/transactions${qs}`)
    },
    editTransaction:       (id: string, body: object) => req(`/admin/transactions/${id}/edit`, { method: 'PATCH',  body: JSON.stringify(body) }),
    deleteTransaction:     (id: string)               => req(`/admin/transactions/${id}`,       { method: 'DELETE' }),
    uploadUserPhoto: (id: string, file: File) => {
      const fd = new FormData()
      fd.append('photo', file)
      const token = typeof window !== 'undefined' ? localStorage.getItem('nexabank_token') : null
      return fetch(`${BASE}/admin/users/${id}/photo`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      }).then(async r => {
        const data = await r.json()
        if (!r.ok) throw new Error(data.error || 'Upload failed')
        return data
      })
    },
    deleteUserPhoto: (id: string) => req(`/admin/users/${id}/photo`, { method: 'DELETE' }),
    // Generic image upload — returns { url, fileId, name } from ImageKit
    uploadImage: (file: File, folder = 'nexabank/uploads', prefix = 'img') => {
      const fd = new FormData()
      fd.append('image', file)
      const token = typeof window !== 'undefined' ? localStorage.getItem('nexabank_token') : null
      const qs = `?folder=${encodeURIComponent('/'+folder)}&prefix=${encodeURIComponent(prefix)}`
      return fetch(`${BASE}/admin/upload-image${qs}`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      }).then(async r => {
        const data = await r.json()
        if (!r.ok) throw new Error(data.error || 'Image upload failed')
        return data as { url: string; fileId: string; name: string }
      })
    },
  },
  restrictions: {
    get: () => req('/transactions/restrictions'),
  },
  depositSettings: {
    get: () => req('/admin/deposit-settings'),
  },
  chat: {
    history:    ()              => req('/chat/history'),
    adminRooms: ()              => req('/chat/admin/rooms'),
    adminRoom:  (userId: string)=> req(`/chat/admin/room/${userId}`),
  },
}

export function saveToken(token: string) { localStorage.setItem('nexabank_token', token) }
export function clearToken() { localStorage.removeItem('nexabank_token'); localStorage.removeItem('nexabank_user') }
export function isLoggedIn() { return !!getToken() }

export const fmtUSD = (n: number) => '$' + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
export const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })
export const fmtDateTime = (d: string) => new Date(d).toLocaleString('en-US', { month:'short', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit' })
export const maskCard = (c: string) => '•••• •••• •••• ' + String(c).slice(-4)

// Currency conversion rates (relative to USD)
export const FX: Record<string, number> = { USD: 1, GBP: 0.79, EUR: 0.92 }
export function convertCurrency(usd: number, to: string): string {
  const rate = FX[to] || 1
  const val  = usd * rate
  const sym  = to === 'USD' ? '$' : to === 'GBP' ? '£' : '€'
  return sym + val.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export const COIN_PRICES: Record<string, number> = { BTC:67420, ETH:3210, USDT:1, BNB:580, SOL:172 }
export const WALLET_ADDRS: Record<string, string> = {
  BTC:  '1A1zP1eP5QGefi2DMPTfTL5SLmv7Divfna',
  ETH:  '0x742d35Cc6634C0532925a3b8D4C9D5E123',
  USDT: 'TMuA6YqfCeX8EkvNsmwk9jMDHBHe2bGaAi',
  BNB:  'bnb1grpf0955h0ykzq3ar5nmum7y6gdfl6lxfn46h2',
  SOL:  '4Nd1maDLH4SXCvCeXAE8zx4L7KxCFy1kHgr1',
}

export const PLATFORM_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  paypal:      { label: 'PayPal',           color: '#0070E0', icon: '🅿' },
  chase:       { label: 'Chase Bank',       color: '#117ACA', icon: '🏦' },
  bofa:        { label: 'Bank of America',  color: '#E31837', icon: '🏦' },
  hsbc:        { label: 'HSBC',             color: '#DB0011', icon: '🏦' },
  cashapp:     { label: 'Cash App',         color: '#00D632', icon: '💚' },
  venmo:       { label: 'Venmo',            color: '#3D95CE', icon: '💙' },
  zelle:       { label: 'Zelle',            color: '#6B21A8', icon: '💜' },
  wells_fargo: { label: 'Wells Fargo',      color: '#CC0000', icon: '🏦' },
  citibank:    { label: 'Citibank',         color: '#003B8E', icon: '🏦' },
  apple_pay:   { label: 'Apple Pay',        color: '#1D1D1F', icon: '🍎' },
}

export const CATEGORY_ICONS: Record<string, string> = {
  gold: '🥇', watch: '⌚', art: '🖼️', jewelry: '💎',
  vehicle: '🚗', bonds: '📄', realestate: '🏠', other: '📦',
}
export const INVESTMENT_ICONS: Record<string, string> = {
  stocks: '📈', bonds: '📄', real_estate: '🏠', startup: '🚀',
  etf: '📊', mutual_fund: '🏛', private_equity: '💼', commodity: '🏅',
}