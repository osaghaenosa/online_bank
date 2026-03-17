'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api','') || 'http://localhost:5000'

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
  roomId?: string        // for admin: the userId they're chatting with
  role: 'user' | 'admin'
  onNewMessage?: (msg: ChatMsg) => void
}

export function useChat({ token, roomId, role, onNewMessage }: UseChatOptions) {
  const socketRef = useRef<Socket | null>(null)
  const [messages,    setMessages]    = useState<ChatMsg[]>([])
  const [connected,   setConnected]   = useState(false)
  const [typingInfo,  setTypingInfo]  = useState<{ fromName?: string; isTyping: boolean }>({ isTyping: false })
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!token) return

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })
    socketRef.current = socket

    socket.on('connect',    () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))

    socket.on('new_message', (msg: ChatMsg) => {
      // For user: only show messages in their own room
      // For admin: show messages from whatever room is currently open
      const relevant = role === 'user'
        ? true   // user only receives their own room messages
        : (!roomId || msg.roomId === roomId)

      if (relevant) {
        setMessages(prev => {
          // Deduplicate by _id
          if (prev.find(m => m._id === msg._id)) return prev
          return [...prev, msg]
        })
        onNewMessage?.(msg)
      }
    })

    socket.on('typing', (data: { fromAdmin?: boolean; fromUserId?: string; fromName?: string; isTyping: boolean }) => {
      if (role === 'user' && data.fromAdmin) {
        setTypingInfo({ isTyping: data.isTyping })
      } else if (role === 'admin' && data.fromUserId === roomId) {
        setTypingInfo({ fromName: data.fromName, isTyping: data.isTyping })
      }
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, role])

  const sendMessage = useCallback((message: string, toUserId?: string) => {
    const socket = socketRef.current
    if (!socket || !message.trim()) return
    if (role === 'user') {
      socket.emit('user_message', { message })
    } else if (role === 'admin' && toUserId) {
      socket.emit('admin_message', { toUserId, message })
    }
  }, [role])

  const sendTyping = useCallback((isTyping: boolean, toUserId?: string) => {
    const socket = socketRef.current
    if (!socket) return
    socket.emit('typing', { isTyping, toUserId })

    // Auto-stop typing after 2s
    if (isTyping) {
      if (typingTimer.current) clearTimeout(typingTimer.current)
      typingTimer.current = setTimeout(() => {
        socket.emit('typing', { isTyping: false, toUserId })
        setTypingInfo({ isTyping: false })
      }, 2000)
    }
  }, [])

  const loadHistory = useCallback((msgs: ChatMsg[]) => {
    setMessages(msgs)
  }, [])

  return { messages, connected, typingInfo, sendMessage, sendTyping, loadHistory }
}
