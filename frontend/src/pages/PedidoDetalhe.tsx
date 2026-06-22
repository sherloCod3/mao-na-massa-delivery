import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Copy } from 'lucide-react'
import { pedidosApi } from '../api/client'
import type { Pedido } from '../api/client'

const statusLabels: Record<string, string> = {
  recebido: '📥 Recebido',
  producao: '👩‍🍳 Em Produção',
  entrega: '🚚 Em Entrega',
  entregue: '✅ Entregue',
  cancelado: '❌ Cancelado',
}

const statusColors: Record<string, string> = {
  recebido: 'bg-blue-100 text-blue-800 border-blue-200',
  producao: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  entrega: 'bg-purple-100 text-purple-800 border-purple-200',
  entregue: 'bg-green-100 text-green-800 border-green-200',
  cancelado: 'bg-red-100 text-red-800 border-red-200',
}

const statusFlow = ['recebido', 'producao', 'entrega', 'entregue']

export default function PedidoDetalhe() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [pedido, setPedido] = useState<Pedido | null>(null)

  useEffect(() => {
    if (id) pedidosApi.obter(parseInt(id)).then(setPedido)
  }, [id])

  if (!pedido) return <div className="text-center py-12 text-gray-400">Carregando...</div>

  const currentIdx = statusFlow.indexOf(pedido.status)
  const isCancelado = pedido.status === 'cancelado'
  const trackingUrl = `${window.location.origin}/track/${pedido.token_acesso}`

  const advanceStatus = async () => {
    const nextIdx = currentIdx + 1
    if (nextIdx < statusFlow.length) {
      const updated = await pedidosApi.atualizarStatus(pedido.id, statusFlow[nextIdx])
      setPedido(updated)
    }
  }

  const copyTracking = () => {
    navigator.clipboard.writeText(trackingUrl)
    alert('Link de tracking copiado!')
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/pedidos')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Pedido #{pedido.id}</h1>
        <span className={`text-sm px-3 py-1 rounded-full border font-medium ${statusColors[pedido.status]}`}>
          {statusLabels[pedido.status]}
        </span>
      </div>

      {/* Progresso do status */}
      {!isCancelado && (
        <div className="bg-white card p-6 mb-6">
          <div className="flex items-center justify-between">
            {statusFlow.map((s, idx) => (
              <div key={s} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                  idx <= currentIdx ? 'bg-massa-600 text-white' : 'bg-gray-200 text-gray-400'
                }`}>
                  {idx + 1}
                </div>
                {idx < statusFlow.length - 1 && (
                  <div className={`w-12 h-1 mx-1 ${idx < currentIdx ? 'bg-massa-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-500">
            {statusFlow.map(s => (
              <span key={s}>{statusLabels[s].replace(/^.{2} /, '')}</span>
            ))}
          </div>
          {currentIdx < statusFlow.length - 1 && (
            <button onClick={advanceStatus}
              className="mt-4 w-full bg-massa-600 text-white py-2 rounded-lg hover:bg-massa-700 text-sm">
              Avançar para "{statusLabels[statusFlow[currentIdx + 1]].replace(/^.{2} /, '')}"
            </button>
          )}
        </div>
      )}

      {/* Dados do cliente */}
      <div className="bg-white card p-6 mb-6">
        <h2 className="text-lg font-semibold mb-3">Dados do Cliente</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">Nome:</span> {pedido.cliente_nome}</div>
          <div><span className="text-gray-500">WhatsApp:</span> {pedido.cliente_whatsapp || '-'}</div>
          <div><span className="text-gray-500">Pagamento:</span> {pedido.forma_pagamento || '-'}</div>
          <div><span className="text-gray-500">Data:</span> {new Date(pedido.created_at).toLocaleString('pt-BR')}</div>
          {pedido.observacoes && (
            <div className="col-span-2"><span className="text-gray-500">Observações:</span> {pedido.observacoes}</div>
          )}
        </div>
      </div>

      {/* Itens */}
      <div className="bg-white card p-6 mb-6">
        <h2 className="text-lg font-semibold mb-3">Itens</h2>
        {pedido.itens.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
            <div>
              <p className="text-sm font-medium">{item.quantidade}x Variação #{item.variacao_id}</p>
              <p className="text-xs text-gray-500">R$ {item.preco_unitario.toFixed(2)}/un {item.customizacoes ? `+ ${item.customizacoes}` : ''}</p>
            </div>
            <span className="text-sm font-medium">R$ {item.subtotal.toFixed(2)}</span>
          </div>
        ))}
        <div className="flex justify-between pt-3 mt-2 border-t font-bold text-lg">
          <span>Total</span>
          <span className="text-massa-600">R$ {pedido.total.toFixed(2)}</span>
        </div>
      </div>

      {/* Link de tracking */}
      {!isCancelado && (
        <div className="bg-white card p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Link de Acompanhamento</h2>
          <div className="flex gap-2">
            <input readOnly value={trackingUrl} className="flex-1 border rounded-lg px-3 py-2 text-sm bg-gray-50 font-mono" />
            <button onClick={copyTracking} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200">
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">Compartilhe este link com o cliente para ele acompanhar o pedido</p>
        </div>
      )}
    </div>
  )
}
