'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/store/auth'
import { api, fmtUSD } from '@/lib/api'
import { Card, Button, SectionHeader, Divider } from '@/components/ui'
import { CreditCard, Clock, ShieldAlert, Eye, Landmark } from 'lucide-react'
import { TransactionAuthModal } from '@/components/shared/TransactionAuthModal'

export default function DebitCardPage() {
  const { user, refreshUser, toast } = useAuth()
  const [cardFee, setCardFee] = useState(50)
  const [loading, setLoading] = useState(false)
  const [selectedType, setSelectedType] = useState('Visa')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    api.settings.getCardFee().then(d => setCardFee(d.cardFee ?? 50)).catch(() => {})
  }, [])

  if (!user) return null

  const kyc = (user as any)?.kyc
  if (kyc === 'Pending') {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <Card className="p-8 text-center">
          <div
            className="w-16 h-16 flex items-center justify-center text-white mx-auto mb-5"
            style={{ background: '#0052CC' }}
          >
            <Clock size={32} />
          </div>
          <h2 className="text-2xl font-bold font-display mb-3" style={{ color: '#002B5B' }}>
            KYC Verification Under Review
          </h2>
          <p className="text-sm text-slate-600 mb-2">
            Your KYC compliance documents are currently under review by our onboarding team.
          </p>
          <p className="text-xs text-slate-500 mb-6">
            Card issuance will unlock automatically once verification completes (1–2 business days).
          </p>
          <Button variant="secondary" onClick={() => window.location.href = '/dashboard'}>
            Return to Account Overview
          </Button>
        </Card>
      </div>
    )
  }

  if (kyc !== 'Verified') {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <Card className="p-8 text-center">
          <div
            className="w-16 h-16 flex items-center justify-center text-white mx-auto mb-5"
            style={{ background: '#002B5B' }}
          >
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-2xl font-bold font-display mb-3" style={{ color: '#002B5B' }}>
            {kyc === 'Rejected' ? 'KYC Verification Declined' : 'Identity Verification Required'}
          </h2>
          <p className="text-sm text-slate-600 mb-8">
            {kyc === 'Rejected'
              ? 'Your previous KYC submission was declined. Please re-submit your verification documents to request a commercial debit card.'
              : 'You must complete KYC compliance verification before requesting a virtual or commercial debit card.'}
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="secondary" onClick={() => window.location.href = '/dashboard'}>
              Return to Overview
            </Button>
            <Button variant="primary" onClick={() => window.location.href = '/kyc'}>
              {kyc === 'Rejected' ? 'Re-submit KYC' : 'Complete KYC Verification'}
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const handleRequest = async () => {
    if ((user.balance || 0) < cardFee) {
      toast('Insufficient funds to cover the card issuance fee.', 'error')
      return
    }

    setLoading(true)
    try {
      await api.users.requestCard({ cardType: selectedType })
      await refreshUser()
      toast('Card requested successfully!', 'success')
    } catch (err: any) {
      toast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleReveal = () => {
    setShowAuthModal(true)
  }

  const onAuthSuccess = async () => {
    setRevealed(true)
    setShowAuthModal(false)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in">
      <SectionHeader
        title="Virtual & Commercial Debit Card"
        sub="Manage your Blue ridge Bank debit card for online and international settlements"
      />

      {user.cardStatus === 'Not Requested' && (
        <Card className="p-6 md:p-8">
          <div className="flex flex-col items-center text-center space-y-6">
            <div
              className="w-20 h-20 flex items-center justify-center mb-1 text-white"
              style={{ background: '#002B5B' }}
            >
              <CreditCard size={40} />
            </div>
            <div>
              <h3 className="text-2xl font-bold font-display" style={{ color: '#002B5B' }}>
                Issue a Blue ridge Bank Virtual Card
              </h3>
              <p className="text-sm text-slate-600 mt-2 max-w-md">
                Provision a Visa or Mastercard commercial debit card linked directly to your USD checking balance.
              </p>
            </div>

            <div className="w-full space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-left" style={{ color: '#002B5B' }}>
                Select Settlement Network
              </p>
              <div className="grid grid-cols-2 gap-4">
                {['Visa', 'Mastercard'].map(type => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className="p-4 border-2 flex flex-col items-center gap-2 transition-all cursor-pointer"
                    style={{
                      borderColor: selectedType === type ? '#0052CC' : '#CBD5E1',
                      background: selectedType === type ? '#EBF2FF' : '#FFFFFF',
                      color: '#002B5B',
                    }}
                  >
                    <span className="font-bold uppercase tracking-wider text-sm">{type} Commercial</span>
                  </button>
                ))}
              </div>
            </div>

            <Divider className="w-full" />

            <div
              className="w-full flex justify-between items-center p-4 border"
              style={{ background: '#F8FAFC', borderColor: '#CBD5E1' }}
            >
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#475569' }}>
                One-Time Provisioning Fee
              </span>
              <span className="text-lg font-mono font-bold" style={{ color: '#002B5B' }}>{fmtUSD(cardFee)}</span>
            </div>

            <Button
              variant="primary"
              className="w-full py-4"
              loading={loading}
              onClick={handleRequest}
            >
              Request {selectedType} Debit Card
            </Button>
          </div>
        </Card>
      )}

      {user.cardStatus === 'Pending Approval' && (
        <Card className="p-8 text-center flex flex-col items-center">
          <div className="w-16 h-16 flex items-center justify-center mb-5 text-white" style={{ background: '#0052CC' }}>
            <Clock size={32} />
          </div>
          <h3 className="text-xl font-bold font-display mb-2" style={{ color: '#002B5B' }}>
            Card Provisioning Pending Approval
          </h3>
          <p className="text-sm text-slate-600 max-w-md">
            Your request for a {user.cardType} commercial debit card has been logged and is currently awaiting authorization by our card desk.
          </p>
        </Card>
      )}

      {user.cardStatus === 'Blocked' && (
        <Card className="p-8 text-center flex flex-col items-center">
          <div className="w-16 h-16 flex items-center justify-center mb-5 bg-red-600 text-white">
            <ShieldAlert size={32} />
          </div>
          <h3 className="text-xl font-bold font-display mb-2" style={{ color: '#002B5B' }}>
            Card Suspended
          </h3>
          <p className="text-sm text-slate-600">
            Your debit card is currently restricted. Please contact support@theblueridges.com for assistance.
          </p>
        </Card>
      )}

      {user.cardStatus === 'Active' && (
        <div className="space-y-6">
          {/* Solid Blue Institutional Card */}
          <div
            className="relative w-full max-w-md mx-auto min-h-[205px] sm:aspect-[1.586/1] p-4 sm:p-6 text-white flex flex-col justify-between shadow-xl border-2"
            style={{
              background: '#002B5B',
              borderColor: '#0052CC',
            }}
          >
            <div className="flex justify-between items-center pb-2.5 sm:pb-3 border-b gap-2" style={{ borderColor: '#1E3A5F' }}>
              <div className="flex items-center gap-2 min-w-0">
                <Landmark size={15} className="flex-shrink-0" style={{ color: '#60A5FA' }} />
                <span className="text-xs font-bold uppercase tracking-wider truncate">
                  BLUE RIDGE BANK
                </span>
              </div>
              <div
                className="px-2 py-0.5 text-[10px] sm:text-xs font-bold uppercase flex-shrink-0"
                style={{ background: '#0052CC', color: '#FFFFFF' }}
              >
                {user.cardType} DEBIT
              </div>
            </div>

            <div className="space-y-2 my-3">
              <div
                className="w-10 h-6 sm:w-11 sm:h-7 border flex items-center justify-center text-[9px] font-bold"
                style={{ background: '#001F42', borderColor: '#60A5FA', color: '#93C5FD' }}
              >
                EMV
              </div>
              <div className="text-base sm:text-2xl font-mono tracking-wider sm:tracking-widest font-bold text-white whitespace-nowrap">
                {revealed ? (user.cardNumber || '#### #### #### ####') : '•••• •••• •••• ' + String(user.cardNumber || '0000').slice(-4)}
              </div>
            </div>

            <div className="flex justify-between items-end pt-2.5 sm:pt-3 border-t gap-3" style={{ borderColor: '#1E3A5F' }}>
              <div className="min-w-0 flex-1">
                <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: '#93C5FD' }}>
                  CARDHOLDER
                </div>
                <div className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white truncate">
                  {user.firstName} {user.lastName}
                </div>
              </div>
              <div className="flex gap-4 sm:gap-5 flex-shrink-0">
                <div>
                  <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: '#93C5FD' }}>
                    EXPIRES
                  </div>
                  <div className="font-mono text-xs sm:text-sm font-bold text-white">
                    {revealed ? (user.cardExpiry || '##/##') : '••/••'}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: '#93C5FD' }}>
                    CVV
                  </div>
                  <div className="font-mono text-xs sm:text-sm font-bold text-white">
                    {revealed ? (user.cvv || '###') : '•••'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {!revealed ? (
            <Button variant="primary" className="w-full max-w-md mx-auto flex items-center justify-center gap-2" onClick={handleReveal}>
              <Eye size={16} /> Reveal Full Card Credentials
            </Button>
          ) : (
            <Button variant="secondary" className="w-full max-w-md mx-auto flex items-center justify-center gap-2" onClick={() => setRevealed(false)}>
              Mask Card Credentials
            </Button>
          )}
        </div>
      )}

      <TransactionAuthModal
        isOpen={showAuthModal}
        requireTtn={false}
        onConfirm={onAuthSuccess}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  )
}
