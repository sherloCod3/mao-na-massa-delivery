import { History } from 'lucide-react'
import type { StatusHistoryItem } from '../api/client'
import { getStatusLabel } from '../utils/pedido'

interface StatusHistoryTimelineProps {
  historico: StatusHistoryItem[]
}

const EMOJI_MAP: Record<string, string> = {
  pendente: '⏳',
  producao: '👩‍🍳',
  produzido: '✅',
  entrega: '🚚',
  entregue: '🎉',
  pausado: '⏸️',
  cancelado: '❌',
}

const COLOR_MAP: Record<string, string> = {
  pendente: 'border-amber-400',
  producao: 'border-blue-400',
  produzido: 'border-emerald-400',
  entrega: 'border-purple-400',
  entregue: 'border-green-400',
  pausado: 'border-orange-400',
  cancelado: 'border-red-400',
}

export default function StatusHistoryTimeline({ historico }: StatusHistoryTimelineProps) {
  if (!historico || historico.length === 0) return null

  return (
    <div className="bg-white card p-4 sm:p-6 mb-4 sm:mb-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <History className="w-5 h-5 text-gray-500" /> Histórico de Status
      </h2>
      <div className="space-y-0">
        {historico.map((h, idx) => {
          const isLast = idx === 0
          const isRetorno = h.status_novo === h.status_anterior && h.status_novo !== 'pausado'
          return (
            <div key={h.id} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 border-2 ${
                  COLOR_MAP[h.status_novo] || 'border-gray-300'
                } ${isLast ? 'bg-white shadow-sm' : 'bg-gray-50'}`}>
                  {isLast ? EMOJI_MAP[h.status_novo] || '📌' : '○'}
                </div>
                {idx < historico.length - 1 && (
                  <div className="w-0.5 h-8 bg-gray-200" />
                )}
              </div>
              <div className={`pb-4 ${isLast ? '' : 'opacity-70'}`}>
                <p className="text-sm font-medium text-primary">
                  {isRetorno ? '↩️ Retomado' : EMOJI_MAP[h.status_novo] || '📌'} {getStatusLabel(h.status_novo).replace(/^.{2} /, '')}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {new Date(h.created_at).toLocaleString('pt-BR')}
                </p>
                {h.motivo && (
                  <p className="text-xs text-gray-600 mt-0.5 italic">
                    &quot;{h.motivo}&quot;
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
