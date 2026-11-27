'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/store/auth'
import { api, fmtUSD } from '@/lib/api'
import { Card, Button, SectionHeader, Divider } from '@/components/ui'
import { CreditCard, Clock, ShieldAlert, Eye, EyeOff, Landmark, Wifi, ArrowRightLeft } from 'lucide-react'
import { TransactionAuthModal } from '@/components/shared/TransactionAuthModal'

export default function DebitCardPage() {
  const { user, refreshUser, toast } = useAuth()
  const [cardFee, setCardFee] = useState(50)
  const [loading, setLoading] = useState(false)
  const [selectedType, setSelectedType] = useState('Visa')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [fundAmount, setFundAmount] = useState('')
  const [funding, setFunding] = useState(false)

  useEffect(() => {
    api.settings.getCardFee().then(d => setCardFee(d.cardFee ?? 50)).catch(() => {})
  }, [])

  if (!user) return null

  const handleFundCard = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(fundAmount)
    if (!amt || amt <= 0) { toast('Enter a valid amount', 'error'); return }
    if (amt > (user.balance || 0)) { toast('Insufficient checking balance', 'error'); return }

    setFunding(true)
    try {
      await api.users.fundCard({ amount: amt })
      await refreshUser()
      setFundAmount('')
      toast(`${fmtUSD(amt)} transferred to your debit card`, 'success')
    } catch (err: any) {
      toast(err.message || 'Failed to fund card', 'error')
    } finally {
      setFunding(false)
    }
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
    <div className="max-w-2xl mx-auto space-y-6 fade-up">
      <SectionHeader
        title="Virtual & Commercial Debit Card"
        sub="Manage your Blue ridge Bank debit card for online and international settlements"
      />

      {user.cardStatus === 'Not Requested' && (
        <Card className="p-6 md:p-8 rounded-3xl">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-white brand-card-gradient shadow-brand">
              <CreditCard size={34} />
            </div>
            <div>
              <h3 className="text-2xl font-bold font-display text-[#002B5B]">
                Issue a Blue ridge Bank Virtual Card
              </h3>
              <p className="text-sm text-slate-500 mt-2 max-w-md">
                Provision a Visa or Mastercard commercial debit card linked directly to your USD checking balance.
              </p>
            </div>

            <div className="w-full space-y-3">
              <p className="text-xs font-semibold text-left text-[#002B5B]">
                Select Settlement Network
              </p>
              <div className="grid grid-cols-2 gap-4">
                {['Visa', 'Mastercard'].map(type => {
                  const active = selectedType === type
                  return (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className="p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all cursor-pointer"
                      style={{
                        borderColor: active ? '#0052CC' : '#E2E8F0',
                        background: active ? '#EBF2FF' : '#F8FAFC',
                        color: '#002B5B',
                      }}
                    >
                      <span className="font-bold text-sm">{type} Commercial</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <Divider className="w-full" />

            <div className="w-full flex justify-between items-center p-4 rounded-2xl bg-[#F4F7FC] border border-slate-200/80">
              <span className="text-xs font-semibold text-slate-500">
                One-Time Provisioning Fee
              </span>
              <span className="text-lg font-mono font-bold text-[#002B5B]">{fmtUSD(cardFee)}</span>
            </div>

            <Button
              variant="primary"
              className="w-full py-4 rounded-full"
              loading={loading}
              onClick={handleRequest}
            >
              Request {selectedType} Debit Card
            </Button>
          </div>
        </Card>
      )}

      {user.cardStatus === 'Pending Approval' && (
        <Card className="p-8 text-center flex flex-col items-center rounded-3xl">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5 bg-[#EBF2FF] text-[#0052CC]">
            <Clock size={30} />
          </div>
          <h3 className="text-xl font-bold font-display mb-2 text-[#002B5B]">
            Card Provisioning Pending Approval
          </h3>
          <p className="text-sm text-slate-500 max-w-md">
            Your request for a {user.cardType} commercial debit card has been logged and is currently awaiting authorization by our card desk.
          </p>
        </Card>
      )}

      {user.cardStatus === 'Blocked' && (
        <Card className="p-8 text-center flex flex-col items-center rounded-3xl">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5 bg-red-50 text-red-600">
            <ShieldAlert size={30} />
          </div>
          <h3 className="text-xl font-bold font-display mb-2 text-[#002B5B]">
            Card Suspended
          </h3>
          <p className="text-sm text-slate-500">
            Your debit card is currently restricted. Please contact support@theblueridges.com for assistance.
          </p>
        </Card>
      )}

      {user.cardStatus === 'Active' && (
        <div className="space-y-6">
          {/* Luminous Brand Debit Card */}
          <div className="relative w-full max-w-md mx-auto min-h-[215px] sm:aspect-[1.586/1] p-5 sm:p-7 rounded-3xl brand-card-gradient text-white flex flex-col justify-between shadow-float overflow-hidden">
            <svg
              className="absolute inset-0 w-full h-full opacity-20 pointer-events-none"
              viewBox="0 0 400 240"
              fill="none"
              preserveAspectRatio="none"
            >
              <circle cx="340" cy="30" r="110" fill="#60A5FA" fillOpacity="0.35" />
              <circle cx="60" cy="210" r="95" fill="#FFFFFF" fillOpacity="0.18" />
              <path d="M-20 175 C 90 120, 210 220, 420 105" stroke="#93C5FD" strokeWidth="1.5" strokeOpacity="0.55" />
            </svg>

            <div className="relative z-10 flex justify-between items-center pb-3 border-b border-white/15 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Landmark size={15} className="flex-shrink-0 text-[#60A5FA]" />
                <span className="text-xs font-bold tracking-wide truncate">
                  Blue ridge Bank
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-white/15 text-white flex-shrink-0">
                {user.cardType} Debit
              </span>
            </div>

            <div className="relative z-10 space-y-3 my-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-6 sm:w-11 sm:h-7 rounded-md bg-white/15 border border-white/25 flex items-center justify-center text-[9px] font-bold text-blue-100">
                  EMV
                </div>
                <Wifi size={16} className="text-blue-200 rotate-90" />
              </div>
              <div className="text-base sm:text-2xl font-mono tracking-wider sm:tracking-widest font-bold text-white whitespace-nowrap">
                {revealed ? (user.cardNumber || '#### #### #### ####') : '•••• •••• •••• ' + String(user.cardNumber || '0000').slice(-4)}
              </div>
            </div>

            <div className="relative z-10 flex justify-between items-end pt-3 border-t border-white/15 gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-[10px] text-blue-200">Cardholder</div>
                <div className="text-xs sm:text-sm font-semibold text-white truncate">
                  {user.firstName} {user.lastName}
                </div>
              </div>
              <div className="flex gap-4 sm:gap-5 flex-shrink-0">
                <div>
                  <div className="text-[10px] text-blue-200">Expires</div>
                  <div className="font-mono text-xs sm:text-sm font-bold text-white">
                    {revealed ? (user.cardExpiry || '##/##') : '••/••'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-blue-200">CVV</div>
                  <div className="font-mono text-xs sm:text-sm font-bold text-white">
                    {revealed ? (user.cvv || '###') : '•••'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {!revealed ? (
            <Button variant="primary" className="w-full max-w-md mx-auto rounded-full flex items-center justify-center gap-2" onClick={handleReveal}>
              <Eye size={16} /> Reveal Full Card Credentials
            </Button>
          ) : (
            <Button variant="secondary" className="w-full max-w-md mx-auto rounded-full flex items-center justify-center gap-2" onClick={() => setRevealed(false)}>
              <EyeOff size={16} /> Mask Card Credentials
            </Button>
          )}

          {/* Card Balance & Transfer from Checking */}
          <Card className="p-6 max-w-md mx-auto space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#EBF2FF] border border-blue-200/70">
                <p className="text-[11px] font-semibold text-[#0052CC]">Card Balance</p>
                <p className="font-mono text-xl font-bold text-[#002B5B] mt-0.5">
                  {fmtUSD(user.cardBalance || 0)}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#F4F7FC] border border-slate-200/80">
                <p className="text-[11px] font-semibold text-slate-500">Checking Balance</p>
                <p className="font-mono text-xl font-bold text-[#002B5B] mt-0.5">
                  {fmtUSD(user.balance || 0)}
                </p>
              </div>
            </div>

            <form onSubmit={handleFundCard} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#002B5B] mb-1.5">
                  Transfer Money from Checking Balance to Card
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">$</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:border-[#0052CC] text-sm font-mono outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {[50, 100, 500, 1000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setFundAmount(String(preset))}
                    className="px-3 py-1 rounded-full text-xs font-semibold border border-slate-200 bg-slate-50 hover:bg-[#EBF2FF] text-[#002B5B] transition-colors cursor-pointer"
                  >
                    +${preset}
                  </button>
                ))}
              </div>

              <Button type="submit" variant="primary" className="w-full rounded-full" loading={funding}>
                <ArrowRightLeft size={15} /> Transfer Funds to Card
              </Button>
              <p className="text-[11px] text-slate-500 text-center">
                Card withdrawals draw from your Card Balance.
              </p>
            </form>
          </Card>
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
