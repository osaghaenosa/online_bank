'use client'
import { useEffect, useRef, useState } from 'react'
import { MessageCircle, X, Send, ChevronDown } from 'lucide-react'
import { useChat } from '@/hooks/useChat'
import { api } from '@/lib/api'
import { useAuth } from '@/store/auth'

export function ChatWidget() {
  const { user } = useAuth()
  const [open,        setOpen]       = useState(false)
  const [input,       setInput]      = useState('')
  const [hasUnread,   setHasUnread]  = useState(false)
  const [unreadCount, setUnreadCount]= useState(0)
  const [token,       setToken]      = useState<string|null>(null)
  const [mounted,     setMounted]    = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)

  // ── Read token client-side only (avoids hydration mismatch) ──────────────
  useEffect(() => {
    setMounted(true)
    setToken(localStorage.getItem('nexabank_token'))
  }, [])

  const { messages, connected, typingInfo, sendMessage, sendTyping, loadHistory } = useChat({
    token,
    role: 'user',
    onNewMessage: (msg) => {
      if (!open && msg.senderRole === 'admin') {
        setHasUnread(true)
        setUnreadCount(c => c + 1)
      }
    }
  })

  useEffect(() => {
    if (!token) return
    api.chat.history()
      .then(d => loadHistory(d.messages || []))
      .catch(() => {})
  }, [token])

  useEffect(() => {
    if (open) {
      setHasUnread(false)
      setUnreadCount(0)
      setTimeout(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, 50)
    }
  }, [open])

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  const handleSend = () => {
    if (!input.trim()) return
    sendMessage(input.trim())
    setInput('')
    sendTyping(false)
  }

  // Don't render until mounted (prevents hydration mismatch)
  if (!mounted || !user || user.role === 'admin') return null

  return (
    <div className="fixed bottom-6 right-4 sm:right-6 z-[80] flex flex-col items-end gap-3">
      {open && (
        <div className="w-[calc(100vw-2rem)] sm:w-[360px] flex flex-col rounded-2xl shadow-2xl overflow-hidden"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            height: '420px',
            maxHeight: 'calc(100vh - 120px)',
          }}>
          <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ background: '#0F1C35' }}>
            <div className="relative">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ background: '#10B981' }}>N</div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0F1C35] ${connected ? 'bg-emerald-400' : 'bg-slate-500'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold">NexaBank Support</p>
              <p className="text-white/40 text-[10px]">{connected ? 'Online' : 'Connecting…'}</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/50 hover:text-white transition-colors p-1">
              <ChevronDown size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-sm"
                  style={{ background: 'var(--color-bg)' }}>
                  <p className="font-semibold text-xs mb-1" style={{ color: 'var(--color-accent)' }}>NexaBank Support</p>
                  <p style={{ color: 'var(--color-text)' }}>Hi {user.firstName}! 👋 How can we help you today?</p>
                  <p className="text-[10px] mt-1" style={{ color: 'var(--color-muted)' }}>NexaBank</p>
                </div>
              </div>
            )}
            {messages.map((msg, i) => {
              const isMe = msg.senderRole === 'user'
              return (
                <div key={msg._id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm ${isMe ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
                    style={{
                      background: isMe ? '#10B981' : 'var(--color-bg)',
                      color: isMe ? '#fff' : 'var(--color-text)',
                    }}>
                    {!isMe && i === 0 && (
                      <p className="font-semibold text-xs mb-1" style={{ color: 'var(--color-accent)' }}>{msg.senderName}</p>
                    )}
                    <p className="leading-relaxed break-words">{msg.message}</p>
                    <p className={`text-[10px] mt-1 ${isMe ? 'text-white/60' : ''}`}
                      style={{ color: isMe ? undefined : 'var(--color-muted)' }}>
                      {new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )
            })}
            {typingInfo.isTyping && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-tl-sm px-4 py-3" style={{ background: 'var(--color-bg)' }}>
                  <div className="flex items-center gap-1">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-500 chat-dot" />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="px-3 py-3 border-t flex-shrink-0 flex items-center gap-2"
            style={{ borderColor: 'var(--color-border)' }}>
            <input ref={inputRef} value={input}
              onChange={e => { setInput(e.target.value); sendTyping(e.target.value.length > 0) }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder="Type a message…"
              className="flex-1 rounded-xl border px-3.5 py-2 text-sm font-sans outline-none min-w-0"
              style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              disabled={!connected} />
            <button onClick={handleSend} disabled={!input.trim() || !connected}
              className="w-9 h-9 flex items-center justify-center rounded-xl transition-all disabled:opacity-40 flex-shrink-0"
              style={{ background: '#10B981' }}>
              <Send size={15} className="text-white" />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(v => !v)}
        className="w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-105 active:scale-95 relative"
        style={{ background: open ? '#0F1C35' : '#10B981' }}
        aria-label="Chat with support">
        {open ? <X size={22} className="text-white" /> : <MessageCircle size={24} className="text-white" />}
        {!open && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  )
}
