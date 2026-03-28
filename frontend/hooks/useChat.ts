'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'

export interface ChatMsg {
  _id: string
  roomId: string
  senderId: string
  senderRole: 'user' | 'admin'
  senderName: string
  message: string
  read: boolean
  createdAt: string
}

interface UseChatOptions {
  token: string | null
  roomId?: string        // for admin: userId of the open conversation
  role: 'user' | 'admin'
  onNewMessage?: (msg: ChatMsg) => void
}

export function useChat({ token, roomId, role, onNewMessage }: UseChatOptions) {
  const socketRef    = useRef<Socket | null>(null)
  const [messages,   setMessages]   = useState<ChatMsg[]>([])
  const [connected,  setConnected]  = useState(false)
  const [typingInfo, setTypingInfo] = useState<{ fromName?: string; isTyping: boolean }>({ isTyping: false })
  const typingTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Keep onNewMessage in a ref so the socket listener never goes stale ────
  // The socket is set up once; the callback always reads the latest version
  const onNewMessageRef = useRef(onNewMessage)
  useEffect(() => { onNewMessageRef.current = onNewMessage }, [onNewMessage])

  // ── Keep roomId in a ref for the same reason ──────────────────────────────
  const roomIdRef = useRef(roomId)
  useEffect(() => { roomIdRef.current = roomId }, [roomId])

  // ── Socket lifecycle — only recreate when token or role changes ───────────
  useEffect(() => {
    if (!token) return

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })
    socketRef.current = socket

    socket.on('connect',    () => { setConnected(true) })
    socket.on('disconnect', () => { setConnected(false) })
    socket.on('connect_error', (err) => {
      console.warn('Socket connect error:', err.message)
      setConnected(false)
    })

    socket.on('new_message', (msg: ChatMsg) => {
      // For user role: always relevant (only receives own room messages from server)
      // For admin role: filter by currently open room
      const relevant =
        role === 'user' ||
        !roomIdRef.current ||
        msg.roomId === roomIdRef.current

      if (relevant) {
        setMessages(prev => {
          if (prev.some(m => m._id === msg._id)) return prev // deduplicate
          return [...prev, msg]
        })
      }

      // Always call the external handler — it does its own room filtering
      onNewMessageRef.current?.(msg)
    })

    socket.on('typing', (data: {
      fromAdmin?: boolean
      fromUserId?: string
      fromName?: string
      isTyping: boolean
    }) => {
      if (role === 'user' && data.fromAdmin) {
        setTypingInfo({ isTyping: data.isTyping })
      } else if (role === 'admin' && data.fromUserId === roomIdRef.current) {
        setTypingInfo({ fromName: data.fromName, isTyping: data.isTyping })
      }
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
      setConnected(false)
    }
  // Only reconnect if token or role actually changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, role])

  // ── Send a message ────────────────────────────────────────────────────────
  const sendMessage = useCallback((message: string, toUserId?: string) => {
    const socket = socketRef.current
    if (!socket?.connected || !message.trim()) return

    if (role === 'user') {
      socket.emit('user_message', { message })
    } else if (role === 'admin' && toUserId) {
      socket.emit('admin_message', { toUserId, message })
    }
  }, [role])

  // ── Typing indicator ──────────────────────────────────────────────────────
  const sendTyping = useCallback((isTyping: boolean, toUserId?: string) => {
    const socket = socketRef.current
    if (!socket?.connected) return

    socket.emit('typing', { isTyping, toUserId })

    if (isTyping) {
      if (typingTimer.current) clearTimeout(typingTimer.current)
      typingTimer.current = setTimeout(() => {
        socket.emit('typing', { isTyping: false, toUserId })
        setTypingInfo({ isTyping: false })
      }, 2000)
    }
  }, [])

  // ── Load history (used by parent to populate messages from REST) ──────────
  const loadHistory = useCallback((msgs: ChatMsg[]) => {
    setMessages(msgs)
  }, [])

  return { messages, connected, typingInfo, sendMessage, sendTyping, loadHistory }
}