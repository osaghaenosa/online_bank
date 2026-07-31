'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/store/auth'
import { api, fmtUSD } from '@/lib/api'
import { Card, Button, SectionHeader, Divider } from '@/components/ui'
import { CreditCard, Clock, ShieldAlert, CheckCircle, Eye } from 'lucide-react'
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

  // BLOCK UNVERIFIED USERS
  const kyc = (user as any)?.kyc
  if (kyc === 'Pending') {
    return (
      <div className="max-w-2xl mx-auto mt-12 text-center">
        <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mx-auto mb-6">
          <Clock size={40} />
        </div>
        <h2 className="text-3xl font-bold font-display text-gray-900 mb-4">Verification Pending</h2>
        <p className="text-gray-500 mb-2">Your KYC documents are currently under review by our team.</p>
        <p className="text-gray-400 text-sm mb-8">You'll be notified once your account is verified. This usually takes 1–2 business days.</p>
        <Button variant="secondary" onClick={() => window.location.href = '/dashboard'}>Back to Dashboard</Button>
      </div>
    )
  }
  if (kyc !== 'Verified') {
    return (
      <div className="max-w-2xl mx-auto mt-12 text-center">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center text-red-600 mx-auto mb-6">
          <ShieldAlert size={40} />
        </div>
        <h2 className="text-3xl font-bold font-display text-gray-900 mb-4">{kyc === 'Rejected' ? 'KYC Declined' : 'KYC Required'}</h2>
        <p className="text-gray-500 mb-8">
          {kyc === 'Rejected'
            ? 'Your KYC submission was declined. Please re-submit your documents to access this feature.'
            : 'You must complete KYC verification before you can request a debit card.'}
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="secondary" onClick={() => window.location.href = '/dashboard'}>Back to Dashboard</Button>
          <Button variant="primary" onClick={() => window.location.href = '/kyc'}>{kyc === 'Rejected' ? 'Re-submit KYC' : 'Complete KYC'}</Button>
        </div>
      </div>
    )
  }

  const handleRequest = async () => {
    if ((user.balance || 0) < cardFee) {
      toast('Insufficient funds to cover the card fee.', 'error')
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

  const onAuthSuccess = async (pin: string, trackTokenNumber?: string) => {
    setRevealed(true)
    setShowAuthModal(false)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in">
      <SectionHeader 
        title="Virtual Debit Card" 
        sub="Manage your debit card for online purchases" 
      />

      {user.cardStatus === 'Not Requested' && (
        <Card className="p-6 md:p-8">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mb-2" style={{ background: 'rgba(var(--color-primary-rgb), 0.1)', color: 'var(--color-primary)' }}>
              <CreditCard size={48} />
            </div>
            <div>
              <h3 className="text-2xl font-bold font-display">Get Your Virtual Card</h3>
              <p className="text-gray-500 mt-2">
                Instantly request a Visa or Mastercard for online shopping. A one-time issuance fee applies.
              </p>
            </div>
            
            <div className="w-full space-y-4">
              <p className="font-semibold text-lg text-left">Choose Card Network</p>
              <div className="grid grid-cols-2 gap-4">
                {['Visa', 'Mastercard'].map(type => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className="p-4 border-2 rounded-2xl flex flex-col items-center gap-2 transition-all cursor-pointer"
                    style={{
                      borderColor: selectedType === type ? 'var(--color-primary)' : 'var(--color-border)',
                      background: selectedType === type ? 'rgba(var(--color-primary-rgb), 0.05)' : 'var(--color-surface)',
                    }}
                  >
                    <span className="font-bold">{type}</span>
                  </button>
                ))}
              </div>
            </div>

            <Divider className="w-full" />
            
            <div className="w-full flex justify-between items-center bg-gray-50 p-4 rounded-xl dark:bg-gray-800 border">
              <span className="font-semibold text-gray-500">Issuance Fee</span>
              <span className="text-xl font-bold">{fmtUSD(cardFee)}</span>
            </div>

            <Button 
              variant="primary" 
              className="w-full py-4 text-lg" 
              loading={loading} 
              onClick={handleRequest}
            >
              Request {selectedType} Card
            </Button>
          </div>
        </Card>
      )}

      {user.cardStatus === 'Pending Approval' && (
        <Card className="p-8 text-center flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-6">
            <Clock size={40} />
          </div>
          <h3 className="text-2xl font-bold font-display mb-2">Card Pending Approval</h3>
          <p className="text-gray-500">
            Your request for a {user.cardType} card has been received and is currently under review by our team.
          </p>
        </Card>
      )}

      {user.cardStatus === 'Blocked' && (
        <Card className="p-8 text-center flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-6">
            <ShieldAlert size={40} />
          </div>
          <h3 className="text-2xl font-bold font-display mb-2">Card Blocked</h3>
          <p className="text-gray-500">
            Your debit card is currently blocked. Please contact support for assistance.
          </p>
        </Card>
      )}

      {user.cardStatus === 'Active' && (
        <div className="space-y-6">
          <div className="relative w-full max-w-md mx-auto aspect-[1.586/1] rounded-2xl overflow-hidden p-6 text-white flex flex-col justify-between shadow-2xl transition-all"
               style={{ background: user.cardType === 'Mastercard' ? 'linear-gradient(135deg, #FF5F6D 0%, #FFC371 100%)' : 'linear-gradient(135deg, #1A2980 0%, #26D0CE 100%)' }}>
            <div className="flex justify-between items-start">
              <div className="w-12 h-8 bg-yellow-400 rounded opacity-80" style={{ background: 'linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%)' }} />
              <div className="text-2xl font-bold italic opacity-80">{user.cardType}</div>
            </div>
            
            <div className="space-y-1">
              <div className="text-2xl font-mono tracking-widest drop-shadow-md">
                {revealed ? (user.cardNumber || '#### #### #### ####') : '•••• •••• •••• ••••'}
              </div>
            </div>

            <div className="flex justify-between items-end">
              <div>
                <div className="text-[10px] uppercase tracking-wider opacity-70 mb-1">Card Holder</div>
                <div className="font-semibold tracking-wider drop-shadow-md">{user.firstName} {user.lastName}</div>
              </div>
              <div className="flex gap-4">
                <div>
                  <div className="text-[10px] uppercase tracking-wider opacity-70 mb-1">Expires</div>
                  <div className="font-mono tracking-wider drop-shadow-md">{revealed ? (user.cardExpiry || '##/##') : '••/••'}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider opacity-70 mb-1">CVV</div>
                  <div className="font-mono tracking-wider drop-shadow-md">{revealed ? (user.cvv || '###') : '•••'}</div>
                </div>
              </div>
            </div>
          </div>

          {!revealed ? (
            <Button variant="primary" className="w-full max-w-md mx-auto flex items-center justify-center gap-2" onClick={handleReveal}>
              <Eye size={18} /> Reveal Card Details
            </Button>
          ) : (
            <Button variant="secondary" className="w-full max-w-md mx-auto flex items-center justify-center gap-2" onClick={() => setRevealed(false)}>
              Hide Details
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
