'use client'
import { useEffect, useRef, useState } from 'react'
import { MessageCircle, X, Send, ChevronDown, Phone } from 'lucide-react'
import { useChat } from '@/hooks/useChat'
import { api } from '@/lib/api'
import { useAuth } from '@/store/auth'
import { WhatsAppIcon } from '@/components/shared/WhatsAppIcon'

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
    <div className="fixed bottom-24 lg:bottom-6 right-4 sm:right-6 z-[80] flex flex-col items-end gap-3">
      {open && (
        <div
          className="w-[calc(100vw-2rem)] sm:w-[376px] flex flex-col shadow-float overflow-hidden rounded-3xl border border-slate-200/80 bg-white slide-up"
          style={{
            height: '448px',
            maxHeight: 'calc(100vh - 170px)',
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3.5 flex-shrink-0 brand-card-gradient text-white">
            <div className="relative">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold bg-white/15 border border-white/25">
                BRB
              </div>
              <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#002B5B] ${connected ? 'bg-[#10B981]' : 'bg-slate-400'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-display font-bold truncate">Blue ridge Support</p>
              <p className="text-[11px] text-blue-200 flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-[#10B981]' : 'bg-slate-400'}`} />
                {connected ? 'Banking Manager Online' : 'Connecting…'}
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 transition-colors"
            >
              <ChevronDown size={18} />
            </button>
          </div>

          {/* Persistent Telephone & WhatsApp Support Header Strip */}
          <div
            className="flex items-center justify-between px-4 py-2 border-b text-xs flex-shrink-0 bg-[#F4F7FC] border-slate-200/80 text-[#002B5B]"
          >
            <div className="flex items-center gap-1.5 font-semibold truncate">
              <Phone size={12} className="text-[#0052CC]" />
              <a href="tel:+12488346313" className="hover:underline">
                +1 (248) 834-6313
              </a>
            </div>
            <a
              href="https://wa.me/12488346313"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold text-white transition-opacity hover:opacity-90 flex-shrink-0"
              style={{ background: '#0052CC' }}
              title="Open WhatsApp Support Chat (+1 248 834-6313)"
            >
              <WhatsAppIcon size={13} />
              <span>WhatsApp</span>
            </a>
          </div>

          {/* Chat Thread */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F4F7FC]">
            {messages.length === 0 && (
              <div className="flex justify-start">
                <div className="max-w-[88%] px-4 py-3 text-sm rounded-2xl rounded-bl-sm bg-white shadow-card border border-slate-200/60 space-y-2">
                  <p className="font-semibold text-xs text-[#002B5B]">Blue ridge Bank Support Desk</p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Hello {user.firstName}, how can our banking support desk assist you today?
                  </p>
                  <div className="pt-2 border-t border-slate-100 text-xs space-y-1.5">
                    <p className="font-semibold text-[11px] text-slate-500">
                      Direct Telephone &amp; WhatsApp
                    </p>
                    <a
                      href="https://wa.me/12488346313"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-semibold text-xs text-[#0052CC] hover:underline"
                    >
                      <Phone size={11} />
                      <span>+1 (248) 834-6313</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full text-white bg-[#0052CC]">
                        WhatsApp
                      </span>
                    </a>
                  </div>
                  <p className="text-[10px] text-slate-400">support@theblueridges.com</p>
                </div>
              </div>
            )}
            {messages.map((msg, i) => {
              const isMe = msg.senderRole === 'user'
              return (
                <div key={msg._id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] px-3.5 py-2.5 text-sm shadow-sm ${
                      isMe
                        ? 'rounded-2xl rounded-br-sm text-white'
                        : 'rounded-2xl rounded-bl-sm bg-white border border-slate-200/70 text-[#0A192F]'
                    }`}
                    style={
                      isMe
                        ? { background: 'linear-gradient(135deg, #0052CC 0%, #003D99 100%)' }
                        : undefined
                    }
                  >
                    {!isMe && i === 0 && (
                      <p className="font-semibold text-[11px] mb-1 text-[#0052CC]">{msg.senderName}</p>
                    )}
                    <p className="leading-relaxed break-words text-[13px]">{msg.message}</p>
                    <p
                      className={`text-[10px] mt-1 ${isMe ? 'text-blue-100 text-right' : 'text-slate-400'}`}
                    >
                      {new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )
            })}
            {typingInfo.isTyping && (
              <div className="flex justify-start">
                <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-white border border-slate-200/70 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#0052CC] chat-dot" />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Composer */}
          <div className="px-3.5 py-3 border-t border-slate-200/80 flex-shrink-0 flex items-center gap-2 bg-white">
            <input
              ref={inputRef}
              value={input}
              onChange={e => { setInput(e.target.value); sendTyping(e.target.value.length > 0) }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder="Write a message…"
              className="flex-1 rounded-full border border-slate-200 bg-[#F4F7FC] focus:bg-white focus:border-[#0052CC] px-4 py-2 text-sm font-sans outline-none min-w-0 transition-colors"
              style={{ color: '#0A192F' }}
              disabled={!connected}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || !connected}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-40 flex-shrink-0 shadow-brand cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #0052CC 0%, #003D99 100%)' }}
            >
              <Send size={15} className="text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Circular FAB */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-14 h-14 rounded-full flex items-center justify-center shadow-brand border-2 border-white transition-transform hover:scale-105 active:scale-95 relative cursor-pointer"
        style={{
          background: open
            ? '#002B5B'
            : 'linear-gradient(135deg, #0052CC 0%, #003D99 100%)',
        }}
        aria-label="Chat with support"
      >
        {open ? <X size={20} className="text-white" /> : <MessageCircle size={22} className="text-white" />}
        {!open && (unreadCount > 0 || hasUnread) && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 rounded-full flex items-center justify-center bg-red-500 text-white text-[10px] font-bold px-1 ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount || 1}
          </span>
        )}
      </button>
    </div>
  )
}
