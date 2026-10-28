'use client'
import { useEffect, useRef, useState } from 'react'
import { MessageCircle, X, Send, ChevronDown, Phone } from 'lucide-react'
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

  if (!mounted || !user || user.role === 'admin') return null

  return (
    <div className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-[80] flex flex-col items-end gap-3">
      {open && (
        <div
          className="w-[calc(100vw-2rem)] sm:w-[360px] flex flex-col shadow-2xl overflow-hidden border-2"
          style={{
            background: '#FFFFFF',
            borderColor: '#002B5B',
            height: '420px',
            maxHeight: 'calc(100vh - 160px)',
          }}
        >
          <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0 border-b" style={{ background: '#002B5B', borderColor: '#0052CC' }}>
            <div className="relative">
              <div
                className="w-8 h-8 flex items-center justify-center text-white text-xs font-mono font-bold"
                style={{ background: '#0052CC' }}
              >
                BRB
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border border-[#002B5B] ${connected ? 'bg-blue-400' : 'bg-slate-500'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-bold uppercase tracking-wider">Blue ridge Bank Support</p>
              <p className="text-[10px] font-mono" style={{ color: '#93C5FD' }}>{connected ? '● ONLINE DESK' : 'CONNECTING…'}</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white transition-colors p-1">
              <ChevronDown size={18} />
            </button>
          </div>

          {/* Persistent Telephone & WhatsApp Support Header Strip */}
          <div
            className="flex items-center justify-between px-3 py-2 border-b text-[11px] font-mono flex-shrink-0"
            style={{ background: '#EBF2FF', borderColor: '#BFDBFE', color: '#002B5B' }}
          >
            <div className="flex items-center gap-1.5 font-bold truncate">
              <Phone size={12} style={{ color: '#0052CC' }} />
              <a href="tel:+12488346313" className="hover:underline">
                +1 (248) 834-6313
              </a>
            </div>
            <a
              href="https://wa.me/12488346313"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-white transition-opacity hover:opacity-90 flex-shrink-0"
              style={{ background: '#0052CC' }}
              title="Open WhatsApp Support Chat (+1 248 834-6313)"
            >
              <MessageCircle size={10} />
              <span>WhatsApp</span>
            </a>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ background: '#F8FAFC' }}>
            {messages.length === 0 && (
              <div className="flex justify-start">
                <div
                  className="max-w-[88%] px-3.5 py-2.5 text-sm border space-y-1.5"
                  style={{ background: '#FFFFFF', borderColor: '#CBD5E1', borderLeft: '3px solid #0052CC' }}
                >
                  <p className="font-bold text-xs" style={{ color: '#002B5B' }}>Blue ridge Bank Support Desk</p>
                  <p className="text-xs" style={{ color: '#0A192F' }}>
                    Hello {user.firstName}, how can our institutional support desk assist you today?
                  </p>
                  <div className="pt-1.5 border-t border-slate-100 text-xs space-y-1">
                    <p className="font-semibold text-[11px] uppercase tracking-wider font-mono" style={{ color: '#002B5B' }}>
                      Official Telephone &amp; WhatsApp:
                    </p>
                    <a
                      href="https://wa.me/12488346313"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-bold underline text-xs"
                      style={{ color: '#0052CC' }}
                    >
                      <Phone size={11} />
                      <span>+1 (248) 834-6313</span>
                      <span className="text-[10px] uppercase font-mono px-1 py-0.5 text-white no-underline font-normal" style={{ background: '#0052CC' }}>
                        Chat on WhatsApp
                      </span>
                    </a>
                  </div>
                  <p className="text-[10px] font-mono" style={{ color: '#64748B' }}>support@theblueridges.com</p>
                </div>
              </div>
            )}
            {messages.map((msg, i) => {
              const isMe = msg.senderRole === 'user'
              return (
                <div key={msg._id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className="max-w-[80%] px-3.5 py-2.5 text-sm border"
                    style={{
                      background: isMe ? '#0052CC' : '#FFFFFF',
                      borderColor: isMe ? '#002B5B' : '#CBD5E1',
                      color: isMe ? '#FFFFFF' : '#0A192F',
                    }}
                  >
                    {!isMe && i === 0 && (
                      <p className="font-bold text-xs mb-1" style={{ color: '#0052CC' }}>{msg.senderName}</p>
                    )}
                    <p className="leading-relaxed break-words">{msg.message}</p>
                    <p
                      className={`text-[10px] font-mono mt-1 ${isMe ? 'text-white/75' : ''}`}
                      style={{ color: isMe ? undefined : '#64748B' }}
                    >
                      {new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )
            })}
            {typingInfo.isTyping && (
              <div className="flex justify-start">
                <div className="px-4 py-3 border bg-white" style={{ borderColor: '#CBD5E1' }}>
                  <div className="flex items-center gap-1">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 bg-[#0052CC] chat-dot" />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div
            className="px-3 py-3 border-t flex-shrink-0 flex items-center gap-2 bg-white"
            style={{ borderColor: '#CBD5E1' }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={e => { setInput(e.target.value); sendTyping(e.target.value.length > 0) }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder="Write a message to support…"
              className="flex-1 border px-3.5 py-2 text-sm font-sans outline-none min-w-0"
              style={{ background: '#F8FAFC', borderColor: '#CBD5E1', color: '#0A192F' }}
              disabled={!connected}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || !connected}
              className="w-9 h-9 flex items-center justify-center transition-all disabled:opacity-40 flex-shrink-0"
              style={{ background: '#0052CC' }}
            >
              <Send size={15} className="text-white" />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(v => !v)}
        className="w-13 h-13 px-4 py-3.5 flex items-center justify-center shadow-xl border-2 transition-colors relative"
        style={{
          background: open ? '#002B5B' : '#0052CC',
          borderColor: '#FFFFFF',
        }}
        aria-label="Chat with support"
      >
        {open ? <X size={20} className="text-white" /> : <MessageCircle size={22} className="text-white" />}
        {!open && unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 flex items-center justify-center bg-red-600 text-white text-[10px] font-bold px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  )
}
