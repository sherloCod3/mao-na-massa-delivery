import { RefreshCw, MessageCircle, Search, Play, Pause, X, RotateCcw, CheckCircle, Truck, AlertTriangle } from 'lucide-react'
import type { Pedido } from '../api/client'
import { getAgingInfo, calcMinutesSince } from '../utils/pedido'
import { gerarLinkWhatsApp, mensagemNovoPedido } from '../utils/whatsapp'

interface KanbanCardProps {
  pedido: Pedido
  failed?: boolean
  onAvancar?: (id: number) => void
  onPausar?: (id: number) => void
  onRetomar?: (id: number) => void
  onCancelar?: (id: number) => void
  onDetalhe?: (id: number) => void
  /** Called when user clicks retry on a failed card — parent determines which action to retry */
  onRetry?: (id: number) => void
}

const ACTION_BUTTONS: Record<string, Array<{
  label: string
  icon: React.ReactNode
  action: 'avancar' | 'pausar' | 'retomar' | 'cancelar'
  color: string
  hoverColor: string
}>> = {
  pendente: [
    { label: 'Iniciar', icon: <Play className="w-3.5 h-3.5" />, action: 'avancar', color: 'text-blue-600', hoverColor: 'hover:bg-blue-50' },
    { label: 'Pausar', icon: <Pause className="w-3.5 h-3.5" />, action: 'pausar', color: 'text-orange-600', hoverColor: 'hover:bg-orange-50' },
    { label: 'Cancelar', icon: <X className="w-3.5 h-3.5" />, action: 'cancelar', color: 'text-red-600', hoverColor: 'hover:bg-red-50' },
  ],
  producao: [
    { label: 'Concluir', icon: <CheckCircle className="w-3.5 h-3.5" />, action: 'avancar', color: 'text-emerald-600', hoverColor: 'hover:bg-emerald-50' },
    { label: 'Pausar', icon: <Pause className="w-3.5 h-3.5" />, action: 'pausar', color: 'text-orange-600', hoverColor: 'hover:bg-orange-50' },
    { label: 'Cancelar', icon: <X className="w-3.5 h-3.5" />, action: 'cancelar', color: 'text-red-600', hoverColor: 'hover:bg-red-50' },
  ],
  produzido: [
    { label: 'Sair p/ Entrega', icon: <Truck className="w-3.5 h-3.5" />, action: 'avancar', color: 'text-purple-600', hoverColor: 'hover:bg-purple-50' },
    { label: 'Pausar', icon: <Pause className="w-3.5 h-3.5" />, action: 'pausar', color: 'text-orange-600', hoverColor: 'hover:bg-orange-50' },
    { label: 'Cancelar', icon: <X className="w-3.5 h-3.5" />, action: 'cancelar', color: 'text-red-600', hoverColor: 'hover:bg-red-50' },
  ],
  entrega: [
    { label: 'Confirmar', icon: <CheckCircle className="w-3.5 h-3.5" />, action: 'avancar', color: 'text-green-600', hoverColor: 'hover:bg-green-50' },
    { label: 'Pausar', icon: <Pause className="w-3.5 h-3.5" />, action: 'pausar', color: 'text-orange-600', hoverColor: 'hover:bg-orange-50' },
    { label: 'Cancelar', icon: <X className="w-3.5 h-3.5" />, action: 'cancelar', color: 'text-red-600', hoverColor: 'hover:bg-red-50' },
  ],
  pausado: [
    { label: 'Retomar', icon: <RotateCcw className="w-3.5 h-3.5" />, action: 'retomar', color: 'text-blue-600', hoverColor: 'hover:bg-blue-50' },
    { label: 'Cancelar', icon: <X className="w-3.5 h-3.5" />, action: 'cancelar', color: 'text-red-600', hoverColor: 'hover:bg-red-50' },
  ],
}

export default function KanbanCard({ pedido, failed = false, onAvancar, onPausar, onRetomar, onCancelar, onDetalhe, onRetry }: KanbanCardProps) {
  const aging = getAgingInfo(calcMinutesSince(pedido.updated_at))
  const actions = ACTION_BUTTONS[pedido.status] || []

  const handleAction = (action: string) => {
    switch (action) {
      case 'avancar': onAvancar?.(pedido.id); break
      case 'pausar': onPausar?.(pedido.id); break
      case 'retomar': onRetomar?.(pedido.id); break
      case 'cancelar': onCancelar?.(pedido.id); break
    }
  }

  return (
    <div
      className={`bg-white rounded-xl border-2 p-4 transition-all hover:shadow-md ${
        failed ? 'border-red-400 bg-red-50/50 ring-2 ring-red-200' : (aging.cardClass || 'border-gray-200')
      }`}
    >
      {/* Header: ID + aging + failed badge */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono text-gray-400 font-medium">#{pedido.id}</span>
        <div className="flex items-center gap-2">
          {failed && (
            <span className="flex items-center gap-1 bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-medium">
              <AlertTriangle className="w-3 h-3" /> Falha
            </span>
          )}
          {aging.label && (
            <span className={aging.badgeClass}>{aging.label}</span>
          )}
        </div>
      </div>

      {/* Cliente + total */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-primary truncate">{pedido.cliente_nome}</p>
        </div>
        <span className="text-sm font-bold text-massa-600 shrink-0 tabular-nums">
          R$ {pedido.total.toFixed(2)}
        </span>
      </div>

      {/* Info: itens + pagamento */}
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
        <span className="truncate">
          {pedido.itens?.length || 0} {pedido.itens?.length === 1 ? 'item' : 'itens'}
        </span>
        <span>•</span>
        <span>{pedido.forma_pagamento || '-'}</span>
        <span>•</span>
        <span>{calcMinutesSince(pedido.updated_at).toFixed(0)}min</span>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1 border-t border-gray-100 pt-3">
        {actions.map(btn => (
          <button
            key={`${btn.action}-${pedido.id}`}
            onClick={() => handleAction(btn.action)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${btn.color} ${btn.hoverColor} min-w-[32px] min-h-[32px] justify-center`}
            title={btn.label}
          >
            {btn.icon}
            <span className="hidden sm:inline">{btn.label}</span>
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1">
          {pedido.cliente_whatsapp && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                const msg = mensagemNovoPedido(pedido.cliente_nome, pedido.id, pedido.total)
                const link = gerarLinkWhatsApp(pedido.cliente_whatsapp!, msg)
                if (link) window.open(link, '_blank')
              }}
              className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors min-w-[28px] min-h-[28px] flex items-center justify-center"
              title="Enviar WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => onDetalhe?.(pedido.id)}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors min-w-[28px] min-h-[28px] flex items-center justify-center"
            title="Ver detalhes"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Failed retry button */}
      {failed && onRetry && (
        <button
          onClick={() => onRetry(pedido.id)}
          className="mt-2 w-full flex items-center justify-center gap-1.5 bg-red-100 text-red-700 py-2 rounded-lg text-xs font-medium hover:bg-red-200 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Tentar novamente
        </button>
      )}
    </div>
  )
}
