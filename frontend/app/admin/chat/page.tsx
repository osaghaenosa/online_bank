'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { api, fmtDateTime } from '@/lib/api'
import { Card, SectionHeader } from '@/components/ui'
import { useChat, ChatMsg } from '@/hooks/useChat'
import { useAuth } from '@/store/auth'
import { Send, MessageCircle, Search, Circle, Users } from 'lucide-react'

function getToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('nexabank_token')
}

interface Room {
  user: { _id: string; firstName: string; lastName: string; email: string }
  lastMessage: ChatMsg | null
  unreadCount: number
}

export default function AdminChatPage() {
  const { toast, user: adminUser } = useAuth()
  const token = getToken()
  const [rooms,       setRooms]       = useState<Room[]>([])
  const [activeRoom,  setActiveRoom]  = useState<Room | null>(null)
  const [roomMsgs,    setRoomMsgs]    = useState<ChatMsg[]>([])
  const [input,       setInput]       = useState('')
  const [search,      setSearch]      = useState('')
  const [loadingRooms, setLoadingRooms] = useState(true)
  const [onlineSet,   setOnlineSet]   = useState<Set<string>>(new Set())
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)

  const handleNewMessage = useCallback((msg: ChatMsg) => {
    // Update room list unread + last message
    setRooms(prev => prev.map(r => {
      if (r.user._id === msg.roomId) {
        const isActive = activeRoom?.user._id === msg.roomId
        return {
          ...r,
          lastMessage: msg,
          unreadCount: isActive ? 0 : r.unreadCount + (msg.senderRole === 'user' ? 1 : 0),
        }
      }
      return r
    }))
    // If the incoming msg belongs to the active room, append it
    if (activeRoom?.user._id === msg.roomId) {
      setRoomMsgs(prev => {
        if (prev.find(m => m._id === msg._id)) return prev
        return [...prev, msg]
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoom?.user._id])

  const { connected, typingInfo, sendMessage, sendTyping } = useChat({
    token,
    role: 'admin',
    roomId: activeRoom?.user._id,
    onNewMessage: handleNewMessage,
  })

  // Load rooms
  const loadRooms = useCallback(async () => {
    setLoadingRooms(true)
    try {
      const d = await api.chat.adminRooms()
      setRooms(d.rooms || [])
    } catch (err: any) { toast(err.message, 'error') }
    finally { setLoadingRooms(false) }
  }, [toast])

  useEffect(() => { loadRooms() }, [loadRooms])

  // Open a room
  const openRoom = async (room: Room) => {
    setActiveRoom(room)
    setInput('')
    try {
      const d = await api.chat.adminRoom(room.user._id)
      setRoomMsgs(d.messages || [])
      // Clear unread in state
      setRooms(prev => prev.map(r =>
        r.user._id === room.user._id ? { ...r, unreadCount: 0 } : r
      ))
    } catch (err: any) { toast(err.message, 'error') }
  }

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [roomMsgs])

  // Focus input when room opens
  useEffect(() => {
    if (activeRoom) setTimeout(() => inputRef.current?.focus(), 100)
  }, [activeRoom])

  const handleSend = () => {
    if (!input.trim() || !activeRoom) return
    sendMessage(input.trim(), activeRoom.user._id)
    setInput('')
    sendTyping(false, activeRoom.user._id)
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const filtered = rooms.filter(r =>
    (r.user.firstName + ' ' + r.user.lastName + ' ' + r.user.email)
      .toLowerCase().includes(search.toLowerCase())
  )

  const totalUnread = rooms.reduce((s, r) => s + r.unreadCount, 0)

  return (
    <div className="flex gap-0 h-[calc(100vh-180px)] min-h-[500px] rounded-2xl overflow-hidden border"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>

      {/* ── Sidebar: room list ───────────────────────────────────────────── */}
      <div className={`flex flex-col border-r flex-shrink-0 ${activeRoom ? 'hidden sm:flex' : 'flex'} w-full sm:w-72`}
        style={{ borderColor: 'var(--color-border)' }}>

        {/* Sidebar header */}
        <div className="p-4 border-b flex-shrink-0" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MessageCircle size={16} style={{ color: 'var(--color-accent)' }} />
              <h3 className="font-bold text-sm">Live Chat</h3>
              {totalUnread > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600">
                  {totalUnread}
                </span>
              )}
            </div>
            <div className={`flex items-center gap-1 text-[10px] font-semibold ${connected ? 'text-emerald-500' : 'text-slate-400'}`}>
              <Circle size={6} className={connected ? 'fill-emerald-500' : 'fill-slate-400'} />
              {connected ? 'Live' : 'Off'}
            </div>
          </div>
          <div className="relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-muted)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search users…"
              className="w-full pl-8 pr-3 py-2 rounded-xl border text-xs font-sans outline-none"
              style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
          </div>
        </div>

        {/* Room list */}
        <div className="flex-1 overflow-y-auto">
          {loadingRooms ? (
            <div className="space-y-2 p-3">
              {[1,2,3,4].map(i => <div key={i} className="shimmer h-16 rounded-xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-2"
              style={{ color: 'var(--color-muted)' }}>
              <Users size={28} className="opacity-20" />
              <p className="text-xs">No users found</p>
            </div>
          ) : filtered.map(room => {
            const isActive = activeRoom?.user._id === room.user._id
            const online   = onlineSet.has(room.user._id)
            return (
              <button key={room.user._id} onClick={() => openRoom(room)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors border-b"
                style={{
                  borderColor: 'var(--color-border)',
                  background: isActive ? 'rgba(16,185,129,.08)' : 'transparent',
                }}>
                <div className="relative flex-shrink-0">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: '#0F1C35' }}>
                    {room.user.firstName[0]}{room.user.lastName[0]}
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 ${online ? 'bg-emerald-400' : 'bg-slate-400'}`}
                    style={{ borderColor: 'var(--color-surface)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-semibold truncate">{room.user.firstName} {room.user.lastName}</p>
                    {room.lastMessage && (
                      <p className="text-[10px] flex-shrink-0" style={{ color: 'var(--color-muted)' }}>
                        {new Date(room.lastMessage.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                  <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--color-muted)' }}>
                    {room.lastMessage
                      ? (room.lastMessage.senderRole === 'admin' ? 'You: ' : '') + room.lastMessage.message
                      : 'No messages yet'}
                  </p>
                </div>
                {room.unreadCount > 0 && (
                  <span className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-emerald-500 text-white text-[10px] font-bold px-1 flex-shrink-0">
                    {room.unreadCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Chat area ────────────────────────────────────────────────────── */}
      <div className={`flex-1 flex flex-col min-w-0 ${activeRoom ? 'flex' : 'hidden sm:flex'}`}>
        {!activeRoom ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4"
            style={{ color: 'var(--color-muted)' }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--color-bg)' }}>
              <MessageCircle size={28} className="opacity-30" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold">Select a conversation</p>
              <p className="text-xs mt-1 opacity-70">Choose a user from the list to start chatting</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b flex-shrink-0"
              style={{ background: '#0F1C35', borderColor: '#1E2D47' }}>
              {/* Back button mobile */}
              <button className="sm:hidden text-white/60 hover:text-white p-1"
                onClick={() => setActiveRoom(null)}>
                ← 
              </button>
              <div className="relative">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: '#10B981' }}>
                  {activeRoom.user.firstName[0]}{activeRoom.user.lastName[0]}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold">
                  {activeRoom.user.firstName} {activeRoom.user.lastName}
                </p>
                <p className="text-white/40 text-[10px] truncate">{activeRoom.user.email}</p>
              </div>
              <div className={`text-[10px] font-semibold px-2 py-1 rounded-full ${connected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                {connected ? '● Live' : '○ Off'}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {roomMsgs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3"
                  style={{ color: 'var(--color-muted)' }}>
                  <MessageCircle size={24} className="opacity-20" />
                  <p className="text-xs">No messages yet — start the conversation</p>
                </div>
              ) : roomMsgs.map((msg, i) => {
                const isAdmin = msg.senderRole === 'admin'
                const showName = isAdmin && (i === 0 || roomMsgs[i-1]?.senderRole !== 'admin')
                return (
                  <div key={msg._id || i} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm ${isAdmin ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
                      style={{
                        background: isAdmin ? '#10B981' : 'var(--color-bg)',
                        color: isAdmin ? '#fff' : 'var(--color-text)',
                      }}>
                      {showName && isAdmin && (
                        <p className="text-[10px] font-semibold mb-1 text-white/70">
                          {msg.senderName} (Admin)
                        </p>
                      )}
                      {!isAdmin && i === 0 || roomMsgs[i-1]?.senderRole !== msg.senderRole ? (
                        <p className="text-[10px] font-semibold mb-1" style={{ color: 'var(--color-accent)' }}>
                          {activeRoom.user.firstName}
                        </p>
                      ) : null}
                      <p className="leading-relaxed break-words">{msg.message}</p>
                      <p className={`text-[10px] mt-1 ${isAdmin ? 'text-white/60' : ''}`}
                        style={{ color: isAdmin ? undefined : 'var(--color-muted)' }}>
                        {new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )
              })}

              {/* Typing indicator */}
              {typingInfo.isTyping && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-tl-sm px-4 py-3" style={{ background: 'var(--color-bg)' }}>
                    <div className="flex items-center gap-1">
                      {[0,1,2].map(i => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                          style={{ animation: `bounce2 1.2s ease-in-out ${i*0.2}s infinite` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-3 py-3 border-t flex-shrink-0 flex items-center gap-2"
              style={{ borderColor: 'var(--color-border)' }}>
              <input ref={inputRef} value={input}
                onChange={e => { setInput(e.target.value); sendTyping(e.target.value.length > 0, activeRoom.user._id) }}
                onKeyDown={handleKey}
                placeholder={`Reply to ${activeRoom.user.firstName}…`}
                className="flex-1 rounded-xl border px-3.5 py-2 text-sm font-sans outline-none min-w-0"
                style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                disabled={!connected}
              />
              <button onClick={handleSend} disabled={!input.trim() || !connected}
                className="w-9 h-9 flex items-center justify-center rounded-xl transition-all disabled:opacity-40 flex-shrink-0"
                style={{ background: '#10B981' }}>
                <Send size={15} className="text-white" />
              </button>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes bounce2 {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  )
}
