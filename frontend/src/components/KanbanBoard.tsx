import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import KanbanCard from './KanbanCard'
import type { Pedido } from '../api/client'
import { getStatusLabelText, getStatusBgColor, getAgingInfo, calcMinutesSince } from '../utils/pedido'

interface KanbanBoardProps {
  pedidos: Pedido[]
  onAvancar: (id: number) => Promise<void>
  onPausar: (id: number) => void
  onRetomar: (id: number) => Promise<void>
  onCancelar: (id: number) => void
}

/** Tracks which card IDs failed and what action they had */
interface FailedCard {
  id: number
  action: string
}

const COLUMNS = [
  { status: 'pendente', icon: '⏳' },
  { status: 'producao', icon: '👩‍🍳' },
  { status: 'produzido', icon: '✅' },
  { status: 'entrega', icon: '🚚' },
  { status: 'entregue', icon: '🎉' },
  { status: 'pausado', icon: '⏸️' },
  { status: 'cancelado', icon: '❌' },
] as const

function Column({
  status,
  icon,
  pedidos,
  onAvancar,
  onPausar,
  onRetomar,
  onCancelar,
  onDetalhe,
  failedIds,
  onRetryCard,
}: {
  status: string
  icon: string
  pedidos: Pedido[]
  onAvancar: (id: number) => Promise<void>
  onPausar: (id: number) => void
  onRetomar: (id: number) => Promise<void>
  onCancelar: (id: number) => void
  onDetalhe: (id: number) => void
  failedIds: Set<number>
  onRetryCard?: (id: number) => void
}) {
  const hasAgingWarning = useMemo(() => {
    return pedidos.some(p => {
      const aging = getAgingInfo(calcMinutesSince(p.created_at))
      return aging.level !== 'fresh'
    })
  }, [pedidos])

  return (
    <div className={`rounded-xl border ${getStatusBgColor(status)} min-w-[280px] w-[280px] shrink-0 flex flex-col max-h-[calc(100vh-280px)]`}>
      {/* Column header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-inherit sticky top-0 bg-inherit z-10">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <h3 className="text-sm font-semibold text-primary">{getStatusLabelText(status)}</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200/60 text-gray-600 font-medium">
            {pedidos.length}
          </span>
        </div>
        {hasAgingWarning && pedidos.length > 0 && (
          <span className="text-xs text-amber-600">⚠️</span>
        )}
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin">
        {pedidos.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-gray-400">Nenhum pedido</p>
          </div>
        ) : (
          pedidos.map(p => (
            <KanbanCard
              key={p.id}
              pedido={p}
              failed={failedIds.has(p.id)}
              onAvancar={onAvancar}
              onPausar={onPausar}
              onRetomar={onRetomar}
              onCancelar={onCancelar}
              onDetalhe={onDetalhe}
              onRetry={onRetryCard}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default function KanbanBoard({ pedidos, onAvancar, onPausar, onRetomar, onCancelar }: KanbanBoardProps) {
  const navigate = useNavigate()
  const [failedCards, setFailedCards] = useState<FailedCard[]>([])

  /** Wraps an async action with error recovery — tracks failures for retry */
  function withRecovery(
    action: (id: number) => Promise<void>,
    actionName: string,
  ): (id: number) => Promise<void> {
    return async (id: number) => {
      try {
        // Remove from failed list if previously failed
        setFailedCards(prev => prev.filter(f => f.id !== id))
        await action(id)
      } catch (err) {
        // Only track network errors for retry — validation errors (400) show toast only
        const isNetworkError = err instanceof TypeError ||
          (err instanceof Error && (err.message.includes('fetch') || err.message.includes('network')))
        if (isNetworkError) {
          setFailedCards(prev => {
            const exists = prev.find(f => f.id === id)
            if (exists) return prev
            return [...prev, { id, action: actionName }]
          })
        }
        // Validation errors (400+) are not retried — the action handler shows its own toast
      }
    }
  }

  const grouped = useMemo(() => {
    const map: Record<string, Pedido[]> = {}
    for (const col of COLUMNS) {
      map[col.status] = []
    }
    for (const p of pedidos) {
      if (map[p.status]) {
        map[p.status].push(p)
      } else {
        map[COLUMNS[0].status].push(p)
      }
    }
    return map
  }, [pedidos])

  const handleDetalhe = (id: number) => navigate(`/admin/pedidos/${id}`)

  // Wrap callbacks with error recovery
  const safeAvancar = withRecovery(onAvancar, 'avancar')
  const safePausar = (id: number) => onPausar(id) // pausar opens modal, no network error recovery needed
  const safeRetomar = withRecovery(onRetomar, 'retomar')
  const safeCancelar = (id: number) => onCancelar(id) // cancelar opens modal, no network error recovery needed

  const failedIds = new Set(failedCards.map(f => f.id))

  /** Retry a single failed card — re-triggers the original action */
  const handleRetryCard = (id: number) => {
    const failed = failedCards.find(f => f.id === id)
    if (!failed) return
    setFailedCards(prev => prev.filter(f => f.id !== id))
    if (failed.action === 'avancar') onAvancar(id)
    else if (failed.action === 'retomar') onRetomar(id)
  }

  return (
    <div className="relative">
      {/* Error recovery banner */}
      {failedCards.length > 0 && (
        <div className="sticky bottom-0 z-50 bg-red-600 text-white px-4 py-2 rounded-xl shadow-lg text-sm flex items-center gap-3 mx-auto w-fit mb-2">
          <span>
            {failedCards.length} operaç{failedCards.length === 1 ? 'ão falhou' : 'ões falharam'}{' '}
            — clique no card para tentar novamente
          </span>
          <button
            onClick={() => setFailedCards([])}
            className="text-xs underline hover:no-underline whitespace-nowrap"
          >
            Ignorar
          </button>
        </div>
      )}

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
        {COLUMNS.map(col => (
          <Column
            key={col.status}
            status={col.status}
            icon={col.icon}
            pedidos={grouped[col.status] || []}
            onAvancar={safeAvancar}
            onPausar={safePausar}
            onRetomar={safeRetomar}
            onCancelar={safeCancelar}
            onDetalhe={handleDetalhe}
            onRetryCard={handleRetryCard}
            failedIds={failedIds}
          />
        ))}
      </div>
    </div>
  )
}
