'use client'
import { useState, useRef } from 'react'
import { useStore } from '@/store'
import { Card, Button, Input, SectionHeader, Toggle, Divider } from '@/components/ui'
import { Upload } from 'lucide-react'

const ACCENT_PRESETS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6', '#F97316']
const PRIMARY_PRESETS = ['#1A2B4A', '#1E293B', '#111827', '#1F2937', '#312E81', '#164E63', '#44403C', '#0F172A']

export default function AdminSettingsPage() {
  const { state, dispatch, toast } = useStore()
  const { theme } = state
  const [tempName, setTempName] = useState(theme.appName)
  const fileRef = useRef<HTMLInputElement>(null)

  const applyName = () => {
    dispatch({ type: 'SET_THEME', patch: { appName: tempName } })
    toast(`App renamed to "${tempName}"`, 'success')
  }

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      dispatch({ type: 'SET_THEME', patch: { logo: ev.target?.result as string } })
      toast('Logo updated successfully!', 'success')
    }
    reader.readAsDataURL(file)
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
                  <input
                    className="flex-1 rounded-xl border px-3.5 py-2.5 text-sm font-sans outline-none"
                    style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                    value={tempName}
                    onChange={e => setTempName(e.target.value)}
                  />
                  <Button variant="primary" onClick={applyName} accentColor={theme.accentColor}>Apply</Button>
                </div>
                <p className="text-xs mt-1.5" style={{ color: 'var(--color-muted)' }}>
                  Preview: <strong>{tempName}</strong>
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5">Logo</label>
                <div className="flex items-center gap-3">
                  {theme.logo && (
                    <img src={theme.logo} alt="logo" className="h-10 rounded-lg object-contain" />
                  )}
                  <input
                    type="file"
                    ref={fileRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogo}
                  />
                  <Button variant="secondary" onClick={() => fileRef.current?.click()}>
                    <Upload size={14} /> Upload Logo
                  </Button>
                  {theme.logo && (
                    <Button variant="secondary" size="sm" onClick={() => dispatch({ type: 'SET_THEME', patch: { logo: null } })}>
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Colors */}
          <Card className="p-6">
            <SectionHeader title="Color Theme (60/30/10)" />

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Accent Color <span className="font-normal text-xs" style={{ color: 'var(--color-muted)' }}>(10% — buttons & highlights)</span>
                </label>
                <div className="flex items-center gap-2 flex-wrap mt-2">
                  <input
                    type="color"
                    value={theme.accentColor}
                    onChange={e => dispatch({ type: 'SET_THEME', patch: { accentColor: e.target.value } })}
                    className="w-10 h-10 rounded-lg cursor-pointer border-2 p-0.5"
                    style={{ borderColor: 'var(--color-border)' }}
                  />
                  {ACCENT_PRESETS.map(c => (
                    <button
                      key={c}
                      onClick={() => {
                        dispatch({ type: 'SET_THEME', patch: { accentColor: c } })
                        toast(`Accent color updated`, 'success')
                      }}
                      className="w-7 h-7 rounded-full cursor-pointer border-[3px] transition-all"
                      style={{
                        background: c,
                        borderColor: theme.accentColor === c ? 'var(--color-text)' : 'transparent',
                      }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">
                  Sidebar Color <span className="font-normal text-xs" style={{ color: 'var(--color-muted)' }}>(30% — sidebar & cards)</span>
                </label>
                <div className="flex items-center gap-2 flex-wrap mt-2">
                  <input
                    type="color"
                    value={theme.primaryColor}
                    onChange={e => dispatch({ type: 'SET_THEME', patch: { primaryColor: e.target.value } })}
                    className="w-10 h-10 rounded-lg cursor-pointer border-2 p-0.5"
                    style={{ borderColor: 'var(--color-border)' }}
                  />
                  {PRIMARY_PRESETS.map(c => (
                    <button
                      key={c}
                      onClick={() => {
                        dispatch({ type: 'SET_THEME', patch: { primaryColor: c } })
                        toast(`Primary color updated`, 'success')
                      }}
                      className="w-7 h-7 rounded-full cursor-pointer border-[3px] transition-all"
                      style={{
                        background: c,
                        borderColor: theme.primaryColor === c ? 'var(--color-accent)' : 'transparent',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Dark mode */}
          <Card className="p-6">
            <SectionHeader title="Display Mode" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{theme.darkMode ? 'Dark Mode' : 'Light Mode'}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>Toggle app appearance</p>
              </div>
              <Toggle
                checked={theme.darkMode}
                accentColor={theme.accentColor}
                onChange={() => {
                  dispatch({ type: 'SET_THEME', patch: { darkMode: !theme.darkMode } })
                  toast(`${!theme.darkMode ? 'Dark' : 'Light'} mode enabled`, 'success')
                }}
              />
            </div>
          </Card>
        </div>

        {/* Live Preview */}
        <Card className="p-6">
          <SectionHeader title="Live Preview" />
          <div className="rounded-2xl overflow-hidden border-2" style={{ borderColor: 'var(--color-border)' }}>
            {/* Fake sidebar header */}
            <div
              className="flex items-center gap-3 px-5 py-4"
              style={{ background: theme.primaryColor }}
            >
              {theme.logo && <img src={theme.logo} alt="" className="h-7 object-contain" />}
              <span className="text-white font-bold text-base">
                <span style={{ color: theme.accentColor }}>{theme.appName[0]}</span>
                {theme.appName.slice(1)}
              </span>
            </div>

            {/* Fake page */}
            <div className="p-4 space-y-3" style={{ background: theme.darkMode ? '#0F172A' : '#F2F4F7' }}>
              {/* Balance card */}
              <div
                className="rounded-xl p-5"
                style={{ background: theme.primaryColor }}
              >
                <p className="text-white/50 text-xs mb-1">Available Balance</p>
                <p className="text-white text-2xl font-bold font-mono">$12,840.50</p>
              </div>

              {/* Quick actions */}
              <div className="grid grid-cols-3 gap-2">
                {['Deposit', 'Send', 'Withdraw'].map(a => (
                  <div
                    key={a}
                    className="rounded-xl p-3 flex flex-col items-center gap-1.5"
                    style={{ background: theme.darkMode ? '#1E293B' : '#fff', border: '1px solid var(--color-border)' }}
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: theme.accentColor + '25' }}>
                      <div className="w-2 h-2 rounded-full" style={{ background: theme.accentColor }} />
                    </div>
                    <span className="text-[10px] font-semibold" style={{ color: theme.darkMode ? '#94A3B8' : '#6B7A99' }}>{a}</span>
                  </div>
                ))}
              </div>

              {/* Button */}
              <div
                className="rounded-xl py-2.5 text-center text-sm font-bold text-white"
                style={{ background: theme.accentColor }}
              >
                Primary Button
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
