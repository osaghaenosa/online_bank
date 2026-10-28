'use client'
import { useEffect, useState, useRef } from 'react'
import {
  Mail, Send, Users, UserCheck, Eye, CheckCircle2, AlertCircle,
  Sparkles, RefreshCw, ChevronDown, Search, DollarSign, Shield,
  Newspaper, BookOpen, Gift, Server, Info, Edit3, AtSign,
  Inbox, Paperclip, Image as ImageIcon, FileText, Trash2, Download,
  Reply, ExternalLink, Clock, ArrowUpRight, FolderOpen
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/store/auth'
import clsx from 'clsx'

// ── Email category presets (Solid Corporate Blue Palette, Sharp Corners) ───────
const CATEGORIES = [
  {
    id: 'credit', label: 'Credit Alert', icon: DollarSign, color: '#0052CC', bg: '#EBF2FF',
    defaultSubject: 'Credit Alert — Funds Added to Your Account',
    placeholder: `We are pleased to inform you that your Blue ridge Bank account has been credited.\n\nThis transaction has been processed and the funds are now available in your account balance.\n\nIf you have any questions about this credit, please contact our support team immediately at support@theblueridges.com.`,
    showAmount: true,
  },
  {
    id: 'debit', label: 'Debit Alert', icon: DollarSign, color: '#002B5B', bg: '#F1F5F9',
    defaultSubject: 'Debit Alert — Transaction Processed on Your Account',
    placeholder: `A debit transaction has been processed on your Blue ridge Bank account.\n\nPlease review this transaction in your account dashboard. If you did not authorize this transaction, contact our fraud team immediately at support@theblueridges.com.`,
    showAmount: true,
  },
  {
    id: 'security', label: 'Security Notice', icon: Shield, color: '#B45309', bg: '#FEF3C7',
    defaultSubject: 'Important Security Notice — Blue ridge Bank',
    placeholder: `We are writing to inform you of an important security update regarding your Blue ridge Bank account.\n\nYour account security is our highest priority. Please ensure you never share your password, PIN, or one-time codes with anyone — including Blue ridge Bank staff.\n\nIf you notice any suspicious activity, please freeze your card immediately from your dashboard and contact support@theblueridges.com.`,
    showAmount: false,
  },
  {
    id: 'newsletter', label: 'Newsletter', icon: Newspaper, color: '#0052CC', bg: '#EBF2FF',
    defaultSubject: 'Blue ridge Bank Monthly Digest — Financial Insights & Updates',
    placeholder: `Welcome to this month's edition of the Blue ridge Bank Financial Digest.\n\nHere's what's new at Blue ridge Bank this month:\n\n• Enhanced security features across all accounts\n• Faster wire transfer processing times\n• Expanded crypto & wealth tracking dashboard\n\nThank you for banking with Blue ridge Bank.`,
    showAmount: false,
  },
  {
    id: 'article', label: 'Financial Article', icon: BookOpen, color: '#002B5B', bg: '#EBF2FF',
    defaultSubject: 'Smart Money Insights from Blue ridge Bank',
    placeholder: `Building Financial Resilience: 5 Habits of High-Net-Worth Savers\n\nManaging wealth effectively goes beyond earning well — it comes down to consistent daily habits.\n\n1. Automate Your Savings First\nSet up automatic transfers on payday before you have a chance to spend.\n\n2. Diversify Across Asset Classes\nSpread risk across cash, equities, real estate, and digital assets.\n\n3. Review Your Statements Monthly\nCatching unnecessary subscriptions and fees early compounds into thousands saved.`,
    showAmount: false,
  },
  {
    id: 'promotion', label: 'Special Offer', icon: Gift, color: '#0052CC', bg: '#EBF2FF',
    defaultSubject: 'Exclusive Offer for Blue ridge Bank Valued Customers',
    placeholder: `As a valued Blue ridge Bank account holder, you have been selected for an exclusive offer.\n\nFor a limited time, enjoy zero fees on all international wire transfers over $500 and earn 2.5% cashback on all virtual card purchases.\n\nLog in to your dashboard today to activate this offer.`,
    showAmount: false,
  },
  {
    id: 'system', label: 'System Update', icon: Server, color: '#002B5B', bg: '#F1F5F9',
    defaultSubject: 'Scheduled Maintenance & Platform Update — Blue ridge Bank',
    placeholder: `We are writing to notify you of an upcoming scheduled maintenance window for the Blue ridge Bank platform.\n\nMaintenance Window: Sunday, 2:00 AM – 4:00 AM EST\n\nDuring this time, online banking and mobile services may be temporarily unavailable. Card transactions at POS terminals will not be affected.\n\nWe apologize for any inconvenience.`,
    showAmount: false,
  },
  {
    id: 'information', label: 'Account Info', icon: Info, color: '#0052CC', bg: '#EBF2FF',
    defaultSubject: 'Important Information About Your Blue ridge Bank Account',
    placeholder: `We are writing to provide you with important information regarding your Blue ridge Bank account.\n\nPlease take a moment to review the details below and ensure your account profile and contact information are up to date.\n\nIf you require any assistance, our support team is available 24/7 via live chat or at support@theblueridges.com.`,
    showAmount: false,
  },
  {
    id: 'custom', label: 'Custom Email', icon: Edit3, color: '#002B5B', bg: '#EBF2FF',
    defaultSubject: '',
    placeholder: 'Write your custom email message here…',
    showAmount: false,
  },
]

interface OutboundAttachment {
  id: string
  filename: string
  contentType: string
  size: number
  content: string      // pure base64
  previewUrl?: string  // data URL for image preview
}

function formatBytes(bytes?: number) {
  if (!bytes || isNaN(bytes)) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

// ── Live HTML preview builder (Matches backend Solid Blue Template) ──────────
function buildPreviewHTML(
  type: string,
  subject: string,
  body: string,
  amount: string,
  recipientName: string,
  attachments: OutboundAttachment[],
  embedImages: boolean
) {
  const cat = CATEGORIES.find(c => c.id === type) || CATEGORIES[8]
  const paragraphs = body.split('\n\n').map(p => p.trim()).filter(Boolean)
    .map(p => `<p style="margin:0 0 14px 0;font-size:13px;line-height:1.65;color:#1E293B;">${p.replace(/\n/g, '<br/>')}</p>`).join('')

  const amtNum = parseFloat(amount)
  const amtHTML = (type === 'credit' || type === 'debit') && amtNum ? `
    <div style="background:${cat.bg};border:2px solid #002B5B;border-left:5px solid #0052CC;border-radius:0px;padding:16px;margin-bottom:18px;">
      <p style="font-size:10px;color:#002B5B;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px 0;font-family:monospace;">
        Amount ${type === 'credit' ? 'Credited' : 'Debited'}
      </p>
      <p style="font-size:26px;font-weight:800;color:${type === 'credit' ? '#0052CC' : '#002B5B'};font-family:monospace;margin:0;">
        ${type === 'credit' ? '+' : '-'}$${amtNum.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} <span style="font-size:12px;color:#475569;">USD</span>
      </p>
    </div>` : ''

  const inlineImgs = embedImages
    ? attachments
        .filter(a => a.contentType.startsWith('image/') && a.previewUrl)
        .map(a => `
          <div style="border:2px solid #002B5B;background:#F8FAFC;padding:6px;margin:12px 0;">
            <img src="${a.previewUrl}" alt="${a.filename}" style="max-width:100%;height:auto;display:block;" />
            <p style="margin:4px 0 0 0;font-size:9px;font-family:monospace;color:#475569;text-transform:uppercase;">ATTACHED IMAGE: ${a.filename}</p>
          </div>
        `).join('')
    : ''

  const attSummary = attachments.length > 0 ? `
    <div style="background:#EBF2FF;border:1px solid #93C5FD;border-left:4px solid #002B5B;padding:10px 14px;margin-top:14px;">
      <p style="margin:0 0 4px 0;font-size:10px;font-family:monospace;font-weight:700;color:#002B5B;text-transform:uppercase;">
        ENCLOSED ATTACHMENTS (${attachments.length})
      </p>
      ${attachments.map(a => `<p style="margin:2px 0;font-size:11px;font-family:monospace;color:#1E3A5F;">&bull; <strong>${a.filename}</strong> (${formatBytes(a.size)})</p>`).join('')}
    </div>
  ` : ''

  return `
    <div style="font-family:'Segoe UI',Arial,sans-serif;background:#F2F5F9;padding:16px;border-radius:0px;">
      <div style="background:#FFFFFF;border:2px solid #002B5B;border-radius:0px;">
        <div style="background:#001F42;padding:8px 20px;border-bottom:1px solid #1E3A5F;font-family:monospace;font-size:9px;color:#93C5FD;letter-spacing:1px;font-weight:700;">
          BLUE RIDGE BANK &bull; OFFICIAL ELECTRONIC DISPATCH
        </div>
        <div style="background:#002B5B;padding:18px 20px;border-bottom:4px solid #0052CC;display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:10px;">
            <img src="/logo.png" alt="Logo" style="width:32px;height:32px;object-fit:contain;background:#FFFFFF;border:1px solid #60A5FA;padding:1px;" />
            <span style="color:#FFFFFF;font-size:16px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;">BLUE RIDGE <span style="color:#60A5FA;">BANK</span></span>
          </div>
          <span style="background:#0052CC;color:#FFFFFF;border:1px solid #60A5FA;padding:4px 10px;border-radius:0px;font-size:10px;font-weight:700;font-family:monospace;text-transform:uppercase;">${cat.label}</span>
        </div>
        <div style="padding:22px 20px;">
          <p style="font-size:10px;font-family:monospace;color:#0052CC;font-weight:700;text-transform:uppercase;margin:0 0 4px 0;">SUBJECT: ${subject || 'Official Notice'}</p>
          <p style="font-size:15px;font-weight:700;color:#002B5B;margin:0 0 16px 0;padding-bottom:10px;border-bottom:1px solid #E2E8F0;">Dear ${recipientName || 'Valued Client'},</p>
          ${amtHTML}
          <div style="color:#1E293B;font-size:13px;line-height:1.65;">${paragraphs || '<p style="color:#94A3B8;">Your message will appear here…</p>'}</div>
          ${inlineImgs}
          ${attSummary}
        </div>
        <div style="background:#F8FAFC;padding:14px 20px;border-top:1px solid #CBD5E1;border-bottom:1px solid #CBD5E1;text-align:right;">
          <span style="background:#0052CC;color:#FFFFFF;padding:8px 18px;border-radius:0px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;display:inline-block;">Access Banking Portal →</span>
        </div>
        <div style="background:#002B5B;padding:14px 20px;color:#BFDBFE;">
          <p style="font-size:10px;color:#BFDBFE;margin:0;">© ${new Date().getFullYear()} Blue ridge Bank · support@theblueridges.com</p>
        </div>
      </div>
    </div>`
}

export default function AdminEmailPage() {
  const { toast } = useAuth()
  // Top-level mode: 'compose' | 'inbox' | 'sent'
  const [activeTab, setActiveTab] = useState<'compose' | 'inbox' | 'sent'>('compose')

  const [users,        setUsers]        = useState<any[]>([])
  const [smtpStatus,   setSmtpStatus]   = useState<'checking'|'ok'|'fail'>('checking')
  const [smtpError,    setSmtpError]    = useState('')
  const [smtpFrom,     setSmtpFrom]     = useState('')

  // Compose state
  const [category,     setCategory]     = useState(CATEGORIES[0])
  const [target,       setTarget]       = useState<'all'|'custom'|string>('all')
  const [customEmail,  setCustomEmail]  = useState('')
  const [userSearch,   setUserSearch]   = useState('')
  const [showPicker,   setShowPicker]   = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [subject,      setSubject]      = useState(CATEGORIES[0].defaultSubject)
  const [body,         setBody]         = useState(CATEGORIES[0].placeholder)
  const [amount,       setAmount]       = useState('')
  const [attachments,  setAttachments]  = useState<OutboundAttachment[]>([])
  const [embedImages,  setEmbedImages]  = useState(true)
  const [showPreview,  setShowPreview]  = useState(false)
  const [sending,      setSending]      = useState(false)
  const [lastResult,   setLastResult]   = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Received Inbox state (Resend Receiving API - No Webhooks)
  const [inboxEmails,      setInboxEmails]      = useState<any[]>([])
  const [inboxLoading,     setInboxLoading]     = useState(false)
  const [inboxError,       setInboxError]       = useState('')
  const [inboxSearch,      setInboxSearch]      = useState('')
  const [selectedInboxId,  setSelectedInboxId]  = useState<string | null>(null)
  const [inboxDetail,      setInboxDetail]      = useState<any>(null)
  const [inboxDetailLoad,  setInboxDetailLoad]  = useState(false)
  const [downloadingAttId, setDownloadingAttId] = useState<string | null>(null)

  // Sent Outbox state (Resend API)
  const [sentEmails,       setSentEmails]       = useState<any[]>([])
  const [sentLoading,      setSentLoading]      = useState(false)
  const [sentError,        setSentError]        = useState('')
  const [selectedSentId,   setSelectedSentId]   = useState<string | null>(null)
  const [sentDetail,       setSentDetail]       = useState<any>(null)
  const [sentDetailLoad,   setSentDetailLoad]   = useState(false)

  useEffect(() => {
    api.admin.users({ limit: '200' }).then(d => setUsers(d.users || [])).catch(() => {})
    checkSmtp()
  }, [])

  useEffect(() => {
    if (activeTab === 'inbox' && inboxEmails.length === 0 && !inboxLoading) {
      loadInbox()
    }
    if (activeTab === 'sent' && sentEmails.length === 0 && !sentLoading) {
      loadSent()
    }
  }, [activeTab])

  const checkSmtp = async () => {
    setSmtpStatus('checking')
    try {
      const r = await api.email.verify()
      setSmtpStatus(r.connected ? 'ok' : 'fail')
      setSmtpError(r.error || '')
      setSmtpFrom(r.from || '')
    } catch (e: any) {
      setSmtpStatus('fail')
      setSmtpError(e.message)
    }
  }

  // ── Load Received Emails from Resend API (No Webhook Required) ─────────────
  const loadInbox = async () => {
    setInboxLoading(true)
    setInboxError('')
    try {
      const res = await api.email.inbox({ limit: '50' })
      const list = res.emails || []
      setInboxEmails(list)
      if (list.length > 0 && !selectedInboxId) {
        openInboxEmail(list[0].id)
      }
    } catch (e: any) {
      setInboxError(e.message || 'Could not fetch received emails from Resend API')
    } finally {
      setInboxLoading(false)
    }
  }

  const openInboxEmail = async (id: string) => {
    setSelectedInboxId(id)
    setInboxDetailLoad(true)
    try {
      const res = await api.email.inboxDetail(id)
      setInboxDetail(res.email || null)
    } catch (e: any) {
      toast(e.message || 'Failed to load email', 'error')
    } finally {
      setInboxDetailLoad(false)
    }
  }

  const handleDownloadReceivedAttachment = async (emailId: string, att: any) => {
    if (att.download_url) {
      window.open(att.download_url, '_blank', 'noopener,noreferrer')
      return
    }
    if (!att.id) {
      toast('No attachment ID found on this file.', 'error')
      return
    }
    setDownloadingAttId(att.id)
    try {
      const res = await api.email.attachment(emailId, att.id)
      if (res.attachment?.download_url) {
        window.open(res.attachment.download_url, '_blank', 'noopener,noreferrer')
      } else {
        toast('Resend did not return a download URL for this attachment.', 'error')
      }
    } catch (e: any) {
      toast(e.message || 'Attachment error', 'error')
    } finally {
      setDownloadingAttId(null)
    }
  }

  const handleReplyToReceivedEmail = (emailObj: any) => {
    const rawFrom = emailObj.from || ''
    const match = rawFrom.match(/<([^>]+)>/)
    const cleanEmail = match ? match[1] : rawFrom.trim()
    const origSubject = emailObj.subject || 'Your Inquiry'
    const replySubj = origSubject.toLowerCase().startsWith('re:') ? origSubject : `Re: ${origSubject}`

    const customCat = CATEGORIES.find(c => c.id === 'custom') || CATEGORIES[8]
    setCategory(customCat)
    setTarget('custom')
    setSelectedUser(null)
    setCustomEmail(cleanEmail)
    setSubject(replySubj)
    setBody(`Thank you for contacting Blue ridge Bank Support.\n\nRegarding your message ("${origSubject}"):\n\n`)
    setActiveTab('compose')
    toast(`Replying to ${cleanEmail}`, 'info')
  }

  // ── Load Sent Emails from Resend API ───────────────────────────────────────
  const loadSent = async () => {
    setSentLoading(true)
    setSentError('')
    try {
      const res = await api.email.sent({ limit: '50' })
      const list = res.emails || []
      setSentEmails(list)
      if (list.length > 0 && !selectedSentId) {
        openSentEmail(list[0].id)
      }
    } catch (e: any) {
      setSentError(e.message || 'Could not fetch sent emails from Resend API')
    } finally {
      setSentLoading(false)
    }
  }

  const openSentEmail = async (id: string) => {
    setSelectedSentId(id)
    setSentDetailLoad(true)
    try {
      const res = await api.email.sentDetail(id)
      setSentDetail(res.email || null)
    } catch (e: any) {
      toast(e.message || 'Failed to load sent email', 'error')
    } finally {
      setSentDetailLoad(false)
    }
  }

  // ── File & Image Attachment Picker for Outbound Emails ─────────────────────
  const handleSelectFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files
    if (!fileList || fileList.length === 0) return

    const newItems: OutboundAttachment[] = []
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i]
      if (file.size > 15 * 1024 * 1024) {
        toast(`${file.name} exceeds 15 MB limit.`, 'error')
        continue
      }
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result || ''))
        reader.onerror = () => reject(new Error('File read error'))
        reader.readAsDataURL(file)
      })
      const base64Idx = dataUrl.indexOf('base64,')
      const pureBase64 = base64Idx !== -1 ? dataUrl.slice(base64Idx + 7) : dataUrl
      const contentType = file.type || 'application/octet-stream'

      newItems.push({
        id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
        filename: file.name,
        contentType,
        size: file.size,
        content: pureBase64,
        previewUrl: contentType.startsWith('image/') ? dataUrl : undefined,
      })
    }

    setAttachments(prev => [...prev, ...newItems])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id))
  }

  const selectCategory = (cat: typeof CATEGORIES[0]) => {
    setCategory(cat)
    setSubject(cat.defaultSubject)
    setBody(cat.placeholder)
    setAmount('')
    setLastResult(null)
  }

  const selectUser = (u: any) => {
    setSelectedUser(u)
    setTarget(u._id)
    setShowPicker(false)
    setUserSearch('')
  }

  const filteredUsers = users.filter(u => {
    const q = userSearch.toLowerCase()
    return !q || `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
           u.email.toLowerCase().includes(q) || (u.accountNumber || '').includes(q)
  })

  const filteredInbox = inboxEmails.filter(em => {
    const q = inboxSearch.toLowerCase().trim()
    if (!q) return true
    const fromStr = String(em.from || '').toLowerCase()
    const subjStr = String(em.subject || '').toLowerCase()
    const toStr = Array.isArray(em.to) ? em.to.join(' ').toLowerCase() : String(em.to || '').toLowerCase()
    return fromStr.includes(q) || subjStr.includes(q) || toStr.includes(q)
  })

  const handleSend = async () => {
    if (!subject.trim()) return toast('Please enter an email subject.', 'error')
    if (!body.trim() && attachments.length === 0) {
      return toast('Please enter an email message or attach a file.', 'error')
    }
    if (target === 'custom') {
      if (!customEmail.trim() || !customEmail.includes('@')) {
        return toast('Please enter a valid recipient email address.', 'error')
      }
    } else if (target !== 'all' && !selectedUser) {
      return toast('Please select a user or choose All Users.', 'error')
    }

    setSending(true)
    setLastResult(null)
    try {
      const res = await api.email.send({
        target,
        customEmail:   target === 'custom' ? customEmail.trim() : undefined,
        subject:       subject.trim(),
        type:          category.id,
        bodyHTML:      body,
        bodyText:      body,
        amount:        category.showAmount && amount ? amount : undefined,
        accountNumber: selectedUser?.accountNumber,
        embedImages,
        attachments:   attachments.map(a => ({
          filename:    a.filename,
          content:     a.content,
          contentType: a.contentType,
          size:        a.size,
        })),
      })
      setLastResult(res)
      if (res.sent > 0) {
        toast(`Delivered to ${res.sent} recipient${res.sent > 1 ? 's' : ''}${attachments.length > 0 ? ` with ${attachments.length} attachment(s)` : ''}.`, 'success')
      } else {
        toast(res.results?.[0]?.error || 'Check Resend settings', 'error')
      }
    } catch (err: any) {
      toast(err.message || 'Failed to send email', 'error')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-7xl space-y-5">

      {/* ── Top Institutional Header & Mode Switcher ─────────────────── */}
      <div className="border-2 bg-white p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4" style={{ borderColor: '#002B5B' }}>
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest font-bold mb-1" style={{ color: '#0052CC' }}>
            BLUE RIDGE BANK · RESEND API COMMUNICATIONS SUITE
          </p>
          <h2 className="font-bold text-xl font-display uppercase tracking-wide flex items-center gap-2.5" style={{ color: '#002B5B' }}>
            <Mail size={20} style={{ color: '#0052CC' }} />
            Admin Mail Center (Send &amp; Receive via Resend API)
          </h2>
          <p className="text-xs mt-1" style={{ color: '#475569' }}>
            Send branded dispatches with image &amp; file attachments, and read incoming emails sent to your Resend domain directly via API without webhooks.
          </p>
        </div>

        {/* Mode Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('compose')}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider border-2 transition-colors"
            style={{
              background: activeTab === 'compose' ? '#002B5B' : '#FFFFFF',
              color: activeTab === 'compose' ? '#FFFFFF' : '#002B5B',
              borderColor: '#002B5B',
            }}
          >
            <Send size={14} />
            Compose &amp; Send
          </button>
          <button
            onClick={() => setActiveTab('inbox')}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider border-2 transition-colors"
            style={{
              background: activeTab === 'inbox' ? '#0052CC' : '#FFFFFF',
              color: activeTab === 'inbox' ? '#FFFFFF' : '#002B5B',
              borderColor: activeTab === 'inbox' ? '#0052CC' : '#002B5B',
            }}
          >
            <Inbox size={14} />
            Received Inbox
            {inboxEmails.length > 0 && (
              <span
                className="px-1.5 py-0.5 text-[10px] font-mono font-bold"
                style={{
                  background: activeTab === 'inbox' ? '#002B5B' : '#EBF2FF',
                  color: activeTab === 'inbox' ? '#FFFFFF' : '#0052CC',
                }}
              >
                {inboxEmails.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider border-2 transition-colors"
            style={{
              background: activeTab === 'sent' ? '#0052CC' : '#FFFFFF',
              color: activeTab === 'sent' ? '#FFFFFF' : '#002B5B',
              borderColor: activeTab === 'sent' ? '#0052CC' : '#002B5B',
            }}
          >
            <ArrowUpRight size={14} />
            Sent Outbox
          </button>
        </div>
      </div>

      {/* ── Resend API Connection Banner ─────────────────────────────── */}
      <div
        className="flex items-center justify-between gap-4 px-5 py-3.5 border-2 text-sm"
        style={{
          background: smtpStatus === 'ok' ? '#EBF2FF' : smtpStatus === 'fail' ? '#FEF2F2' : '#F8FAFC',
          borderColor: smtpStatus === 'ok' ? '#0052CC' : smtpStatus === 'fail' ? '#DC2626' : '#CBD5E1',
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          {smtpStatus === 'checking' && <RefreshCw size={16} className="animate-spin text-slate-400 flex-shrink-0" />}
          {smtpStatus === 'ok'       && <CheckCircle2 size={16} className="flex-shrink-0" style={{ color: '#0052CC' }} />}
          {smtpStatus === 'fail'     && <AlertCircle  size={16} className="text-red-500 flex-shrink-0" />}
          <div className="min-w-0">
            {smtpStatus === 'checking' && <span className="text-slate-600 text-xs font-mono">VERIFYING RESEND API CONNECTION…</span>}
            {smtpStatus === 'ok' && (
              <span className="font-semibold text-xs sm:text-sm" style={{ color: '#002B5B' }}>
                Resend Direct HTTP API Connected — Sending &amp; Receiving Active · Sender: <strong className="font-mono">{smtpFrom || 'support@theblueridges.com'}</strong>
              </span>
            )}
            {smtpStatus === 'fail' && (
              <div>
                <p className="font-semibold text-red-700 text-xs sm:text-sm">Resend API Not Configured</p>
                <p className="text-xs text-red-600 mt-0.5">{smtpError}</p>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={checkSmtp}
          className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase px-3 py-1.5 bg-white border transition-colors flex-shrink-0"
          style={{ borderColor: '#002B5B', color: '#002B5B' }}
        >
          <RefreshCw size={12} /> Test API
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 1: COMPOSE & SEND (WITH FILE & IMAGE ATTACHMENTS)
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── Left: Category picker + Recipient ── */}
          <div className="space-y-4">

            {/* Category selector */}
            <div className="card space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider mb-3 font-mono" style={{ color: '#002B5B' }}>
                1. Email Template Type
              </p>
              {CATEGORIES.map(cat => {
                const Icon   = cat.icon
                const active = category.id === cat.id
                return (
                  <button
                    key={cat.id}
                    onClick={() => selectCategory(cat)}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-all text-sm font-medium border"
                    style={
                      active
                        ? { background: '#002B5B', borderColor: '#0052CC', color: '#FFFFFF' }
                        : { background: '#FFFFFF', borderColor: '#CBD5E1', color: '#0F172A' }
                    }
                  >
                    <div
                      className="w-7 h-7 flex items-center justify-center flex-shrink-0"
                      style={{ background: active ? '#0052CC' : '#EBF2FF' }}
                    >
                      <Icon size={14} style={{ color: active ? '#FFFFFF' : '#0052CC' }} />
                    </div>
                    <span className="truncate text-xs font-bold uppercase tracking-wider">{cat.label}</span>
                    {active && <div className="w-2 h-2 ml-auto flex-shrink-0 bg-white" />}
                  </button>
                )
              })}
            </div>

            {/* Recipient selector */}
            <div className="card space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider font-mono" style={{ color: '#002B5B' }}>
                2. Select Recipient
              </p>

              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => { setTarget('all'); setSelectedUser(null) }}
                  className={clsx(
                    'flex flex-col items-center justify-center gap-1 py-2.5 px-2 text-xs font-semibold border transition-all',
                    target === 'all' ? 'text-white' : 'border-slate-200 text-slate-600'
                  )}
                  style={target === 'all' ? { background: '#002B5B', borderColor: '#0052CC' } : {}}
                >
                  <Users size={14} />
                  <span>All Users</span>
                  <span className="text-[10px] opacity-75">({users.length})</span>
                </button>
                <button
                  onClick={() => { setTarget(selectedUser?._id || 'pick'); setShowPicker(true) }}
                  className={clsx(
                    'flex flex-col items-center justify-center gap-1 py-2.5 px-2 text-xs font-semibold border transition-all',
                    target !== 'all' && target !== 'custom' ? 'text-white' : 'border-slate-200 text-slate-600'
                  )}
                  style={target !== 'all' && target !== 'custom' ? { background: '#002B5B', borderColor: '#0052CC' } : {}}
                >
                  <UserCheck size={14} />
                  <span>Pick User</span>
                  <span className="text-[10px] opacity-75">from list</span>
                </button>
                <button
                  onClick={() => { setTarget('custom'); setSelectedUser(null); setShowPicker(false) }}
                  className={clsx(
                    'flex flex-col items-center justify-center gap-1 py-2.5 px-2 text-xs font-semibold border transition-all',
                    target === 'custom' ? 'text-white' : 'border-slate-200 text-slate-600'
                  )}
                  style={target === 'custom' ? { background: '#0052CC', borderColor: '#002B5B' } : {}}
                >
                  <AtSign size={14} />
                  <span>Custom</span>
                  <span className="text-[10px] opacity-75">any email</span>
                </button>
              </div>

              {target === 'custom' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                    <AtSign size={12} style={{ color: '#0052CC' }} /> Recipient Email Address
                  </label>
                  <input
                    className="input font-mono text-sm text-slate-900 bg-white placeholder:text-slate-500 font-medium"
                    style={{ color: '#0F172A', backgroundColor: '#FFFFFF' }}
                    type="email"
                    placeholder="anyone@example.com"
                    value={customEmail}
                    onChange={e => setCustomEmail(e.target.value)}
                    autoFocus
                  />
                  <p className="text-[11px] text-slate-400">
                    Send to any external or client email address via Resend.
                  </p>
                </div>
              )}

              {selectedUser && target !== 'all' && target !== 'custom' && (
                <div className="flex items-center gap-3 p-3 border" style={{ background: '#EBF2FF', borderColor: '#93C5FD' }}>
                  <div
                    className="w-8 h-8 flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: '#002B5B' }}
                  >
                    {selectedUser.firstName?.[0]}{selectedUser.lastName?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-xs truncate" style={{ color: '#002B5B' }}>
                      {selectedUser.firstName} {selectedUser.lastName}
                    </p>
                    <p className="text-[11px] truncate" style={{ color: '#0052CC' }}>{selectedUser.email}</p>
                  </div>
                  <button
                    onClick={() => setShowPicker(true)}
                    className="text-xs underline flex-shrink-0 font-bold"
                    style={{ color: '#002B5B' }}
                  >
                    Change
                  </button>
                </div>
              )}

              {showPicker && target !== 'all' && target !== 'custom' && (
                <div className="border border-slate-200 overflow-hidden">
                  <div className="p-2 border-b border-slate-100 bg-slate-50 relative">
                    <Search size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      className="w-full pl-7 pr-3 py-1.5 text-xs bg-white border border-slate-200 focus:outline-none text-slate-900 placeholder:text-slate-500 font-medium"
                      style={{ color: '#0F172A', backgroundColor: '#FFFFFF' }}
                      placeholder="Search name, email…"
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto divide-y divide-slate-50">
                    {filteredUsers.slice(0, 30).map(u => (
                      <button
                        key={u._id}
                        onClick={() => selectUser(u)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50 transition-colors"
                      >
                        <div
                          className="w-6 h-6 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                          style={{ background: '#002B5B' }}
                        >
                          {u.firstName?.[0]}{u.lastName?.[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-800 truncate">{u.firstName} {u.lastName}</p>
                          <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                        </div>
                      </button>
                    ))}
                    {filteredUsers.length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-4">No users found</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Right 2 cols: Compose + Attachments + Preview ── */}
          <div className="lg:col-span-2 space-y-4">
            <div className="card space-y-4">
              <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: '#E2E8F0' }}>
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 flex items-center justify-center text-white"
                    style={{ background: '#002B5B' }}
                  >
                    {(() => { const Icon = category.icon; return <Icon size={16} /> })()}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm uppercase tracking-wider" style={{ color: '#002B5B' }}>
                      {category.label}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {target === 'all'
                        ? `Sending to all ${users.length} users`
                        : target === 'custom'
                        ? customEmail ? `Sending to ${customEmail}` : 'Enter a custom email address'
                        : selectedUser
                        ? `Sending to ${selectedUser.firstName} ${selectedUser.lastName} (${selectedUser.email})`
                        : 'Select a recipient on the left'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPreview(v => !v)}
                  className={clsx(
                    'flex items-center gap-1.5 text-xs font-bold uppercase px-3 py-1.5 border transition-all',
                    showPreview ? 'text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  )}
                  style={showPreview ? { background: '#002B5B', borderColor: '#0052CC' } : {}}
                >
                  <Eye size={13} /> {showPreview ? 'Hide Preview' : 'Live Preview'}
                </button>
              </div>

              {/* Subject */}
              <div>
                <label className="label">Email Subject *</label>
                <input
                  className="input text-slate-900 bg-white placeholder:text-slate-500 font-medium"
                  style={{ color: '#0F172A', backgroundColor: '#FFFFFF' }}
                  placeholder="Enter email subject…"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                />
              </div>

              {/* Amount field — only for credit/debit */}
              {category.showAmount && (
                <div>
                  <label className="label">
                    Transaction Amount (USD) — <span className="text-slate-400 font-normal">shown in a highlighted box inside the email</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input
                      className="input pl-8 font-mono text-slate-900 bg-white placeholder:text-slate-500 font-medium"
                      style={{ color: '#0F172A', backgroundColor: '#FFFFFF' }}
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00 (optional)"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Body */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label mb-0">Message Body *</label>
                  <button
                    onClick={() => setBody(category.placeholder)}
                    className="text-[11px] flex items-center gap-1 hover:underline font-semibold"
                    style={{ color: '#0052CC' }}
                  >
                    <Sparkles size={11} /> Reset to template
                  </button>
                </div>
                <textarea
                  className="input resize-none font-sans text-sm leading-relaxed text-slate-900 bg-white placeholder:text-slate-500 font-medium"
                  style={{ color: '#0F172A', backgroundColor: '#FFFFFF' }}
                  rows={9}
                  placeholder={category.placeholder}
                  value={body}
                  onChange={e => setBody(e.target.value)}
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Separate paragraphs with a blank line. The Blue ridge Bank header, logo, and footer are added automatically.
                </p>
              </div>

              {/* ── File & Image Attachments Section ── */}
              <div className="border-2 p-4 space-y-3" style={{ background: '#F8FAFC', borderColor: '#CBD5E1' }}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: '#002B5B' }}>
                      <Paperclip size={14} style={{ color: '#0052CC' }} />
                      Attachments — Images &amp; Documents ({attachments.length})
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Attach PNG/JPG images, PDF receipts, statements, or documents (up to 15 MB per file).
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip"
                      className="hidden"
                      onChange={handleSelectFiles}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono font-bold uppercase tracking-wider text-white border transition-colors"
                      style={{ background: '#0052CC', borderColor: '#002B5B' }}
                    >
                      <Paperclip size={13} />
                      Add Images / Files
                    </button>
                  </div>
                </div>

                {/* Inline image toggle if any image is attached */}
                {attachments.some(a => a.contentType.startsWith('image/')) && (
                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer pt-1" style={{ color: '#002B5B' }}>
                    <input
                      type="checkbox"
                      checked={embedImages}
                      onChange={e => setEmbedImages(e.target.checked)}
                      className="w-4 h-4 accent-[#0052CC]"
                    />
                    <span>Display attached images inline inside the email body (in addition to downloadable attachment)</span>
                  </label>
                )}

                {/* Attached files list */}
                {attachments.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                    {attachments.map(att => {
                      const isImg = att.contentType.startsWith('image/')
                      return (
                        <div
                          key={att.id}
                          className="flex items-center gap-3 p-2.5 bg-white border"
                          style={{ borderColor: '#002B5B' }}
                        >
                          {isImg && att.previewUrl ? (
                            <img
                              src={att.previewUrl}
                              alt={att.filename}
                              className="w-11 h-11 object-cover border flex-shrink-0"
                              style={{ borderColor: '#0052CC' }}
                            />
                          ) : (
                            <div
                              className="w-11 h-11 flex items-center justify-center text-white flex-shrink-0"
                              style={{ background: '#002B5B' }}
                            >
                              <FileText size={18} />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate" style={{ color: '#002B5B' }}>{att.filename}</p>
                            <p className="text-[10px] font-mono text-slate-500">
                              {att.contentType} · {formatBytes(att.size)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAttachment(att.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 transition-colors flex-shrink-0"
                            title="Remove attachment"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Send button */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="text-xs text-slate-400">
                  {target === 'all' ? (
                    <span className="font-medium text-amber-600">⚠ Will send to all {users.length} users</span>
                  ) : target === 'custom' ? (
                    customEmail ? <span>Recipient: <strong className="text-slate-700 font-mono">{customEmail}</strong></span> : <span>Enter an email address on the left</span>
                  ) : selectedUser ? (
                    <span>Recipient: <strong className="text-slate-700">{selectedUser.email}</strong></span>
                  ) : (
                    <span className="text-red-400">No recipient selected</span>
                  )}
                </div>
                <button
                  onClick={handleSend}
                  disabled={
                    sending ||
                    !subject.trim() ||
                    (!body.trim() && attachments.length === 0) ||
                    (target !== 'all' && target !== 'custom' && !selectedUser) ||
                    (target === 'custom' && (!customEmail.trim() || !customEmail.includes('@')))
                  }
                  className="btn-primary gap-2 px-6 py-2.5 disabled:opacity-50"
                >
                  {sending ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      {target === 'all' ? `Sending to ${users.length} users…` : 'Dispatching…'}
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      {target === 'all'
                        ? `Send to All (${users.length})`
                        : target === 'custom'
                        ? `Send to ${customEmail || '…'}`
                        : 'Send Official Email'}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Live HTML preview */}
            {showPreview && (
              <div className="card space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider font-mono" style={{ color: '#002B5B' }}>
                    Live Email Preview — Exactly how the recipient sees it
                  </p>
                  <span className="text-[11px] text-slate-400">Updates as you type</span>
                </div>
                <div
                  className="overflow-hidden border border-slate-200"
                  dangerouslySetInnerHTML={{
                    __html: buildPreviewHTML(
                      category.id,
                      subject,
                      body,
                      amount,
                      selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : 'Valued Client',
                      attachments,
                      embedImages
                    ),
                  }}
                />
              </div>
            )}

            {/* Send result summary */}
            {lastResult && (
              <div
                className="card border-2"
                style={{
                  borderColor: lastResult.failed === 0 ? '#0052CC' : '#F59E0B',
                  background: lastResult.failed === 0 ? '#EBF2FF' : '#FFFBEB',
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle2 size={20} style={{ color: '#0052CC' }} className="flex-shrink-0" />
                  <div>
                    <p className="font-bold text-sm" style={{ color: '#002B5B' }}>
                      Dispatched: {lastResult.sent} / {lastResult.total} delivered
                      {lastResult.failed > 0 && ` · ${lastResult.failed} failed`}
                    </p>
                  </div>
                </div>
                {lastResult.results?.some((r: any) => !r.success) && (
                  <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                    {lastResult.results.filter((r: any) => !r.success).map((r: any, i: number) => (
                      <p key={i} className="text-xs text-red-600 font-mono">{r.email}: {r.error}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 2: RECEIVED INBOX (RESEND RECEIVING API — NO WEBHOOKS)
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'inbox' && (
        <div className="space-y-4">
          {/* Inbox Toolbar */}
          <div className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                className="input pl-9 py-2 text-xs text-slate-900 bg-white placeholder:text-slate-500 font-medium"
                style={{ color: '#0F172A', backgroundColor: '#FFFFFF' }}
                placeholder="Filter received emails by sender, subject, or recipient…"
                value={inboxSearch}
                onChange={e => setInboxSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-500">
                Direct Resend API · No Webhook Required
              </span>
              <button
                onClick={loadInbox}
                disabled={inboxLoading}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider text-white border transition-colors"
                style={{ background: '#002B5B', borderColor: '#0052CC' }}
              >
                <RefreshCw size={13} className={clsx(inboxLoading && 'animate-spin')} />
                Refresh Inbox
              </button>
            </div>
          </div>

          {inboxError && (
            <div className="p-4 border-2 bg-red-50 border-red-600 text-red-800 text-xs font-mono">
              <strong>Resend Receiving API Notice:</strong> {inboxError}
            </div>
          )}

          {/* Split Master-Detail View */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left List (5 cols) */}
            <div className="lg:col-span-5 border-2 bg-white flex flex-col max-h-[680px]" style={{ borderColor: '#002B5B' }}>
              <div className="px-4 py-3 border-b-2 flex items-center justify-between" style={{ background: '#002B5B', borderColor: '#0052CC' }}>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                  INBOUND MESSAGES ({filteredInbox.length})
                </span>
                <span className="text-[10px] font-mono" style={{ color: '#93C5FD' }}>
                  GET /emails/receiving
                </span>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-200">
                {inboxLoading ? (
                  <div className="p-8 text-center text-xs font-mono text-slate-500 flex flex-col items-center gap-2">
                    <RefreshCw size={20} className="animate-spin" style={{ color: '#0052CC' }} />
                    LOADING INBOUND EMAILS FROM RESEND…
                  </div>
                ) : filteredInbox.length === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <FolderOpen size={28} className="mx-auto text-slate-300" />
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#002B5B' }}>
                      No Received Emails Found
                    </p>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">
                      Any emails sent to your Resend-configured domain address (e.g., support@theblueridges.com) will appear here automatically.
                    </p>
                  </div>
                ) : (
                  filteredInbox.map(item => {
                    const active = selectedInboxId === item.id
                    const hasAtt = Array.isArray(item.attachments) && item.attachments.length > 0
                    return (
                      <button
                        key={item.id}
                        onClick={() => openInboxEmail(item.id)}
                        className="w-full text-left p-3.5 transition-colors border-l-4"
                        style={{
                          background: active ? '#EBF2FF' : '#FFFFFF',
                          borderLeftColor: active ? '#0052CC' : 'transparent',
                        }}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-xs font-bold truncate" style={{ color: '#002B5B' }}>
                            {item.from || 'Unknown Sender'}
                          </p>
                          <span className="text-[10px] font-mono text-slate-400 flex-shrink-0">
                            {item.created_at ? new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                          </span>
                        </div>
                        <p className="text-xs font-semibold truncate mb-1" style={{ color: '#0052CC' }}>
                          {item.subject || '(No Subject)'}
                        </p>
                        <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-slate-500">
                          <span className="truncate">
                            To: {Array.isArray(item.to) ? item.to.join(', ') : item.to}
                          </span>
                          {hasAtt && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 border font-bold" style={{ background: '#FFFFFF', borderColor: '#0052CC', color: '#0052CC' }}>
                              <Paperclip size={10} /> {item.attachments.length}
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </div>

            {/* Right Reader Pane (7 cols) */}
            <div className="lg:col-span-7 border-2 bg-white flex flex-col min-h-[480px] max-h-[680px]" style={{ borderColor: '#002B5B' }}>
              {inboxDetailLoad ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-xs font-mono text-slate-500 gap-2">
                  <RefreshCw size={22} className="animate-spin" style={{ color: '#0052CC' }} />
                  RETRIEVING FULL MESSAGE &amp; ATTACHMENTS FROM RESEND…
                </div>
              ) : !inboxDetail ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                  <Mail size={32} className="text-slate-300 mb-2" />
                  <p className="text-xs font-mono uppercase font-bold" style={{ color: '#002B5B' }}>
                    Select a received email on the left to read its contents and download attachments
                  </p>
                </div>
              ) : (
                <>
                  {/* Message Header */}
                  <div className="p-4 border-b-2 space-y-2.5" style={{ background: '#F8FAFC', borderColor: '#CBD5E1' }}>
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-bold text-base leading-snug" style={{ color: '#002B5B' }}>
                        {inboxDetail.subject || '(No Subject)'}
                      </h3>
                      <button
                        onClick={() => handleReplyToReceivedEmail(inboxDetail)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-bold uppercase text-white border flex-shrink-0"
                        style={{ background: '#0052CC', borderColor: '#002B5B' }}
                      >
                        <Reply size={13} /> Reply
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs font-mono">
                      <div>
                        <span className="text-slate-400">FROM: </span>
                        <strong style={{ color: '#002B5B' }}>{inboxDetail.from}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">DATE: </span>
                        <span className="text-slate-700">
                          {inboxDetail.created_at ? new Date(inboxDetail.created_at).toLocaleString() : '—'}
                        </span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-slate-400">TO: </span>
                        <span className="text-slate-700">
                          {Array.isArray(inboxDetail.to) ? inboxDetail.to.join(', ') : inboxDetail.to}
                        </span>
                      </div>
                    </div>

                    {/* Attachments Bar on Received Email */}
                    {Array.isArray(inboxDetail.attachments) && inboxDetail.attachments.length > 0 && (
                      <div className="pt-2 border-t border-slate-200">
                        <p className="text-[10px] font-mono font-bold uppercase tracking-wider mb-2" style={{ color: '#0052CC' }}>
                          RECEIVED ATTACHMENTS ({inboxDetail.attachments.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {inboxDetail.attachments.map((att: any, idx: number) => {
                            const isImg = (att.content_type || '').startsWith('image/')
                            return (
                              <button
                                key={att.id || idx}
                                onClick={() => handleDownloadReceivedAttachment(inboxDetail.id, att)}
                                disabled={downloadingAttId === att.id}
                                className="flex items-center gap-2 px-3 py-1.5 bg-white border text-xs font-mono hover:bg-[#EBF2FF] transition-colors"
                                style={{ borderColor: '#002B5B', color: '#002B5B' }}
                              >
                                {isImg ? <ImageIcon size={13} style={{ color: '#0052CC' }} /> : <FileText size={13} style={{ color: '#0052CC' }} />}
                                <span className="font-bold truncate max-w-[180px]">{att.filename || `attachment-${idx + 1}`}</span>
                                {att.size && <span className="text-[10px] text-slate-400">({formatBytes(att.size)})</span>}
                                <Download size={12} style={{ color: '#0052CC' }} />
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Message Body Content */}
                  <div className="flex-1 overflow-y-auto p-5 bg-white">
                    {inboxDetail.html ? (
                      <div
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: inboxDetail.html }}
                      />
                    ) : (
                      <pre className="whitespace-pre-wrap font-sans text-sm text-slate-800 leading-relaxed">
                        {inboxDetail.text || '(This email has no text or HTML body content.)'}
                      </pre>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 3: SENT OUTBOX (RESEND API)
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'sent' && (
        <div className="space-y-4">
          <div className="card p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-mono font-bold uppercase tracking-wider" style={{ color: '#002B5B' }}>
                Outbound Dispatches Logged on Resend API
              </p>
              <p className="text-xs text-slate-500">
                Real-time history of emails sent from your Resend account (`GET /emails`).
              </p>
            </div>
            <button
              onClick={loadSent}
              disabled={sentLoading}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider text-white border transition-colors"
              style={{ background: '#002B5B', borderColor: '#0052CC' }}
            >
              <RefreshCw size={13} className={clsx(sentLoading && 'animate-spin')} />
              Refresh Sent List
            </button>
          </div>

          {sentError && (
            <div className="p-4 border-2 bg-red-50 border-red-600 text-red-800 text-xs font-mono">
              {sentError}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Sent List (5 cols) */}
            <div className="lg:col-span-5 border-2 bg-white flex flex-col max-h-[650px]" style={{ borderColor: '#002B5B' }}>
              <div className="px-4 py-3 border-b-2 flex items-center justify-between" style={{ background: '#002B5B', borderColor: '#0052CC' }}>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                  SENT EMAILS ({sentEmails.length})
                </span>
                <span className="text-[10px] font-mono" style={{ color: '#93C5FD' }}>
                  GET /emails
                </span>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-200">
                {sentLoading ? (
                  <div className="p-8 text-center text-xs font-mono text-slate-500 flex flex-col items-center gap-2">
                    <RefreshCw size={20} className="animate-spin" style={{ color: '#0052CC' }} />
                    LOADING SENT EMAILS…
                  </div>
                ) : sentEmails.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    No outbound emails found.
                  </div>
                ) : (
                  sentEmails.map(item => {
                    const active = selectedSentId === item.id
                    return (
                      <button
                        key={item.id}
                        onClick={() => openSentEmail(item.id)}
                        className="w-full text-left p-3.5 transition-colors border-l-4"
                        style={{
                          background: active ? '#EBF2FF' : '#FFFFFF',
                          borderLeftColor: active ? '#0052CC' : 'transparent',
                        }}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-bold truncate" style={{ color: '#002B5B' }}>
                            To: {Array.isArray(item.to) ? item.to.join(', ') : item.to}
                          </span>
                          <span
                            className="px-1.5 py-0.5 text-[10px] font-mono uppercase font-bold"
                            style={{ background: '#EBF2FF', color: '#0052CC' }}
                          >
                            {item.last_event || 'sent'}
                          </span>
                        </div>
                        <p className="text-xs font-semibold truncate mb-1" style={{ color: '#0052CC' }}>
                          {item.subject || '(No Subject)'}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400">
                          {item.created_at ? new Date(item.created_at).toLocaleString() : ''}
                        </p>
                      </button>
                    )
                  })
                )}
              </div>
            </div>

            {/* Sent Detail Pane (7 cols) */}
            <div className="lg:col-span-7 border-2 bg-white flex flex-col min-h-[480px] max-h-[650px]" style={{ borderColor: '#002B5B' }}>
              {sentDetailLoad ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-xs font-mono text-slate-500 gap-2">
                  <RefreshCw size={22} className="animate-spin" style={{ color: '#0052CC' }} />
                  LOADING SENT EMAIL DETAILS…
                </div>
              ) : !sentDetail ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                  <Send size={28} className="text-slate-300 mb-2" />
                  <p className="text-xs font-mono uppercase font-bold" style={{ color: '#002B5B' }}>
                    Select a sent email on the left to inspect its delivery status and content
                  </p>
                </div>
              ) : (
                <>
                  <div className="p-4 border-b-2 space-y-2" style={{ background: '#F8FAFC', borderColor: '#CBD5E1' }}>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-base" style={{ color: '#002B5B' }}>
                        {sentDetail.subject}
                      </h3>
                      <span
                        className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase border"
                        style={{ background: '#EBF2FF', borderColor: '#0052CC', color: '#002B5B' }}
                      >
                        STATUS: {sentDetail.last_event || 'SENT'}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs font-mono">
                      <div><span className="text-slate-400">FROM: </span><strong>{sentDetail.from}</strong></div>
                      <div><span className="text-slate-400">SENT: </span><span>{sentDetail.created_at ? new Date(sentDetail.created_at).toLocaleString() : '—'}</span></div>
                      <div className="sm:col-span-2">
                        <span className="text-slate-400">TO: </span>
                        <span>{Array.isArray(sentDetail.to) ? sentDetail.to.join(', ') : sentDetail.to}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-5 bg-white">
                    {sentDetail.html ? (
                      <div dangerouslySetInnerHTML={{ __html: sentDetail.html }} />
                    ) : (
                      <pre className="whitespace-pre-wrap font-sans text-sm text-slate-800">
                        {sentDetail.text || '(No content)'}
                      </pre>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
