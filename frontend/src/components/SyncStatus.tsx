import { useEffect, useState } from 'react'
import { Upload, RefreshCw, CheckCircle } from 'lucide-react'
import { onPendingChange, obterFilaPendente, sincronizarAgora } from '../services/mutationQueue'

export default function SyncStatus() {
  const [pending, setPending] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [feedback, setFeedback] = useState<'idle' | 'syncing' | 'done' | 'error'>('idle')

  useEffect(() => {
    obterFilaPendente().then(setPending)
    const unsub = onPendingChange(setPending)
    return () => { unsub() }
  }, [])

  if (pending === 0 && !syncing) return null

  const handleSync = async () => {
    setSyncing(true)
    setFeedback('syncing')
    try {
      const result = await sincronizarAgora()
      if (result.synced > 0) {
        setFeedback('done')
        setTimeout(() => setFeedback('idle'), 2000)
      } else if (result.failed > 0) {
        setFeedback('error')
        setTimeout(() => setFeedback('idle'), 3000)
      } else {
        setFeedback('idle')
      }
    } catch {
      setFeedback('error')
      setTimeout(() => setFeedback('idle'), 3000)
    } finally {
      setSyncing(false)
    }
  }

  const icon = feedback === 'syncing' ? <RefreshCw className="w-4 h-4 animate-spin" />
    : feedback === 'done' ? <CheckCircle className="w-4 h-4" />
    : feedback === 'error' ? <Upload className="w-4 h-4" />
    : <Upload className="w-4 h-4" />

  const bg = feedback === 'done' ? 'bg-green-500'
    : feedback === 'error' ? 'bg-red-500'
    : 'bg-amber-500'

  const label = feedback === 'syncing' ? 'Sincronizando…'
    : feedback === 'done' ? 'Sincronizado!'
    : feedback === 'error' ? 'Erro ao sincronizar'
    : `${pending} pendente${pending > 1 ? 's' : ''}`

  return (
    <button
      onClick={handleSync}
      disabled={syncing}
      title="Clique para sincronizar operações offline"
      className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 ${bg} text-white rounded-full shadow-lg text-xs font-medium transition-all hover:opacity-90 disabled:opacity-70`}
    >
      {icon}
      {label}
    </button>
  )
}
