import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import KanbanCard from './KanbanCard'
import type { Pedido } from '../api/client'
import { getStatusLabel, getStatusBgColor, getAgingInfo, calcMinutesSince } from '../utils/pedido'

interface KanbanBoardProps {
  pedidos: Pedido[]
  onAvancar: (id: number) => void
  onPausar: (id: number) => void
  onRetomar: (id: number) => void
  onCancelar: (id: number) => void
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
}: {
  status: string
  icon: string
  pedidos: Pedido[]
  onAvancar: (id: number) => void
  onPausar: (id: number) => void
  onRetomar: (id: number) => void
  onCancelar: (id: number) => void
  onDetalhe: (id: number) => void
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
          <h3 className="text-sm font-semibold text-primary">{getStatusLabel(status).replace(/^.{2} /, '')}</h3>
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
              onAvancar={onAvancar}
              onPausar={onPausar}
              onRetomar={onRetomar}
              onCancelar={onCancelar}
              onDetalhe={onDetalhe}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default function KanbanBoard({ pedidos, onAvancar, onPausar, onRetomar, onCancelar }: KanbanBoardProps) {
  const navigate = useNavigate()

  const grouped = useMemo(() => {
    const map: Record<string, Pedido[]> = {}
    for (const col of COLUMNS) {
      map[col.status] = []
    }
    for (const p of pedidos) {
      if (map[p.status]) {
        map[p.status].push(p)
      } else {
        // Unknown status — put in first column as fallback
        map[COLUMNS[0].status].push(p)
      }
    }
    return map
  }, [pedidos])

  const handleDetalhe = (id: number) => navigate(`/admin/pedidos/${id}`)

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
      {COLUMNS.map(col => (
        <Column
          key={col.status}
          status={col.status}
          icon={col.icon}
          pedidos={grouped[col.status] || []}
          onAvancar={onAvancar}
          onPausar={onPausar}
          onRetomar={onRetomar}
          onCancelar={onCancelar}
          onDetalhe={handleDetalhe}
        />
      ))}
    </div>
  )
}
