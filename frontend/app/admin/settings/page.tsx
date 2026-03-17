'use client'
import { useState } from 'react'
import { Card, Button, SectionHeader, Toggle, Divider } from '@/components/ui'
import { useAuth } from '@/store/auth'
import { Palette, Sun, Moon, Check } from 'lucide-react'

const ACCENT_PRESETS = ['#10B981','#3B82F6','#8B5CF6','#F59E0B','#EF4444','#EC4899','#14B8A6','#F97316']
const PRIMARY_PRESETS = ['#0F1C35','#1A2B4A','#1E293B','#111827','#312E81','#164E63','#44403C','#0F172A']

export default function AdminSettingsPage() {
  const { toast } = useAuth()
  const [accentColor, setAccentColor]   = useState('#10B981')
  const [primaryColor, setPrimaryColor] = useState('#0F1C35')
  const [appName, setAppName]           = useState('NexaBank')
  const [darkMode, setDarkMode]         = useState(false)
  const [tempName, setTempName]         = useState('NexaBank')

  const applyAccent = (c: string) => {
    setAccentColor(c)
    document.documentElement.style.setProperty('--color-accent', c)
    toast('Accent color updated', 'success')
  }
  const applyPrimary = (c: string) => {
    setPrimaryColor(c)
    document.documentElement.style.setProperty('--color-primary', c)
    toast('Primary color updated', 'success')
  }
  const applyName = () => {
    setAppName(tempName)
    document.title = `${tempName} — Personal Banking`
    toast(`App renamed to "${tempName}"`, 'success')
  }
  const toggleDark = () => {
    const next = !darkMode
    setDarkMode(next)
    if (next) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
    toast(`${next ? 'Dark' : 'Light'} mode enabled`, 'success')
  }

  return (
    <div className="max-w-4xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="space-y-5">
          {/* Identity */}
          <Card className="p-6">
            <SectionHeader title="App Identity" />
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5">App Name</label>
                <div className="flex gap-2">
                  <input value={tempName} onChange={e => setTempName(e.target.value)}
                    className="flex-1 rounded-xl border px-3.5 py-2.5 text-sm font-sans outline-none"
                    style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
                  <Button variant="primary" onClick={applyName}>Apply</Button>
                </div>
                <p className="text-xs mt-1.5" style={{ color: 'var(--color-muted)' }}>
                  Preview: <strong>{tempName}</strong>
                </p>
              </div>
            </div>
          </Card>

          {/* Colors */}
          <Card className="p-6">
            <SectionHeader title="Color Theme" sub="60/30/10 color rule" />
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Accent Color <span className="font-normal text-xs" style={{ color: 'var(--color-muted)' }}>(buttons & highlights)</span>
                </label>
                <div className="flex items-center gap-2 flex-wrap mt-2">
                  <input type="color" value={accentColor} onChange={e => applyAccent(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border-2 p-0.5"
                    style={{ borderColor: 'var(--color-border)' }} />
                  {ACCENT_PRESETS.map(c => (
                    <button key={c} onClick={() => applyAccent(c)}
                      className="w-7 h-7 rounded-full cursor-pointer border-[3px] transition-all flex items-center justify-center"
                      style={{ background: c, borderColor: accentColor === c ? 'var(--color-text)' : 'transparent' }}>
                      {accentColor === c && <Check size={11} color="#fff" strokeWidth={3} />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">
                  Sidebar Color <span className="font-normal text-xs" style={{ color: 'var(--color-muted)' }}>(sidebar & nav)</span>
                </label>
                <div className="flex items-center gap-2 flex-wrap mt-2">
                  <input type="color" value={primaryColor} onChange={e => applyPrimary(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border-2 p-0.5"
                    style={{ borderColor: 'var(--color-border)' }} />
                  {PRIMARY_PRESETS.map(c => (
                    <button key={c} onClick={() => applyPrimary(c)}
                      className="w-7 h-7 rounded-full cursor-pointer border-[3px] transition-all flex items-center justify-center"
                      style={{ background: c, borderColor: primaryColor === c ? accentColor : 'transparent' }}>
                      {primaryColor === c && <Check size={11} color="#fff" strokeWidth={3} />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Display */}
          <Card className="p-6">
            <SectionHeader title="Display Mode" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {darkMode ? <Moon size={18} /> : <Sun size={18} />}
                <div>
                  <p className="text-sm font-semibold">{darkMode ? 'Dark Mode' : 'Light Mode'}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>Toggle app appearance</p>
                </div>
              </div>
              <Toggle checked={darkMode} onChange={toggleDark} />
            </div>
          </Card>
        </div>

        {/* Live preview */}
        <Card className="p-6">
          <SectionHeader title="Live Preview" />
          <div className="rounded-2xl overflow-hidden border-2" style={{ borderColor: 'var(--color-border)' }}>
            {/* Fake sidebar header */}
            <div className="flex items-center gap-3 px-5 py-4" style={{ background: primaryColor }}>
              <span className="text-white font-bold text-base font-display">
                <span style={{ color: accentColor }}>{appName[0]}</span>{appName.slice(1)}
              </span>
            </div>

            {/* Fake page */}
            <div className="p-4 space-y-3" style={{ background: darkMode ? '#0F172A' : '#F0F2F7' }}>
              {/* Balance card */}
              <div className="rounded-xl p-5" style={{ background: primaryColor }}>
                <p className="text-white/50 text-xs mb-1">Available Balance</p>
                <p className="text-white text-2xl font-bold font-mono">$12,840.50</p>
              </div>

              {/* Quick actions */}
              <div className="grid grid-cols-3 gap-2">
                {['Deposit','Send','Withdraw'].map(a => (
                  <div key={a} className="rounded-xl p-3 flex flex-col items-center gap-1.5"
                    style={{ background: darkMode ? '#1E293B' : '#fff', border: '1px solid var(--color-border)' }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: accentColor + '25' }}>
                      <div className="w-2 h-2 rounded-full" style={{ background: accentColor }} />
                    </div>
                    <span className="text-[10px] font-semibold" style={{ color: darkMode ? '#94A3B8' : '#6B7A99' }}>{a}</span>
                  </div>
                ))}
              </div>

              {/* Button */}
              <div className="rounded-xl py-2.5 text-center text-sm font-bold text-white" style={{ background: accentColor }}>
                Primary Button
              </div>

              {/* Fake tx row */}
              <div className="rounded-xl p-3 flex items-center gap-3" style={{ background: darkMode ? '#1E293B' : '#fff' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-100">
                  <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold" style={{ color: darkMode ? '#E2E8F0' : '#0F1C35' }}>Salary Deposit</p>
                  <p className="text-[10px]" style={{ color: darkMode ? '#64748B' : '#6B7A99' }}>Jan 15, 2025</p>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-500">+$3,500</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-center mt-4" style={{ color: 'var(--color-muted)' }}>
            Changes apply instantly across the entire app
          </p>
        </Card>
      </div>
    </div>
  )
}
