import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      if (!localStorage.getItem('pwa-install-dismissed')) {
        setShowBanner(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const result = await deferredPrompt.userChoice
    if (result.outcome === 'accepted') {
      setShowBanner(false)
      localStorage.setItem('pwa-install-dismissed', 'true')
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowBanner(false)
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 max-w-sm mx-auto">
      <div className="bg-white border border-massa-200 rounded-2xl shadow-xl p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-massa-100 rounded-xl flex items-center justify-center">
              <Download className="w-5 h-5 text-massa-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Instalar App</p>
              <p className="text-xs text-gray-500">Adicione à tela inicial</p>
            </div>
          </div>
          <button onClick={handleDismiss} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={handleInstall}
          className="w-full bg-massa-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-massa-700 transition-colors"
        >
          Instalar Mão na Massa
        </button>
        <p className="text-xs text-gray-400 text-center mt-2">
          Acesso rápido e funciona offline
        </p>
      </div>
    </div>
  )
}
