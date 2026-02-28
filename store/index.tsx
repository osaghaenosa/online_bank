'use client'

import React, { createContext, useContext, useReducer, useCallback } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

export type TxStatus = 'completed' | 'pending' | 'failed'
export type TxType = 'credit' | 'debit'
export type TxCat = 'income' | 'transfer' | 'shopping' | 'food' | 'bills' | 'crypto' | 'entertainment' | 'health' | 'transport'

export interface Transaction {
  id: string
  userId: string
  type: TxType
  cat: TxCat
  desc: string
  amount: number
  status: TxStatus
  date: string
  ref: string
  note?: string
}

export interface User {
  id: string
  name: string
  email: string
  phone: string
  balance: number
  accountNo: string
  routing: string
  cardNo: string
  expiry: string
  cvv: string
  status: 'active' | 'suspended'
  kyc: 'Verified' | 'Pending' | 'Rejected'
  role: 'user' | 'admin'
}

export interface Notification {
  id: string
  userId?: string
  msg: string
  read: boolean
  createdAt: string
}

export interface AppTheme {
  appName: string
  accentColor: string
  primaryColor: string
  darkMode: boolean
  logo: string | null
}

export interface AppState {
  currentUserId: string
  users: User[]
  transactions: Transaction[]
  notifications: Notification[]
  theme: AppTheme
  toasts: Toast[]
}

export interface Toast {
  id: string
  msg: string
  type: 'success' | 'error' | 'warning' | 'info'
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const genId = () => Math.random().toString(36).substr(2, 9).toUpperCase()
const genRouting = () => Math.floor(100000000 + Math.random() * 900000000).toString()
const genCard = () =>
  Array.from({ length: 16 }, (_, i) => (i && i % 4 === 0 ? ' ' : '') + '0123456789'[Math.floor(Math.random() * 10)]).join('')

const randomDate = (daysAgo: number) =>
  new Date(Date.now() - daysAgo * 86400000 * Math.random()).toISOString()

// ─── Seed Data ───────────────────────────────────────────────────────────────

const SEED_USERS: User[] = [
  { id: 'u1', name: 'Jordan Mitchell', email: 'jordan@nexabank.com', phone: '+1 555-0101', balance: 12840.50, accountNo: genCard(), routing: genRouting(), cardNo: genCard(), expiry: '09/28', cvv: '371', status: 'active', kyc: 'Verified', role: 'user' },
  { id: 'u2', name: 'Samantha Lee', email: 'sam@nexabank.com', phone: '+1 555-0202', balance: 5200.00, accountNo: genCard(), routing: genRouting(), cardNo: genCard(), expiry: '12/26', cvv: '822', status: 'active', kyc: 'Verified', role: 'user' },
  { id: 'u3', name: 'Marcus Brown', email: 'marcus@nexabank.com', phone: '+1 555-0303', balance: 890.25, accountNo: genCard(), routing: genRouting(), cardNo: genCard(), expiry: '04/27', cvv: '543', status: 'suspended', kyc: 'Pending', role: 'user' },
  { id: 'u4', name: 'Priya Patel', email: 'priya@nexabank.com', phone: '+1 555-0404', balance: 31500.00, accountNo: genCard(), routing: genRouting(), cardNo: genCard(), expiry: '07/29', cvv: '168', status: 'active', kyc: 'Verified', role: 'user' },
  { id: 'u5', name: 'Carlos Rivera', email: 'carlos@nexabank.com', phone: '+1 555-0505', balance: 2100.80, accountNo: genCard(), routing: genRouting(), cardNo: genCard(), expiry: '02/27', cvv: '294', status: 'active', kyc: 'Verified', role: 'user' },
]

const TX_TEMPLATES: Array<{ type: TxType; cat: TxCat; desc: string }> = [
  { type: 'debit', cat: 'shopping', desc: 'Whole Foods Market' },
  { type: 'credit', cat: 'income', desc: 'Salary Deposit' },
  { type: 'debit', cat: 'entertainment', desc: 'Netflix Subscription' },
  { type: 'credit', cat: 'income', desc: 'Freelance Payment' },
  { type: 'debit', cat: 'food', desc: 'Starbucks' },
  { type: 'debit', cat: 'shopping', desc: 'Amazon Purchase' },
  { type: 'credit', cat: 'transfer', desc: 'Transfer Received' },
  { type: 'debit', cat: 'crypto', desc: 'Bitcoin Withdrawal' },
  { type: 'credit', cat: 'crypto', desc: 'ETH Deposit' },
  { type: 'debit', cat: 'bills', desc: 'Rent Payment' },
  { type: 'credit', cat: 'income', desc: 'Card Cashback' },
  { type: 'debit', cat: 'transport', desc: 'Uber Ride' },
  { type: 'debit', cat: 'bills', desc: 'Electric Bill' },
  { type: 'credit', cat: 'transfer', desc: 'Zelle Payment' },
  { type: 'debit', cat: 'health', desc: 'Gym Membership' },
  { type: 'credit', cat: 'transfer', desc: 'ACH Deposit' },
  { type: 'debit', cat: 'food', desc: 'Restaurant Dinner' },
  { type: 'credit', cat: 'income', desc: 'Dividend Payment' },
  { type: 'debit', cat: 'shopping', desc: 'Apple Store' },
  { type: 'debit', cat: 'crypto', desc: 'USDT Withdrawal' },
]

const STATUSES: TxStatus[] = ['completed', 'completed', 'completed', 'pending', 'failed']

function seedTransactions(): Transaction[] {
  const txs: Transaction[] = []
  SEED_USERS.forEach(user => {
    TX_TEMPLATES.forEach((tpl, i) => {
      txs.push({
        id: genId(),
        userId: user.id,
        type: tpl.type,
        cat: tpl.cat,
        desc: tpl.desc,
        amount: parseFloat((20 + Math.random() * 2000).toFixed(2)),
        status: STATUSES[Math.floor(Math.random() * STATUSES.length)],
        date: randomDate(i * 1.5),
        ref: genId(),
      })
    })
  })
  return txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

type Action =
  | { type: 'SET_USER'; userId: string }
  | { type: 'UPDATE_BALANCE'; userId: string; delta: number }
  | { type: 'ADD_TX'; tx: Transaction }
  | { type: 'UPDATE_TX_STATUS'; txId: string; status: TxStatus }
  | { type: 'ADD_ADMIN_TX'; tx: Transaction }
  | { type: 'UPDATE_USER'; userId: string; patch: Partial<User> }
  | { type: 'TOGGLE_USER_STATUS'; userId: string }
  | { type: 'SET_THEME'; patch: Partial<AppTheme> }
  | { type: 'ADD_TOAST'; toast: Toast }
  | { type: 'REMOVE_TOAST'; id: string }
  | { type: 'ADD_NOTIFICATION'; notif: Notification }
  | { type: 'MARK_NOTIFS_READ' }

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, currentUserId: action.userId }

    case 'UPDATE_BALANCE':
      return {
        ...state,
        users: state.users.map(u =>
          u.id === action.userId
            ? { ...u, balance: Math.max(0, parseFloat((u.balance + action.delta).toFixed(2))) }
            : u
        ),
      }

    case 'ADD_TX':
      return { ...state, transactions: [action.tx, ...state.transactions] }

    case 'UPDATE_TX_STATUS':
      return {
        ...state,
        transactions: state.transactions.map(t =>
          t.id === action.txId ? { ...t, status: action.status } : t
        ),
      }

    case 'ADD_ADMIN_TX':
      return { ...state, transactions: [action.tx, ...state.transactions] }

    case 'UPDATE_USER':
      return {
        ...state,
        users: state.users.map(u =>
          u.id === action.userId ? { ...u, ...action.patch } : u
        ),
      }

    case 'TOGGLE_USER_STATUS':
      return {
        ...state,
        users: state.users.map(u =>
          u.id === action.userId
            ? { ...u, status: u.status === 'active' ? 'suspended' : 'active' }
            : u
        ),
      }

    case 'SET_THEME':
      return { ...state, theme: { ...state.theme, ...action.patch } }

    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts, action.toast] }

    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.id) }

    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [action.notif, ...state.notifications] }

    case 'MARK_NOTIFS_READ':
      return {
        ...state,
        notifications: state.notifications.map(n => ({ ...n, read: true })),
      }

    default:
      return state
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

const INITIAL_STATE: AppState = {
  currentUserId: 'u1',
  users: SEED_USERS,
  transactions: seedTransactions(),
  notifications: [
    { id: genId(), msg: 'Welcome to NexaBank! Your account is ready.', read: false, createdAt: new Date().toISOString() },
    { id: genId(), userId: 'u1', msg: 'Your KYC verification is complete.', read: false, createdAt: new Date().toISOString() },
  ],
  theme: {
    appName: 'NexaBank',
    accentColor: '#10B981',
    primaryColor: '#1A2B4A',
    darkMode: false,
  },
  toasts: [],
}

interface StoreCtx {
  state: AppState
  dispatch: React.Dispatch<Action>
  me: User
  myTxs: Transaction[]
  toast: (msg: string, type?: Toast['type']) => void
  addTx: (
    type: TxType,
    cat: TxCat,
    desc: string,
    amount: number,
    status?: TxStatus,
    note?: string
  ) => void
}

const StoreContext = createContext<StoreCtx | null>(null)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)

  const me = state.users.find(u => u.id === state.currentUserId)!
  const myTxs = state.transactions
    .filter(t => t.userId === state.currentUserId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const toast = useCallback(
    (msg: string, type: Toast['type'] = 'success') => {
      const id = genId()
      dispatch({ type: 'ADD_TOAST', toast: { id, msg, type } })
      setTimeout(() => dispatch({ type: 'REMOVE_TOAST', id }), 3500)
    },
    []
  )

  const addTx = useCallback(
    (
      txType: TxType,
      cat: TxCat,
      desc: string,
      amount: number,
      status: TxStatus = 'completed',
      note?: string
    ) => {
      const tx: Transaction = {
        id: genId(),
        userId: state.currentUserId,
        type: txType,
        cat,
        desc,
        amount,
        status,
        date: new Date().toISOString(),
        ref: genId(),
        note,
      }
      dispatch({ type: 'ADD_TX', tx })
      const delta = txType === 'credit' ? amount : -amount
      dispatch({ type: 'UPDATE_BALANCE', userId: state.currentUserId, delta })
    },
    [state.currentUserId]
  )

  return (
    <StoreContext.Provider value={{ state, dispatch, me, myTxs, toast, addTx }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}

// Re-export genId for use in components
export { genId }
