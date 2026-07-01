/** Constantes e utilitários compartilhados para status de pedidos. */

export const STATUS_FLOW = ['pendente', 'producao', 'produzido', 'entrega', 'entregue'] as const
export type StatusPedido = (typeof STATUS_FLOW)[number] | 'pausado' | 'cancelado'

export const STATUS_LABELS: Record<string, string> = {
  pendente: '⏳ Pendente',
  producao: '👩‍🍳 Em Produção',
  produzido: '✅ Produzido',
  entrega: '🚚 Em Entrega',
  entregue: '🎉 Entregue',
  pausado: '⏸️ Pausado',
  cancelado: '❌ Cancelado',
}

export const STATUS_COLORS: Record<string, string> = {
  pendente: 'bg-amber-100 text-amber-800 border-amber-200',
  producao: 'bg-blue-100 text-blue-800 border-blue-200',
  produzido: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  entrega: 'bg-purple-100 text-purple-800 border-purple-200',
  entregue: 'bg-green-100 text-green-800 border-green-200',
  pausado: 'bg-orange-100 text-orange-800 border-orange-200',
  cancelado: 'bg-red-100 text-red-800 border-red-200',
}

export const STATUS_COLORS_SIMPLE: Record<string, string> = {
  pendente: 'bg-amber-100 text-amber-800',
  producao: 'bg-blue-100 text-blue-800',
  produzido: 'bg-emerald-100 text-emerald-800',
  entrega: 'bg-purple-100 text-purple-800',
  entregue: 'bg-green-100 text-green-800',
  pausado: 'bg-orange-100 text-orange-800',
  cancelado: 'bg-red-100 text-red-800',
}

export const STATUS_COLORS_BG: Record<string, string> = {
  pendente: 'bg-amber-50 border-amber-200',
  producao: 'bg-blue-50 border-blue-200',
  produzido: 'bg-emerald-50 border-emerald-200',
  entrega: 'bg-purple-50 border-purple-200',
  entregue: 'bg-green-50 border-green-200',
  pausado: 'bg-orange-50 border-orange-200',
  cancelado: 'bg-red-50 border-red-200',
}

export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] || status
}

export function getStatusColor(status: string): string {
  return STATUS_COLORS[status] || 'bg-gray-100 text-gray-800'
}

export function getStatusColorSimple(status: string): string {
  return STATUS_COLORS_SIMPLE[status] || 'bg-gray-100 text-gray-800'
}

export function getStatusBgColor(status: string): string {
  return STATUS_COLORS_BG[status] || 'bg-gray-50 border-gray-200'
}

export function getStatusEmoji(status: string): string {
  const map: Record<string, string> = {
    pendente: '⏳',
    producao: '👩‍🍳',
    produzido: '✅',
    entrega: '🚚',
    entregue: '🎉',
    pausado: '⏸️',
    cancelado: '❌',
  }
  return map[status] || '📌'
}

export function getStatusStepLabel(status: string): string {
  const map: Record<string, string> = {
    pendente: 'Seu pedido foi recebido e logo começaremos a preparar!',
    producao: 'Seus salgados estão sendo preparados com todo carinho!',
    produzido: 'A produção foi concluída! Em breve sairá para entrega.',
    entrega: 'Seu pedido está a caminho! Fique de olho.',
    entregue: 'Seu pedido foi entregue. Bom apetite! 🎉',
  }
  return map[status] || ''
}

export function getStatusGradient(status: string): string {
  const map: Record<string, string> = {
    pendente: 'from-amber-500 to-amber-600',
    producao: 'from-blue-500 to-blue-600',
    produzido: 'from-emerald-500 to-emerald-600',
    entrega: 'from-purple-500 to-purple-600',
    entregue: 'from-green-500 to-emerald-600',
    pausado: 'from-orange-500 to-orange-600',
    cancelado: 'from-red-500 to-red-600',
  }
  return map[status] || 'from-gray-500 to-gray-600'
}

/**
 * Aging indicator helpers.
 * Returns a { level, label, class } object based on how many minutes
 * the order has been in the current status.
 */
export interface AgingInfo {
  level: 'fresh' | 'warning' | 'alert' | 'critical'
  label: string
  cardClass: string
  badgeClass: string
}

export function getAgingInfo(minutesInStatus: number): AgingInfo {
  if (minutesInStatus < 30) {
    return {
      level: 'fresh',
      label: '',
      cardClass: '',
      badgeClass: '',
    }
  }
  if (minutesInStatus < 60) {
    return {
      level: 'warning',
      label: '⚠️ 30min+',
      cardClass: 'ring-2 ring-amber-300',
      badgeClass: 'bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full',
    }
  }
  if (minutesInStatus < 120) {
    return {
      level: 'alert',
      label: '🟡 1h+ parado',
      cardClass: 'ring-2 ring-amber-400 bg-amber-50/50',
      badgeClass: 'bg-amber-200 text-amber-900 text-xs px-2 py-0.5 rounded-full font-medium',
    }
  }
  return {
    level: 'critical',
    label: '🔴 2h+ parado',
    cardClass: 'ring-2 ring-red-400 bg-red-50/50',
    badgeClass: 'bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full font-bold',
  }
}

export function calcMinutesSince(dateStr: string): number {
  return (Date.now() - new Date(dateStr).getTime()) / 60000
}
