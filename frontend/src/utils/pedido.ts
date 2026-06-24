/** Constantes e utilitários compartilhados para status de pedidos. */

export const STATUS_FLOW = ['recebido', 'producao', 'entrega', 'entregue'] as const
export type StatusPedido = (typeof STATUS_FLOW)[number] | 'cancelado'

export const STATUS_LABELS: Record<string, string> = {
  recebido: '📥 Recebido',
  producao: '👩‍🍳 Em Produção',
  entrega: '🚚 Em Entrega',
  entregue: '✅ Entregue',
  cancelado: '❌ Cancelado',
}

export const STATUS_COLORS: Record<string, string> = {
  recebido: 'bg-blue-100 text-blue-800 border-blue-200',
  producao: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  entrega: 'bg-purple-100 text-purple-800 border-purple-200',
  entregue: 'bg-green-100 text-green-800 border-green-200',
  cancelado: 'bg-red-100 text-red-800 border-red-200',
}

export const STATUS_COLORS_SIMPLE: Record<string, string> = {
  recebido: 'bg-blue-100 text-blue-800',
  producao: 'bg-yellow-100 text-yellow-800',
  entrega: 'bg-purple-100 text-purple-800',
  entregue: 'bg-green-100 text-green-800',
  cancelado: 'bg-red-100 text-red-800',
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

export function getStatusEmoji(status: string): string {
  const map: Record<string, string> = {
    recebido: '📥',
    producao: '👩‍🍳',
    entrega: '🚚',
    entregue: '✅',
    cancelado: '❌',
  }
  return map[status] || '📌'
}

export function getStatusStepLabel(status: string): string {
  const map: Record<string, string> = {
    recebido: 'Seu pedido foi recebido e logo começaremos a preparar!',
    producao: 'Seus salgados estão sendo preparados com todo carinho!',
    entrega: 'Seu pedido está a caminho! Fique de olho.',
    entregue: 'Seu pedido foi entregue. Bom apetite! 🎉',
  }
  return map[status] || ''
}

export function getStatusGradient(status: string): string {
  const map: Record<string, string> = {
    recebido: 'from-blue-500 to-blue-600',
    producao: 'from-yellow-500 to-orange-500',
    entrega: 'from-purple-500 to-purple-600',
    entregue: 'from-green-500 to-emerald-600',
  }
  return map[status] || 'from-gray-500 to-gray-600'
}
