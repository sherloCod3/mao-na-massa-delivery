import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { Copy, MessageCircle, Play, Pause, X, RotateCcw } from 'lucide-react'
import { pedidosApi } from '../api/client'
import { obterPedidoDetalheOffline, avancarPedidoOffline, pausarPedidoOffline, retomarPedidoOffline, cancelarPedidoOffline } from '../services/offlineClient'
import { useToast } from '../components/Toast'
import { gerarLinkWhatsApp, mensagemStatusPedido } from '../utils/whatsapp'
import type { Pedido, StatusHistoryItem } from '../api/client'
import {
  STATUS_FLOW, getStatusColor, getStatusLabel, getStatusEmoji,
} from '../utils/pedido'
import PageHeader from '../components/PageHeader'
import ModalMotivo from '../components/ModalMotivo'
import StatusHistoryTimeline from '../components/StatusHistoryTimeline'

export default function PedidoDetalhe() {
  const { id } = useParams()
  const [pedido, setPedido] = useState<Pedido | null>(null)
  const [historico, setHistorico] = useState<StatusHistoryItem[]>([])
  const [modalPausar, setModalPausar] = useState(false)
  const [modalCancelar, setModalCancelar] = useState(false)
  const [loadingPausar, setLoadingPausar] = useState(false)
  const [loadingCancelar, setLoadingCancelar] = useState(false)
  const { toast } = useToast()

  // useRef to always have the latest pedido reference without needing it in callback deps
  const pedidoRef = useRef(pedido)
  useEffect(() => { pedidoRef.current = pedido }, [pedido])

  useEffect(() => {
    if (!id) return
    const pid = parseInt(id)
    obterPedidoDetalheOffline(pid).then(setPedido)
    pedidosApi.historico(pid).then(setHistorico).catch(() => {})
  }, [id])

  // All hooks MUST be before the early return (React rules of hooks)
  // Using pedidoRef.current instead of pedido to avoid conditional hook deps
  const handleAvancar = useCallback(async () => {
    const current = pedidoRef.current
    if (!current) return
    try {
      const updated = await avancarPedidoOffline(current.id)
      setPedido(updated)
      const h = await pedidosApi.historico(current.id)
      setHistorico(h)
      toast('success', `Pedido avançou para "${getStatusLabel(updated.status).replace(/^.{2} /, '')}"`)
    } catch {
      toast('error', 'Erro ao avançar pedido')
    }
  }, [toast])

  const handlePausar = useCallback(async (motivo: string) => {
    const current = pedidoRef.current
    if (!current) return
    setLoadingPausar(true)
    try {
      const updated = await pausarPedidoOffline(current.id, motivo)
      setPedido(updated)
      const h = await pedidosApi.historico(current.id)
      setHistorico(h)
      toast('success', 'Pedido pausado')
    } catch {
      toast('error', 'Erro ao pausar pedido')
    } finally {
      setLoadingPausar(false)
      setModalPausar(false)
    }
  }, [toast])

  const handleRetomar = useCallback(async () => {
    const current = pedidoRef.current
    if (!current) return
    try {
      const updated = await retomarPedidoOffline(current.id)
      setPedido(updated)
      const h = await pedidosApi.historico(current.id)
      setHistorico(h)
      toast('success', 'Pedido retomado')
    } catch {
      toast('error', 'Erro ao retomar pedido')
    }
  }, [toast])

  const handleCancelar = useCallback(async (motivo: string) => {
    const current = pedidoRef.current
    if (!current) return
    setLoadingCancelar(true)
    try {
      const updated = await cancelarPedidoOffline(current.id, motivo)
      setPedido(updated)
      const h = await pedidosApi.historico(current.id)
      setHistorico(h)
      toast('success', 'Pedido cancelado')
    } catch {
      toast('error', 'Erro ao cancelar pedido')
    } finally {
      setLoadingCancelar(false)
      setModalCancelar(false)
    }
  }, [toast])

  // Early return — all hooks are above this line
  if (!pedido) return <div className="text-center py-12 text-gray-400">Carregando...</div>

  // Derived values (after early return, safe as const)
  const currentIdx = STATUS_FLOW.indexOf(pedido.status as typeof STATUS_FLOW[number])
  const isCancelado = pedido.status === 'cancelado'
  const isPausado = pedido.status === 'pausado'
  const isEntregue = pedido.status === 'entregue'
  const isTerminal = isCancelado || isEntregue
  const trackingUrl = `${window.location.origin}/track/${pedido.token_acesso}`

  const sendWhatsAppStatus = () => {
    const msg = mensagemStatusPedido(pedido.cliente_nome, pedido.id, pedido.status, pedido.total, trackingUrl)
    const link = gerarLinkWhatsApp(pedido.cliente_whatsapp!, msg)
    if (link) window.open(link, '_blank')
  }

  const copyTracking = () => {
    navigator.clipboard.writeText(trackingUrl)
    toast('success', 'Link de tracking copiado!')
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title={`Pedido #${pedido.id}`}
        icon={
          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-medium text-xs ${getStatusColor(pedido.status)}`}>
            {getStatusEmoji(pedido.status)}
          </span>
        }
        backTo="/admin/pedidos"
        action={
          <span className={`text-xs px-3 py-1.5 rounded-full border font-medium ${getStatusColor(pedido.status)}`}>
            {getStatusLabel(pedido.status)}
          </span>
        }
      />

      {/* Progresso do status (apenas para fluxo canônico) */}
      {currentIdx >= 0 && !isTerminal && (
        <div className="bg-white card p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-center justify-between">
            {STATUS_FLOW.map((s, idx) => (
              <div key={s} className="flex items-center">
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  idx <= currentIdx ? 'bg-massa-600 text-white' : 'bg-gray-200 text-gray-400'
                }`}>
                  {idx + 1}
                </div>
                {idx < STATUS_FLOW.length - 1 && (
                  <div className={`w-8 sm:w-12 h-1 mx-1 ${idx < currentIdx ? 'bg-massa-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1 text-[10px] sm:text-xs text-gray-500">
            {STATUS_FLOW.map(s => (
              <span key={s}>{getStatusLabel(s).replace(/^.{2} /, '')}</span>
            ))}
          </div>

          {/* Action buttons row */}
          <div className="mt-4 flex flex-wrap gap-2">
            {!isPausado && currentIdx < STATUS_FLOW.length - 1 && (
              <button onClick={handleAvancar}
                className="flex-1 bg-massa-600 text-white py-2.5 rounded-lg hover:bg-massa-700 text-sm min-h-[44px] font-medium flex items-center justify-center gap-2">
                <Play className="w-4 h-4" /> Avançar para &quot;{getStatusLabel(STATUS_FLOW[currentIdx + 1]).replace(/^.{2} /, '')}&quot;
              </button>
            )}
            {!isPausado && !isTerminal && (
              <button onClick={() => setModalPausar(true)}
                className="px-4 py-2.5 rounded-lg border border-orange-200 text-orange-700 hover:bg-orange-50 text-sm min-h-[44px] font-medium flex items-center gap-2 transition-colors">
                <Pause className="w-4 h-4" /> Pausar
              </button>
            )}
            {isPausado && (
              <button onClick={handleRetomar}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 text-sm min-h-[44px] font-medium flex items-center justify-center gap-2">
                <RotateCcw className="w-4 h-4" /> Retomar
              </button>
            )}
            {!isTerminal && (
              <button onClick={() => setModalCancelar(true)}
                className="px-4 py-2.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 text-sm min-h-[44px] font-medium flex items-center gap-2 transition-colors">
                <X className="w-4 h-4" /> Cancelar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Terminal status card */}
      {(isCancelado || isEntregue) && (
        <div className={`card p-6 mb-4 sm:mb-6 text-center ${isCancelado ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
          <div className="text-4xl mb-2">{getStatusEmoji(pedido.status)}</div>
          <h2 className="text-lg font-bold text-primary">{getStatusLabel(pedido.status).replace(/^.{2} /, '')}</h2>
        </div>
      )}

      {/* Dados do cliente */}
      <div className="bg-white card p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Dados do Cliente</h2>
          {pedido.cliente_whatsapp && (
            <button
              onClick={sendWhatsAppStatus}
              className="flex items-center gap-2 bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm min-h-[44px]"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Enviar WhatsApp</span>
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
          <div><span className="text-gray-500">Nome:</span> {pedido.cliente_nome}</div>
          <div>
            <span className="text-gray-500">WhatsApp:</span>{' '}
            {pedido.cliente_whatsapp ? (
              <span className="inline-flex items-center gap-1">
                {pedido.cliente_whatsapp}
                <a
                  href={gerarLinkWhatsApp(pedido.cliente_whatsapp, '') ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:text-green-800 min-w-[28px] min-h-[28px] inline-flex items-center justify-center"
                  title="Abrir WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                </a>
              </span>
            ) : '-'}
          </div>
          <div><span className="text-gray-500">Pagamento:</span> {pedido.forma_pagamento || '-'}</div>
          <div><span className="text-gray-500">Data:</span> {new Date(pedido.created_at).toLocaleString('pt-BR')}</div>
          {pedido.observacoes && (
            <div className="col-span-1 sm:col-span-2"><span className="text-gray-500">Observações:</span> {pedido.observacoes}</div>
          )}
        </div>
      </div>

      {/* Itens */}
      <div className="bg-white card p-4 sm:p-6 mb-4 sm:mb-6">
        <h2 className="text-lg font-semibold mb-3">Itens</h2>
        {pedido.itens.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0 gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">
                {item.quantidade}x {item.variacao_nome || `Variação #${item.variacao_id}`}
              </p>
              <p className="text-xs text-gray-500">R$ {item.preco_unitario.toFixed(2)}/un {item.customizacoes?.length ? `+ ${item.customizacoes.map(c => c.nome).join(', ')}` : ''}</p>
            </div>
            <span className="text-sm font-medium shrink-0">R$ {item.subtotal.toFixed(2)}</span>
          </div>
        ))}
        <div className="flex justify-between pt-3 mt-2 border-t font-bold text-lg">
          <span>Total</span>
          <span className="text-massa-600">R$ {pedido.total.toFixed(2)}</span>
        </div>
      </div>

      {/* Histórico de Status */}
      <StatusHistoryTimeline historico={historico} />

      {/* Link de tracking */}
      {!isCancelado && (
        <div className="bg-white card p-4 sm:p-6">
          <h2 className="text-sm font-semibold text-secondary mb-2">Link de Acompanhamento</h2>
          <div className="flex gap-2">
            <input
              readOnly
              value={trackingUrl}
              className="flex-1 border rounded-lg px-3 py-2 text-sm bg-gray-50 font-mono truncate"
              onClick={e => (e.target as HTMLInputElement).select()}
            />
            <button
              onClick={copyTracking}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              title="Copiar link"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">Compartilhe este link com o cliente para ele acompanhar o pedido</p>
        </div>
      )}

      {/* Modals */}
      <ModalMotivo
        open={modalPausar}
        title="Pausar Pedido"
        confirmLabel="Pausar"
        icon="pause"
        onConfirm={handlePausar}
        onCancel={() => setModalPausar(false)}
        loading={loadingPausar}
      />
      <ModalMotivo
        open={modalCancelar}
        title="Cancelar Pedido"
        confirmLabel="Cancelar"
        icon="cancel"
        onConfirm={handleCancelar}
        onCancel={() => setModalCancelar(false)}
        loading={loadingCancelar}
      />
    </div>
  )
}
