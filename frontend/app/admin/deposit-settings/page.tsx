'use client'
import { useEffect, useState, useRef } from 'react'
import { api } from '@/lib/api'
import { Card, Button, Input, SectionHeader, Divider } from '@/components/ui'
import { useAuth } from '@/store/auth'
import {
  Save, Plus, Trash2, Upload, ChevronDown, ChevronUp,
  Bitcoin, Building, CreditCard, DollarSign, Smartphone, Image, X
} from 'lucide-react'

// Default method definitions
const DEFAULT_METHODS = [
  {
    id: 'bank_transfer', label: 'Bank Transfer', category: 'bank',
    icon: 'building', enabled: true, fee: '0', feeType: 'fixed',
    details: {
      bankName: 'NexaBank Federal',
      accountNumber: '0012349876',
      routingNumber: '021000021',
      swiftCode: 'NEXAUS33',
      reference: 'Use your account number as reference',
    },
    instructions: 'Transfer funds directly from your bank. Allow 1-3 business days.',
    image: '',
  },
  {
    id: 'ach', label: 'ACH Transfer', category: 'bank',
    icon: 'building', enabled: true, fee: '0', feeType: 'fixed',
    details: {
      routingNumber: '021000021',
      accountNumber: '0012349876',
      accountType: 'Checking',
    },
    instructions: 'ACH transfers settle in 1-2 business days.',
    image: '',
  },
  {
    id: 'wire', label: 'Wire Transfer', category: 'bank',
    icon: 'building', enabled: true, fee: '15', feeType: 'fixed',
    details: {
      bankName: 'NexaBank Federal',
      routingNumber: '021000021',
      accountNumber: '0012349876',
      swiftCode: 'NEXAUS33',
      address: '100 NexaBank Plaza, New York, NY 10001',
    },
    instructions: 'Wire transfers are same-day for domestic and 1-2 days international.',
    image: '',
  },
  {
    id: 'card', label: 'Debit / Credit Card', category: 'card',
    icon: 'card', enabled: true, fee: '2.5', feeType: 'percent',
    details: {},
    instructions: 'Instant credit to your account. 2.5% processing fee applies.',
    image: '',
  },
  {
    id: 'crypto_btc', label: 'Bitcoin (BTC)', category: 'crypto',
    icon: 'bitcoin', enabled: true, fee: '2.50', feeType: 'fixed',
    details: {
      walletAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7Divfna',
      network: 'Bitcoin Mainnet',
      confirmations: '3 confirmations required',
      minDeposit: '$10',
    },
    instructions: 'Send BTC to the address above. Credited after 3 network confirmations (~30 min).',
    image: '',
  },
  {
    id: 'crypto_eth', label: 'Ethereum (ETH)', category: 'crypto',
    icon: 'bitcoin', enabled: true, fee: '2.50', feeType: 'fixed',
    details: {
      walletAddress: '0x742d35Cc6634C0532925a3b8D4C9D5E123',
      network: 'Ethereum Mainnet (ERC-20)',
      confirmations: '12 confirmations required',
      minDeposit: '$10',
    },
    instructions: 'Send ETH to the address above. Credited after 12 confirmations (~3 min).',
    image: '',
  },
  {
    id: 'crypto_usdt', label: 'USDT (Tether)', category: 'crypto',
    icon: 'bitcoin', enabled: true, fee: '2.50', feeType: 'fixed',
    details: {
      walletAddress: 'TMuA6YqfCeX8EkvNsmwk9jMDHBHe2bGaAi',
      network: 'TRC-20 (Tron)',
      confirmations: '20 confirmations required',
      minDeposit: '$10',
    },
    instructions: 'Send USDT (TRC-20) only. Using ERC-20 will result in loss of funds.',
    image: '',
  },
  {
    id: 'crypto_sol', label: 'Solana (SOL)', category: 'crypto',
    icon: 'bitcoin', enabled: true, fee: '2.50', feeType: 'fixed',
    details: {
      walletAddress: '4Nd1maDLH4SXCvCeXAE8zx4L7KxCFy1kHgr1',
      network: 'Solana Mainnet',
      confirmations: '32 confirmations required',
      minDeposit: '$10',
    },
    instructions: 'Send SOL to the address above. Credited in ~30 seconds.',
    image: '',
  },
  {
    id: 'paypal', label: 'PayPal', category: 'digital',
    icon: 'dollar', enabled: true, fee: '0', feeType: 'fixed',
    details: {
      email: 'deposits@nexabank.com',
      note: 'Include your NexaBank account number in the note',
    },
    instructions: 'Send to our PayPal email. Include your account number as the note.',
    image: '',
  },
  {
    id: 'cashapp', label: 'Cash App', category: 'digital',
    icon: 'dollar', enabled: true, fee: '0', feeType: 'fixed',
    details: {
      cashtag: '$NexaBankDeposit',
      note: 'Include your NexaBank account number',
    },
    instructions: 'Send to our $Cashtag with your account number in the note.',
    image: '',
  },
  {
    id: 'zelle', label: 'Zelle', category: 'digital',
    icon: 'phone', enabled: true, fee: '0', feeType: 'fixed',
    details: {
      email: 'zelle@nexabank.com',
      phone: '+1 (888) 639-2265',
    },
    instructions: 'Send via Zelle using our email or phone number.',
    image: '',
  },
  {
    id: 'venmo', label: 'Venmo', category: 'digital',
    icon: 'phone', enabled: true, fee: '0', feeType: 'fixed',
    details: {
      username: '@NexaBankDeposits',
      note: 'Include your NexaBank account number',
    },
    instructions: 'Send to @NexaBankDeposits with your account number in the note.',
    image: '',
  },
]

const ICON_MAP: Record<string, React.ElementType> = {
  bitcoin: Bitcoin, building: Building, card: CreditCard,
  dollar: DollarSign, phone: Smartphone
}
const CATEGORY_LABELS: Record<string, string> = {
  bank: '🏦 Bank', card: '💳 Card', crypto: '₿ Crypto', digital: '📱 Digital Wallets'
}

type Method = typeof DEFAULT_METHODS[0]

export default function DepositSettingsPage() {
  const { toast } = useAuth()
  const [methods,   setMethods]   = useState<Method[]>(DEFAULT_METHODS)
  const [expanded,  setExpanded]  = useState<string | null>(null)
  const [saving,    setSaving]    = useState(false)
  const [loading,   setLoading]   = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingImg, setUploadingImg] = useState<string|null>(null)
  const [uploadingFor, setUploadingFor] = useState<string | null>(null)

  // Load saved settings
  useEffect(() => {
    api.admin.getDepositSettings()
      .then(d => { if (d.settings) setMethods(d.settings) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      await api.admin.saveDepositSettings({ methods })
      toast('Deposit method settings saved!', 'success')
    } catch (err: any) { toast(err.message, 'error') }
    finally { setSaving(false) }
  }

  const update = (id: string, patch: Partial<Method>) => {
    setMethods(p => p.map(m => m.id === id ? { ...m, ...patch } : m))
  }

  const updateDetail = (id: string, key: string, value: string) => {
    setMethods(p => p.map(m => m.id === id ? { ...m, details: { ...m.details, [key]: value } } : m))
  }

  const addDetailField = (id: string) => {
    setMethods(p => p.map(m => {
      if (m.id !== id) return m
      const newKey = `field_${Date.now()}`
      return { ...m, details: { ...m.details, [newKey]: '' } }
    }))
  }

  const removeDetailField = (id: string, key: string) => {
    setMethods(p => p.map(m => {
      if (m.id !== id) return m
      const d = { ...m.details }
      delete d[key]
      return { ...m, details: d }
    }))
  }

  const renameDetailKey = (id: string, oldKey: string, newKey: string) => {
    setMethods(p => p.map(m => {
      if (m.id !== id) return m
      const d: any = {}
      for (const [k, v] of Object.entries(m.details)) {
        d[k === oldKey ? newKey : k] = v
      }
      return { ...m, details: d }
    }))
  }

  // Handle image upload — upload to ImageKit CDN
  const handleImageUpload = async (id: string, file: File) => {
    // Show local preview immediately
    const reader = new FileReader()
    reader.onload = e => update(id, { image: e.target?.result as string })
    reader.readAsDataURL(file)

    setUploadingImg(id)
    try {
      const result = await api.admin.uploadImage(file, 'nexabank/deposit-images', 'deposit_' + id)
      update(id, { image: result.url, imageFileId: result.fileId })
      toast('Image uploaded to ImageKit CDN ✓', 'success')
    } catch (err: any) {
      if (err.message?.includes('ImageKit environment')) {
        toast('ImageKit not configured — check backend .env', 'error')
      } else {
        toast(err.message || 'Upload failed', 'error')
      }
    } finally {
      setUploadingImg(null)
    }
  }

  const grouped = ['bank', 'card', 'crypto', 'digital'].map(cat => ({
    cat,
    items: methods.filter(m => m.category === cat)
  }))

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-xl font-bold">Deposit Method Settings</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted)' }}>
            Configure wallets, fees, images and instructions for each payment method
          </p>
        </div>
        <Button variant="primary" onClick={save} loading={saving}>
          <Save size={14} /> Save All Changes
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="shimmer h-24 rounded-2xl"/>)}</div>
      ) : (
        grouped.map(({ cat, items }) => items.length === 0 ? null : (
          <Card key={cat} className="p-4 sm:p-6">
            <h3 className="font-bold text-base mb-4">{CATEGORY_LABELS[cat]}</h3>
            <div className="space-y-3">
              {items.map(m => {
                const Icon = ICON_MAP[m.icon] || Building
                const isOpen = expanded === m.id
                return (
                  <div key={m.id} className="rounded-2xl border overflow-hidden"
                    style={{ borderColor: 'var(--color-border)' }}>

                    {/* Row header */}
                    <div className="flex items-center gap-3 p-3 sm:p-4"
                      style={{ background: 'var(--color-surface)' }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: m.enabled ? 'rgba(16,185,129,.1)' : 'var(--color-bg)' }}>
                        <Icon size={16} style={{ color: m.enabled ? '#10B981' : 'var(--color-muted)' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{m.label}</p>
                        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                          Fee: {m.feeType === 'percent' ? `${m.fee}%` : m.fee === '0' ? 'Free' : `$${m.fee}`}
                          {' · '}
                          <span style={{ color: m.enabled ? '#10B981' : '#EF4444' }}>
                            {m.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </p>
                      </div>
                      {/* Enable toggle */}
                      <button
                        onClick={() => update(m.id, { enabled: !m.enabled })}
                        className="text-xs px-3 py-1 rounded-full font-semibold border transition-all flex-shrink-0"
                        style={{
                          background:   m.enabled ? 'rgba(16,185,129,.1)'  : 'rgba(239,68,68,.08)',
                          borderColor:  m.enabled ? 'rgba(16,185,129,.3)'  : 'rgba(239,68,68,.3)',
                          color:        m.enabled ? '#059669' : '#EF4444',
                        }}>
                        {m.enabled ? 'Enabled' : 'Disabled'}
                      </button>
                      <button onClick={() => setExpanded(isOpen ? null : m.id)}
                        className="p-2 rounded-lg hover:opacity-70 flex-shrink-0"
                        style={{ background: 'var(--color-bg)' }}>
                        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>

                    {/* Edit panel */}
                    {isOpen && (
                      <div className="border-t p-4 space-y-5"
                        style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}>

                        {/* Basic settings */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <Input label="Display Label" value={m.label}
                            onChange={e => update(m.id, { label: e.target.value })} />
                          <div>
                            <label className="block text-sm font-semibold mb-1.5">Fee</label>
                            <div className="flex gap-2">
                              <input value={m.fee} onChange={e => update(m.id, { fee: e.target.value })}
                                className="flex-1 rounded-xl border px-3 py-2.5 text-sm font-mono outline-none"
                                style={{ background:'var(--color-surface)', borderColor:'var(--color-border)', color:'var(--color-text)' }}
                                placeholder="0" />
                              <select value={m.feeType} onChange={e => update(m.id, { feeType: e.target.value })}
                                className="rounded-xl border px-3 py-2.5 text-xs font-sans outline-none"
                                style={{ background:'var(--color-surface)', borderColor:'var(--color-border)', color:'var(--color-text)' }}>
                                <option value="fixed">$ Fixed</option>
                                <option value="percent">% Percent</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold mb-1.5">Category</label>
                            <select value={m.category} onChange={e => update(m.id, { category: e.target.value })}
                              className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-sans outline-none"
                              style={{ background:'var(--color-surface)', borderColor:'var(--color-border)', color:'var(--color-text)' }}>
                              <option value="bank">Bank</option>
                              <option value="card">Card</option>
                              <option value="crypto">Crypto</option>
                              <option value="digital">Digital Wallet</option>
                            </select>
                          </div>
                        </div>

                        {/* Instructions */}
                        <div>
                          <label className="block text-sm font-semibold mb-1.5">User Instructions</label>
                          <textarea rows={2} value={m.instructions}
                            onChange={e => update(m.id, { instructions: e.target.value })}
                            className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-sans outline-none resize-none"
                            style={{ background:'var(--color-surface)', borderColor:'var(--color-border)', color:'var(--color-text)' }}
                            placeholder="Instructions shown to the user…" />
                        </div>

                        {/* Detail fields */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-semibold">Details / Info Fields</label>
                            <button onClick={() => addDetailField(m.id)}
                              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors hover:opacity-80"
                              style={{ background:'rgba(16,185,129,.1)', color:'#059669' }}>
                              <Plus size={11} /> Add Field
                            </button>
                          </div>
                          <div className="space-y-2">
                            {Object.entries(m.details).map(([key, val]) => (
                              <div key={key} className="flex gap-2 items-center">
                                <input value={key}
                                  onChange={e => renameDetailKey(m.id, key, e.target.value)}
                                  className="w-32 sm:w-40 rounded-xl border px-3 py-2 text-xs font-semibold font-sans outline-none flex-shrink-0"
                                  style={{ background:'var(--color-surface)', borderColor:'var(--color-border)', color:'var(--color-muted)' }}
                                  placeholder="Field name" />
                                <input value={String(val)}
                                  onChange={e => updateDetail(m.id, key, e.target.value)}
                                  className="flex-1 rounded-xl border px-3 py-2 text-xs font-mono outline-none min-w-0"
                                  style={{ background:'var(--color-surface)', borderColor:'var(--color-border)', color:'var(--color-text)' }}
                                  placeholder="Value…" />
                                <button onClick={() => removeDetailField(m.id, key)}
                                  className="p-2 rounded-lg text-red-400 hover:bg-red-50 transition-colors flex-shrink-0">
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            ))}
                            {Object.keys(m.details).length === 0 && (
                              <p className="text-xs italic" style={{ color:'var(--color-muted)' }}>No detail fields — click "Add Field" to add wallet addresses, account numbers, etc.</p>
                            )}
                          </div>
                        </div>

                        <Divider />

                        {/* Image upload */}
                        <div>
                          <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                            <Image size={13} /> QR Code / Payment Image
                            <span className="text-xs font-normal" style={{ color:'var(--color-muted)' }}>(optional — shown on deposit page)</span>
                          </label>
                          {m.image ? (
                            <div className="flex items-start gap-3 flex-wrap">
                              <div className="relative">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={m.image} alt="Payment QR"
                                  className="w-32 h-32 object-contain rounded-xl border"
                                  style={{ borderColor:'var(--color-border)', background:'var(--color-surface)' }} />
                                <button onClick={() => update(m.id, { image: '' })}
                                  className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors">
                                  <X size={11} />
                                </button>
                              </div>
                              <Button variant="secondary" size="sm" onClick={() => { setUploadingFor(m.id); fileInputRef.current?.click() }}>
                                <Upload size={12} /> Replace Image
                              </Button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setUploadingFor(m.id); fileInputRef.current?.click() }}
                              className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed w-full text-left transition-all hover:opacity-80"
                              style={{ borderColor:'var(--color-border)' }}>
                              <Upload size={18} style={{ color:'var(--color-muted)' }} />
                              <div>
                                <p className="text-sm font-semibold">Upload QR code or image</p>
                                <p className="text-xs mt-0.5" style={{ color:'var(--color-muted)' }}>PNG, JPG, GIF up to 2MB</p>
                              </div>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>
        ))
      )}

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
        onChange={e => {
          const file = e.target.files?.[0]
          if (file && uploadingFor) {
            if (file.size > 5 * 1024 * 1024) { toast('Image must be under 5 MB', 'error'); return }
            handleImageUpload(uploadingFor, file)
          }
          e.target.value = ''
        }} />

      <div className="flex justify-end pb-6">
        <Button variant="primary" size="lg" onClick={save} loading={saving}>
          <Save size={15} /> Save All Changes
        </Button>
      </div>
    </div>
  )
}
