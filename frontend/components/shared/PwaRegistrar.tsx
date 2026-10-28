'use client'
import { useEffect, useState } from 'react'
import { Download, X, Smartphone, Check } from 'lucide-react'

// Global reference for deferred install prompt
let deferredInstallPrompt: any = null

export function triggerPwaInstall(onDismiss?: () => void) {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt()
    deferredInstallPrompt.userChoice.then((choiceResult: { outcome: string }) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA] User accepted the install prompt')
      }
      deferredInstallPrompt = null
      if (onDismiss) onDismiss()
    })
    return true
  }
  return false
}

export function PwaRegistrar() {
  const [canInstall, setCanInstall] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showIosGuide, setShowIosGuide] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('[PWA] Service Worker registered successfully with scope:', reg.scope)
          })
          .catch((err) => {
            console.warn('[PWA] Service Worker registration failed:', err)
          })
      })
    }

    // Check if already installed in standalone mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    if (isStandalone) {
      setIsInstalled(true)
      return
    }

    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase()
    const isAppleDevice = /iphone|ipad|ipod/.test(ua)
    if (isAppleDevice && !isStandalone) {
      setIsIOS(true)
    }

    // Capture beforeinstallprompt for Chrome / Edge / Android
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      deferredInstallPrompt = e
      setCanInstall(true)
      window.dispatchEvent(new Event('pwa-prompt-available'))
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setCanInstall(false)
      deferredInstallPrompt = null
      console.log('[PWA] Blue ridge Bank app installed')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Check localStorage if banner was dismissed recently
    const dismissed = sessionStorage.getItem('pwa_banner_dismissed')
    if (dismissed) setBannerDismissed(true)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = () => {
    if (canInstall && deferredInstallPrompt) {
      triggerPwaInstall(() => {
        setCanInstall(false)
        setBannerDismissed(true)
      })
    } else if (isIOS) {
      setShowIosGuide(true)
    }
  }

  const handleDismiss = () => {
    setBannerDismissed(true)
    sessionStorage.setItem('pwa_banner_dismissed', 'true')
  }

  if (isInstalled || bannerDismissed || (!canInstall && !isIOS)) {
    return null
  }

  return (
    <>
      {/* Floating Bottom PWA Install Banner */}
      <div
        className="fixed bottom-20 lg:bottom-5 left-4 right-4 sm:left-auto sm:right-24 z-[70] max-w-sm border-2 shadow-2xl p-3.5 flex items-center justify-between gap-3 text-slate-900 transition-all"
        style={{
          background: '#FFFFFF',
          borderColor: '#002B5B',
        }}
        role="region"
        aria-label="Install Blue ridge Bank Application"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 flex items-center justify-center text-white flex-shrink-0"
            style={{ background: '#002B5B' }}
          >
            <Smartphone size={20} style={{ color: '#93C5FD' }} />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-xs uppercase tracking-wider" style={{ color: '#002B5B' }}>
              Install Blue ridge Bank
            </p>
            <p className="text-[11px] text-slate-600 truncate">
              Fast, secure offline-ready banking app
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-95"
            style={{ background: '#0052CC' }}
          >
            <Download size={13} />
            <span>Install</span>
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors"
            title="Dismiss"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* iOS Safari Install Guide Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
          <div
            className="bg-white max-w-sm w-full p-5 border-2 shadow-2xl space-y-4"
            style={{ borderColor: '#002B5B' }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: '#CBD5E1' }}>
              <div className="flex items-center gap-2">
                <Smartphone size={18} style={{ color: '#0052CC' }} />
                <h3 className="font-bold text-sm uppercase tracking-wider" style={{ color: '#002B5B' }}>
                  Install on iOS
                </h3>
              </div>
              <button onClick={() => setShowIosGuide(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3 text-xs text-slate-700">
              <div className="flex items-start gap-2.5">
                <span
                  className="w-5 h-5 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
                  style={{ background: '#002B5B' }}
                >
                  1
                </span>
                <p>Tap the <strong>Share</strong> button at the bottom of Safari.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <span
                  className="w-5 h-5 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
                  style={{ background: '#002B5B' }}
                >
                  2
                </span>
                <p>Scroll down and select <strong>&quot;Add to Home Screen&quot;</strong>.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <span
                  className="w-5 h-5 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
                  style={{ background: '#002B5B' }}
                >
                  3
                </span>
                <p>Tap <strong>Add</strong> in the top right to install Blue ridge Bank to your home screen.</p>
              </div>
            </div>
            <button
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2 text-xs font-bold uppercase tracking-wider text-white"
              style={{ background: '#002B5B' }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  )
}
