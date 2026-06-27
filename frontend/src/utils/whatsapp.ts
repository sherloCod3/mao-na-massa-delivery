/**
 * Gera um link wa.me para abrir o WhatsApp com mensagem pré-preenchida.
 *
 * @param telefone - Número com DDD (ex: 11999999999). O 55 é adicionado automaticamente.
 * @param mensagem - Texto da mensagem (pode ter quebras de linha, emojis, etc.)
 * @returns URL completa wa.me ou null se telefone for inválido
 */
export function gerarLinkWhatsApp(telefone: string | null | undefined, mensagem: string): string | null {
  if (!telefone) return null

  // Remove tudo que não é dígito
  const digitos = telefone.replace(/\D/g, '')
  if (digitos.length < 10) return null

  // Adiciona código do Brasil (55) se não tiver
  const completo = digitos.startsWith('55') ? digitos : `55${digitos}`

  const texto = encodeURIComponent(mensagem)
  return `https://wa.me/${completo}?text=${texto}`
}

/**
 * Gera a mensagem de status de pedido para enviar ao cliente via WhatsApp.
 *
 * @param trackingUrl - URL opcional de tracking. Se não fornecido, não inclui o link.
 */
export function mensagemStatusPedido(
  clienteNome: string,
  pedidoId: number,
  status: string,
  total: number,
  trackingUrl?: string,
): string {
  const statusEmoji: Record<string, string> = {
    recebido: '📥',
    producao: '👨‍🍳',
    entrega: '🚚',
    entregue: '✅',
    cancelado: '❌',
  }
  const emoji = statusEmoji[status] || '📌'
  const statusNome = status.charAt(0).toUpperCase() + status.slice(1)

  const tracking = trackingUrl
    ? `\n📍 Acompanhe: ${trackingUrl}`
    : ''

  return (
    `━━━ 🧾 PEDIDO #${pedidoId} ━━━\n\n` +
    `👤 Olá ${clienteNome}!\n` +
    `💰 Total: R$ ${total.toFixed(2)}\n` +
    `${emoji} Status: *${statusNome}*` +
    tracking +
    `\n────────────────\n\n` +
    `Obrigado por comprar no Mão na Massa! 🎉\n` +
    `━━━ 🥟 Mão na Massa ━━━`
  )
}

/**
 * Gera a mensagem de novo pedido para enviar ao cliente via WhatsApp.
 */
export function mensagemNovoPedido(
  clienteNome: string,
  pedidoId: number,
  total: number,
): string {
  return (
    `━━━ 🧾 PEDIDO #${pedidoId} ━━━\n\n` +
    `👤 Olá ${clienteNome}!\n` +
    `💰 Total: R$ ${total.toFixed(2)}\n` +
    `📥 Status: *Recebido*\n` +
    `────────────────\n\n` +
    `Em breve começaremos a preparar! 👨‍🍳\n` +
    `Obrigado por comprar no Mão na Massa! 🎉\n` +
    `━━━ 🥟 Mão na Massa ━━━`
  )
}
