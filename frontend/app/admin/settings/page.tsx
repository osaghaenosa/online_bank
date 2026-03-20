'use client'
import { useState, useEffect, useRef } from 'react'
import { Card, Button, SectionHeader, Toggle, Divider, Input } from '@/components/ui'
import { useAuth } from '@/store/auth'
import { api } from '@/lib/api'
import {
  Palette, Sun, Moon, Check, Plus, Trash2, Edit, Upload,
  Image as ImageIcon, DollarSign, Bitcoin, Building, CreditCard,
  Save, ChevronDown, ChevronUp, X
} from 'lucide-react'

const ACCENT_PRESETS  = ['#10B981','#3B82F6','#8B5CF6','#F59E0B','#EF4444','#EC4899','#14B8A6','#F97316']
const PRIMARY_PRESETS = ['#0F1C35','#1A2B4A','#1E293B','#111827','#312E81','#164E63','#44403C','#0F172A']

const DEFAULT_DEPOSIT_METHODS = [
  { id:'bank_transfer', label:'Bank Transfer',   icon:'🏦', fee:0,    feeType:'fixed',   enabled:true,  accountName:'', accountNumber:'', routingNumber:'', bankName:'', instructions:'' },
  { id:'wire',          label:'Wire Transfer',   icon:'⚡', fee:15,   feeType:'fixed',   enabled:true,  accountName:'', swiftCode:'', iban:'', bankAddress:'', instructions:'' },
  { id:'ach',           label:'ACH Transfer',    icon:'🏛', fee:0,    feeType:'fixed',   enabled:true,  accountName:'', accountNumber:'', routingNumber:'', instructions:'' },
  { id:'card',          label:'Credit/Debit Card',icon:'💳',fee:2.5,  feeType:'percent', enabled:true,  instructions:'Card payments processed securely via Stripe.' },
  { id:'crypto_btc',    label:'Bitcoin (BTC)',   icon:'₿',  fee:2.50, feeType:'fixed',   enabled:true,  walletAddress:'', network:'Bitcoin', qrImage:'', instructions:'Send BTC to the address below. Minimum 2 confirmations required.' },
  { id:'crypto_eth',    label:'Ethereum (ETH)',  icon:'Ξ',  fee:2.50, feeType:'fixed',   enabled:true,  walletAddress:'', network:'ERC-20',  qrImage:'', instructions:'Send ETH to the address below. Minimum 12 confirmations required.' },
  { id:'crypto_usdt',   label:'USDT (TRC-20)',   icon:'₮',  fee:1.00, feeType:'fixed',   enabled:true,  walletAddress:'', network:'TRC-20',  qrImage:'', instructions:'Send USDT (TRC-20) to the address below.' },
  { id:'crypto_bnb',    label:'BNB',             icon:'⬡',  fee:2.50, feeType:'fixed',   enabled:true,  walletAddress:'', network:'BEP-20',  qrImage:'', instructions:'' },
  { id:'crypto_sol',    label:'Solana (SOL)',     icon:'◎',  fee:2.50, feeType:'fixed',   enabled:true,  walletAddress:'', network:'Solana',  qrImage:'', instructions:'' },
  { id:'paypal',        label:'PayPal',          icon:'🅿', fee:0,    feeType:'fixed',   enabled:true,  paypalEmail:'', instructions:'' },
  { id:'cashapp',       label:'Cash App',        icon:'💚', fee:0,    feeType:'fixed',   enabled:true,  cashTag:'', instructions:'' },
  { id:'venmo',         label:'Venmo',           icon:'💙', fee:0,    feeType:'fixed',   enabled:true,  venmoHandle:'', instructions:'' },
  { id:'zelle',         label:'Zelle',           icon:'💜', fee:0,    feeType:'fixed',   enabled:true,  zelleEmail:'', instructions:'' },
]

const DEFAULT_WITHDRAWAL_METHODS = [
  { id:'ach',         label:'ACH Transfer',    icon:'🏛', fee:0,    feeType:'fixed',   enabled:true,  processingTime:'1–3 business days', instructions:'' },
  { id:'wire',        label:'Wire Transfer',   icon:'⚡', fee:25,   feeType:'fixed',   enabled:true,  processingTime:'Same day',           instructions:'' },
  { id:'card',        label:'Debit Card',      icon:'💳', fee:1.50, feeType:'fixed',   enabled:true,  processingTime:'Instant',            instructions:'' },
  { id:'crypto_btc',  label:'Bitcoin (BTC)',   icon:'₿',  fee:5,    feeType:'fixed',   enabled:true,  processingTime:'10–60 min',          instructions:'' },
  { id:'crypto_eth',  label:'Ethereum (ETH)',  icon:'Ξ',  fee:5,    feeType:'fixed',   enabled:true,  processingTime:'10–30 min',          instructions:'' },
  { id:'crypto_usdt', label:'USDT',            icon:'₮',  fee:1,    feeType:'fixed',   enabled:true,  processingTime:'5–15 min',           instructions:'' },
  { id:'crypto_sol',  label:'Solana (SOL)',     icon:'◎',  fee:5,    feeType:'fixed',   enabled:true,  processingTime:'5–10 min',           instructions:'' },
]

export default function AdminSettingsPage() {
  const { toast } = useAuth()
  const [accentColor,  setAccentColor]  = useState('#10B981')
  const [primaryColor, setPrimaryColor] = useState('#0F1C35')
  const [tempName,     setTempName]     = useState('NexaBank')
  const [darkMode,     setDarkMode]     = useState(false)
  const [activeTab,    setActiveTab]    = useState<'branding'|'deposit'|'withdrawal'>('branding')
  const [depositMethods,    setDeposit]    = useState<any[]>(DEFAULT_DEPOSIT_METHODS)
  const [withdrawalMethods, setWithdrawal] = useState<any[]>(DEFAULT_WITHDRAWAL_METHODS)
  const [expandedId,   setExpandedId]   = useState<string|null>(null)
  const [savingMethods, setSavingMethods] = useState(false)
  const fileInputRef  = useRef<HTMLInputElement>(null)
  const [uploadingFor,  setUploadingFor]  = useState<string|null>(null)
  const [uploadingQR,   setUploadingQR]   = useState<string|null>(null) // methodId being uploaded

  useEffect(() => {
    api.admin.getDepositSettings().then(d => { if (d.settings) setDeposit(d.settings) }).catch(() => {})
    api.admin.getWithdrawalSettings().then(d => { if (d.settings) setWithdrawal(d.settings) }).catch(() => {})
  }, [])

  const applyAccent  = (c: string) => { setAccentColor(c);  document.documentElement.style.setProperty('--color-accent', c);   toast('Accent color updated', 'success') }
  const applyPrimary = (c: string) => { setPrimaryColor(c); document.documentElement.style.setProperty('--color-primary', c);  toast('Primary color updated', 'success') }
  const applyName    = () => { document.title = `${tempName} — Personal Banking`; toast(`App renamed to "${tempName}"`, 'success') }
  const toggleDark   = () => {
    const next = !darkMode; setDarkMode(next)
    if (next) document.documentElement.classList.add('dark')
    else      document.documentElement.classList.remove('dark')
    toast(`${next ? 'Dark' : 'Light'} mode enabled`, 'success')
  }

  const updateDepositField = (id: string, field: string, value: any) => {
    setDeposit(p => p.map(m => m.id === id ? { ...m, [field]: value } : m))
  }
  const updateWithdrawalField = (id: string, field: string, value: any) => {
    setWithdrawal(p => p.map(m => m.id === id ? { ...m, [field]: value } : m))
  }

  const handleImageUpload = async (methodId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast('Image must be under 5 MB', 'error'); return }

    // Show local preview immediately while uploading
    const reader = new FileReader()
    reader.onload = ev => updateDepositField(methodId, 'qrImage', ev.target?.result as string)
    reader.readAsDataURL(file)

    setUploadingQR(methodId)
    try {
      const result = await api.admin.uploadImage(file, 'nexabank/qrcodes', 'qr_' + methodId)
      // Replace the local preview with the real ImageKit CDN URL
      updateDepositField(methodId, 'qrImage',   result.url)
      updateDepositField(methodId, 'qrFileId',  result.fileId)
      toast('QR code uploaded to ImageKit ✓', 'success')
    } catch (err: any) {
      if (err.message?.includes('ImageKit environment')) {
        toast('ImageKit not configured — set keys in backend .env', 'error')
      } else {
        toast(err.message || 'Upload failed', 'error')
      }
      // Keep the local preview as fallback
    } finally {
      setUploadingQR(null)
    }
  }

  const saveDepositMethods = async () => {
    setSavingMethods(true)
    try {
      await api.admin.saveDepositSettings({ methods: depositMethods })
      toast('Deposit methods saved', 'success')
    } catch (err: any) { toast(err.message, 'error') }
    finally { setSavingMethods(false) }
  }

  const saveWithdrawalMethods = async () => {
    setSavingMethods(true)
    try {
      await api.admin.saveWithdrawalSettings({ methods: withdrawalMethods })
      toast('Withdrawal methods saved', 'success')
    } catch (err: any) { toast(err.message, 'error') }
    finally { setSavingMethods(false) }
  }

  const TABS = [
    { id: 'branding',    label: 'Branding' },
    { id: 'deposit',     label: 'Deposit Methods' },
    { id: 'withdrawal',  label: 'Withdrawal Methods' },
  ] as const

  return (
    <div className="space-y-5">
      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-xl overflow-x-auto scrollbar-none"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)}
            className="px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0"
            style={{
              background: activeTab === t.id ? '#0F1C35' : 'transparent',
              color: activeTab === t.id ? '#fff' : 'var(--color-muted)',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── BRANDING ─────────────────────────────────────────────── */}
      {activeTab === 'branding' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Card className="p-5">
            <SectionHeader title="App Name" />
            <div className="flex gap-2">
              <input value={tempName} onChange={e => setTempName(e.target.value)}
                className="flex-1 rounded-xl border px-3.5 py-2.5 text-sm font-sans outline-none"
                style={{ background:'var(--color-surface)', borderColor:'var(--color-border)', color:'var(--color-text)' }}/>
              <Button variant="primary" size="sm" onClick={applyName}><Check size={14}/></Button>
            </div>
          </Card>

          <Card className="p-5">
            <SectionHeader title="Dark Mode" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {darkMode ? <Moon size={16}/> : <Sun size={16}/>}
                <span className="text-sm font-medium">{darkMode ? 'Dark' : 'Light'} Mode</span>
              </div>
              <Toggle checked={darkMode} onChange={toggleDark}/>
            </div>
          </Card>

          <Card className="p-5">
            <SectionHeader title="Accent Color" sub="Button & link color" />
            <div className="flex gap-2 flex-wrap mb-3">
              {ACCENT_PRESETS.map(c => (
                <button key={c} onClick={() => applyAccent(c)}
                  className="w-8 h-8 rounded-full border-2 transition-all"
                  style={{ background: c, borderColor: accentColor === c ? '#fff' : 'transparent', outline: accentColor === c ? `2px solid ${c}` : 'none' }}/>
              ))}
            </div>
            <div className="flex gap-2 items-center">
              <input type="color" value={accentColor} onChange={e => applyAccent(e.target.value)}
                className="w-10 h-10 rounded-xl border cursor-pointer" style={{ borderColor:'var(--color-border)' }}/>
              <span className="text-sm font-mono">{accentColor}</span>
            </div>
          </Card>

          <Card className="p-5">
            <SectionHeader title="Primary Color" sub="Sidebar & header color" />
            <div className="flex gap-2 flex-wrap mb-3">
              {PRIMARY_PRESETS.map(c => (
                <button key={c} onClick={() => applyPrimary(c)}
                  className="w-8 h-8 rounded-full border-2 transition-all"
                  style={{ background: c, borderColor: primaryColor === c ? '#fff' : 'transparent', outline: primaryColor === c ? `2px solid ${c}` : 'none' }}/>
              ))}
            </div>
            <div className="flex gap-2 items-center">
              <input type="color" value={primaryColor} onChange={e => applyPrimary(e.target.value)}
                className="w-10 h-10 rounded-xl border cursor-pointer" style={{ borderColor:'var(--color-border)' }}/>
              <span className="text-sm font-mono">{primaryColor}</span>
            </div>
          </Card>
        </div>
      )}

      {/* ── DEPOSIT METHODS ───────────────────────────────────────── */}
      {activeTab === 'deposit' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-bold">Deposit Methods</h3>
              <p className="text-xs mt-0.5" style={{ color:'var(--color-muted)' }}>
                Configure wallet addresses, fees, QR codes and instructions for each deposit method.
              </p>
            </div>
            <Button variant="primary" onClick={saveDepositMethods} loading={savingMethods}>
              <Save size={14}/> Save All Changes
            </Button>
          </div>

          {depositMethods.map(m => {
            const isOpen = expandedId === m.id
            const isCrypto = m.id.startsWith('crypto_')
            return (
              <Card key={m.id} className="overflow-hidden">
                {/* Header row */}
                <div className="flex items-center gap-3 p-4 cursor-pointer"
                  onClick={() => setExpandedId(isOpen ? null : m.id)}>
                  <span className="text-xl w-8 text-center">{m.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{m.label}</p>
                    <p className="text-xs" style={{ color:'var(--color-muted)' }}>
                      Fee: {m.feeType === 'percent' ? `${m.fee}%` : `$${m.fee}`}
                      {isCrypto && m.walletAddress ? ` · ${m.walletAddress.slice(0,12)}…` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div onClick={e => e.stopPropagation()}>
                      <Toggle checked={m.enabled} onChange={() => updateDepositField(m.id, 'enabled', !m.enabled)}/>
                    </div>
                    {isOpen ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                  </div>
                </div>

                {/* Detail panel */}
                {isOpen && (
                  <div className="border-t p-4 space-y-4" style={{ borderColor:'var(--color-border)', background:'var(--color-bg)' }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold mb-1.5">Display Label</label>
                        <input value={m.label} onChange={e => updateDepositField(m.id,'label',e.target.value)}
                          className="w-full rounded-xl border px-3 py-2 text-sm font-sans outline-none"
                          style={{ background:'var(--color-surface)', borderColor:'var(--color-border)', color:'var(--color-text)' }}/>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1.5">Icon / Emoji</label>
                        <input value={m.icon} onChange={e => updateDepositField(m.id,'icon',e.target.value)}
                          className="w-full rounded-xl border px-3 py-2 text-sm font-sans outline-none"
                          style={{ background:'var(--color-surface)', borderColor:'var(--color-border)', color:'var(--color-text)' }}/>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1.5">Fee Amount</label>
                        <input type="number" min="0" step="0.01" value={m.fee}
                          onChange={e => updateDepositField(m.id,'fee',parseFloat(e.target.value)||0)}
                          className="w-full rounded-xl border px-3 py-2 text-sm font-mono outline-none"
                          style={{ background:'var(--color-surface)', borderColor:'var(--color-border)', color:'var(--color-text)' }}/>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1.5">Fee Type</label>
                        <select value={m.feeType} onChange={e => updateDepositField(m.id,'feeType',e.target.value)}
                          className="w-full rounded-xl border px-3 py-2 text-sm font-sans outline-none"
                          style={{ background:'var(--color-surface)', borderColor:'var(--color-border)', color:'var(--color-text)' }}>
                          <option value="fixed">Fixed ($)</option>
                          <option value="percent">Percentage (%)</option>
                        </select>
                      </div>
                    </div>

                    {/* Crypto-specific fields */}
                    {isCrypto && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold mb-1.5">Wallet Address</label>
                          <input value={m.walletAddress||''} onChange={e => updateDepositField(m.id,'walletAddress',e.target.value)}
                            placeholder="Enter wallet address..."
                            className="w-full rounded-xl border px-3 py-2 text-sm font-mono outline-none"
                            style={{ background:'var(--color-surface)', borderColor:'var(--color-border)', color:'var(--color-text)' }}/>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1.5">Network</label>
                          <input value={m.network||''} onChange={e => updateDepositField(m.id,'network',e.target.value)}
                            placeholder="e.g. Bitcoin, ERC-20, TRC-20"
                            className="w-full rounded-xl border px-3 py-2 text-sm font-sans outline-none"
                            style={{ background:'var(--color-surface)', borderColor:'var(--color-border)', color:'var(--color-text)' }}/>
                        </div>
                        {/* QR image upload — ImageKit */}
                        <div>
                          <label className="block text-xs font-semibold mb-1.5">QR Code Image</label>
                          <div className="flex items-start gap-3">
                            {/* Preview */}
                            <div className="relative flex-shrink-0">
                              {m.qrImage ? (
                                <>
                                  <img src={m.qrImage} alt="QR"
                                    className="w-20 h-20 rounded-xl object-cover border-2"
                                    style={{ borderColor: uploadingQR === m.id ? 'var(--color-accent)' : 'var(--color-border)' }}/>
                                  {uploadingQR === m.id && (
                                    <div className="absolute inset-0 rounded-xl bg-black/40 flex items-center justify-center">
                                      <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"/>
                                    </div>
                                  )}
                                  {uploadingQR !== m.id && (
                                    <button onClick={() => { updateDepositField(m.id,'qrImage',''); updateDepositField(m.id,'qrFileId','') }}
                                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors">
                                      <X size={10} className="text-white"/>
                                    </button>
                                  )}
                                </>
                              ) : (
                                <div className="w-20 h-20 rounded-xl border-2 border-dashed flex items-center justify-center"
                                  style={{ borderColor:'var(--color-border)' }}>
                                  {uploadingQR === m.id
                                    ? <div className="w-5 h-5 border-2 border-emerald-400/40 border-t-emerald-400 rounded-full animate-spin"/>
                                    : <ImageIcon size={20} style={{ color:'var(--color-muted)' }}/>
                                  }
                                </div>
                              )}
                            </div>

                            {/* Upload controls */}
                            <div className="flex-1 min-w-0">
                              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif"
                                className="hidden"
                                id={`qr-file-${m.id}`}
                                onChange={e => handleImageUpload(m.id, e)}/>
                              <Button variant="secondary" size="sm"
                                loading={uploadingQR === m.id}
                                onClick={() => document.getElementById(`qr-file-${m.id}`)?.click()}>
                                <Upload size={13}/>
                                {uploadingQR === m.id ? 'Uploading…' : m.qrImage ? 'Replace QR' : 'Upload QR'}
                              </Button>
                              <p className="text-xs mt-1.5" style={{ color:'var(--color-muted)' }}>
                                JPEG, PNG, WebP · max 5 MB
                              </p>
                              {/* ImageKit badge */}
                              <div className="flex items-center gap-1.5 mt-2">
                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">IK</span>
                                <span className="text-[10px]" style={{ color:'var(--color-muted)' }}>
                                  {m.qrImage && !m.qrImage.startsWith('data:')
                                    ? 'Stored on ImageKit CDN ✓'
                                    : 'Will upload to ImageKit CDN'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Bank transfer fields */}
                    {(m.id === 'bank_transfer' || m.id === 'ach') && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold mb-1.5">Account Name</label>
                          <input value={m.accountName||''} onChange={e => updateDepositField(m.id,'accountName',e.target.value)}
                            className="w-full rounded-xl border px-3 py-2 text-sm outline-none font-sans"
                            style={{ background:'var(--color-surface)', borderColor:'var(--color-border)', color:'var(--color-text)' }}/>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1.5">Bank Name</label>
                          <input value={m.bankName||''} onChange={e => updateDepositField(m.id,'bankName',e.target.value)}
                            className="w-full rounded-xl border px-3 py-2 text-sm outline-none font-sans"
                            style={{ background:'var(--color-surface)', borderColor:'var(--color-border)', color:'var(--color-text)' }}/>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1.5">Account Number</label>
                          <input value={m.accountNumber||''} onChange={e => updateDepositField(m.id,'accountNumber',e.target.value)}
                            className="w-full rounded-xl border px-3 py-2 text-sm font-mono outline-none"
                            style={{ background:'var(--color-surface)', borderColor:'var(--color-border)', color:'var(--color-text)' }}/>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1.5">Routing Number</label>
                          <input value={m.routingNumber||''} onChange={e => updateDepositField(m.id,'routingNumber',e.target.value)}
                            className="w-full rounded-xl border px-3 py-2 text-sm font-mono outline-none"
                            style={{ background:'var(--color-surface)', borderColor:'var(--color-border)', color:'var(--color-text)' }}/>
                        </div>
                      </div>
                    )}

                    {/* PayPal */}
                    {m.id === 'paypal' && (
                      <div>
                        <label className="block text-xs font-semibold mb-1.5">PayPal Email / Link</label>
                        <input value={m.paypalEmail||''} onChange={e => updateDepositField(m.id,'paypalEmail',e.target.value)}
                          placeholder="paypal@example.com"
                          className="w-full rounded-xl border px-3 py-2 text-sm outline-none font-sans"
                          style={{ background:'var(--color-surface)', borderColor:'var(--color-border)', color:'var(--color-text)' }}/>
                      </div>
                    )}
                    {m.id === 'cashapp' && (
                      <div>
                        <label className="block text-xs font-semibold mb-1.5">Cash App $Cashtag</label>
                        <input value={m.cashTag||''} onChange={e => updateDepositField(m.id,'cashTag',e.target.value)}
                          placeholder="$YourCashTag"
                          className="w-full rounded-xl border px-3 py-2 text-sm outline-none font-sans"
                          style={{ background:'var(--color-surface)', borderColor:'var(--color-border)', color:'var(--color-text)' }}/>
                      </div>
                    )}
                    {m.id === 'venmo' && (
                      <div>
                        <label className="block text-xs font-semibold mb-1.5">Venmo @handle</label>
                        <input value={m.venmoHandle||''} onChange={e => updateDepositField(m.id,'venmoHandle',e.target.value)}
                          placeholder="@YourVenmo"
                          className="w-full rounded-xl border px-3 py-2 text-sm outline-none font-sans"
                          style={{ background:'var(--color-surface)', borderColor:'var(--color-border)', color:'var(--color-text)' }}/>
                      </div>
                    )}
                    {m.id === 'zelle' && (
                      <div>
                        <label className="block text-xs font-semibold mb-1.5">Zelle Email / Phone</label>
                        <input value={m.zelleEmail||''} onChange={e => updateDepositField(m.id,'zelleEmail',e.target.value)}
                          placeholder="zelle@example.com"
                          className="w-full rounded-xl border px-3 py-2 text-sm outline-none font-sans"
                          style={{ background:'var(--color-surface)', borderColor:'var(--color-border)', color:'var(--color-text)' }}/>
                      </div>
                    )}

                    {/* Instructions */}
                    <div>
                      <label className="block text-xs font-semibold mb-1.5">Instructions shown to user</label>
                      <textarea rows={3} value={m.instructions||''} onChange={e => updateDepositField(m.id,'instructions',e.target.value)}
                        placeholder="Any instructions for the user..."
                        className="w-full rounded-xl border px-3 py-2.5 text-sm font-sans outline-none resize-none"
                        style={{ background:'var(--color-surface)', borderColor:'var(--color-border)', color:'var(--color-text)' }}/>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}

          <Button variant="primary" className="w-full justify-center" onClick={saveDepositMethods} loading={savingMethods}>
            <Save size={14}/> Save Deposit Method Settings
          </Button>
        </div>
      )}

      {/* ── WITHDRAWAL METHODS ─────────────────────────────────────── */}
      {activeTab === 'withdrawal' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-bold">Withdrawal Methods</h3>
              <p className="text-xs mt-0.5" style={{ color:'var(--color-muted)' }}>
                Configure fees and processing times for each withdrawal method.
              </p>
            </div>
            <Button variant="primary" onClick={saveWithdrawalMethods} loading={savingMethods}>
              <Save size={14}/> Save All Changes
            </Button>
          </div>

          {withdrawalMethods.map(m => {
            const isOpen = expandedId === m.id + '_wd'
            return (
              <Card key={m.id} className="overflow-hidden">
                <div className="flex items-center gap-3 p-4 cursor-pointer"
                  onClick={() => setExpandedId(isOpen ? null : m.id + '_wd')}>
                  <span className="text-xl w-8 text-center">{m.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{m.label}</p>
                    <p className="text-xs" style={{ color:'var(--color-muted)' }}>
                      Fee: {m.feeType === 'percent' ? `${m.fee}%` : `$${m.fee}`} · {m.processingTime}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div onClick={e => e.stopPropagation()}>
                      <Toggle checked={m.enabled} onChange={() => updateWithdrawalField(m.id,'enabled',!m.enabled)}/>
                    </div>
                    {isOpen ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t p-4 space-y-3" style={{ borderColor:'var(--color-border)', background:'var(--color-bg)' }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold mb-1.5">Display Label</label>
                        <input value={m.label} onChange={e => updateWithdrawalField(m.id,'label',e.target.value)}
                          className="w-full rounded-xl border px-3 py-2 text-sm font-sans outline-none"
                          style={{ background:'var(--color-surface)', borderColor:'var(--color-border)', color:'var(--color-text)' }}/>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1.5">Processing Time</label>
                        <input value={m.processingTime||''} onChange={e => updateWithdrawalField(m.id,'processingTime',e.target.value)}
                          placeholder="e.g. 1–3 business days"
                          className="w-full rounded-xl border px-3 py-2 text-sm font-sans outline-none"
                          style={{ background:'var(--color-surface)', borderColor:'var(--color-border)', color:'var(--color-text)' }}/>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1.5">Fee Amount</label>
                        <input type="number" min="0" step="0.01" value={m.fee}
                          onChange={e => updateWithdrawalField(m.id,'fee',parseFloat(e.target.value)||0)}
                          className="w-full rounded-xl border px-3 py-2 text-sm font-mono outline-none"
                          style={{ background:'var(--color-surface)', borderColor:'var(--color-border)', color:'var(--color-text)' }}/>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1.5">Fee Type</label>
                        <select value={m.feeType} onChange={e => updateWithdrawalField(m.id,'feeType',e.target.value)}
                          className="w-full rounded-xl border px-3 py-2 text-sm font-sans outline-none"
                          style={{ background:'var(--color-surface)', borderColor:'var(--color-border)', color:'var(--color-text)' }}>
                          <option value="fixed">Fixed ($)</option>
                          <option value="percent">Percentage (%)</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5">Instructions / Notes</label>
                      <textarea rows={2} value={m.instructions||''} onChange={e => updateWithdrawalField(m.id,'instructions',e.target.value)}
                        className="w-full rounded-xl border px-3 py-2.5 text-sm font-sans outline-none resize-none"
                        style={{ background:'var(--color-surface)', borderColor:'var(--color-border)', color:'var(--color-text)' }}/>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}

          <Button variant="primary" className="w-full justify-center" onClick={saveWithdrawalMethods} loading={savingMethods}>
            <Save size={14}/> Save Withdrawal Method Settings
          </Button>
        </div>
      )}
    </div>
  )
}
