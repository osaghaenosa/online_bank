'use client'
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api, saveToken, clearToken } from '@/lib/api'

export interface User {
  _id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  balance: number
  savingsBalance: number
  savingsGoal: number
  accountNumber: string
  routingNumber: string
  cardNumber: string
  cardNumberMasked: string
  cardExpiry: string
  status: 'active' | 'suspended' | 'pending'
  kyc: 'Verified' | 'Pending' | 'Rejected'
  role: 'user' | 'admin'
  notifications: { email: boolean; sms: boolean; push: boolean }
  linkedAccounts: Array<{
    platform: string; label: string; accountId: string
    balance: number; currency: string; isDefault: boolean
  }>
  cryptoAssets: Array<{
    coin: string; symbol: string; quantity: number
    avgBuyPrice: number; currentPrice: number; valueUSD: number
    walletAddress: string; network: string; acquiredAt: string
  }>
  treasuryAssets: Array<{
    category: string; name: string; description: string
    quantity: number; unitPrice: number; totalValue: number
    acquiredAt: string; location: string; serialNo: string; notes: string
  }>
  investments: Array<{
    name: string; type: string; ticker: string
    amount: number; currentValue: number; returnPct: number
    startDate: string; status: string; notes: string; broker: string
  }>
  trust: {
    enabled: boolean; name: string; balance: number; type: string
    trustee: string; beneficiary: string; established: string; notes: string
  }
  profilePicture?: string | null
  profilePictureFileId?: string | null
  createdAt: string
}

interface Toast {
  id: string
  msg: string
  type: 'success' | 'error' | 'warning' | 'info'
}

interface AuthCtx {
  user: User | null
  loading: boolean
  toasts: Toast[]
  toast: (msg: string, type?: Toast['type']) => void
  login: (email: string, password: string) => Promise<void>
  register: (data: object) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
  setUser: (u: User) => void
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [toasts, setToasts]   = useState<Toast[]>([])

  const toast = useCallback((msg: string, type: Toast['type'] = 'success') => {
    const id = Math.random().toString(36).slice(2)
    setToasts(p => [...p, { id, msg, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000)
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const { user } = await api.auth.me()
      setUser(user)
    } catch {
      clearToken()
      setUser(null)
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('nexabank_token')
    if (token) {
      refreshUser().finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [refreshUser])

  const login = async (email: string, password: string) => {
    const { token, user } = await api.auth.login({ email, password })
    saveToken(token)
    setUser(user)
  }

  const register = async (data: object) => {
    const { token, user } = await api.auth.register(data)
    saveToken(token)
    setUser(user)
  }

  const logout = () => {
    clearToken()
    setUser(null)
    window.location.href = '/'
  }

  return (
    <Ctx.Provider value={{ user, loading, toasts, toast, login, register, logout, refreshUser, setUser }}>
      {children}
    </Ctx.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
