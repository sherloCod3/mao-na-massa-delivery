import { useEffect, useState } from 'react'
import { Plus, Search, MessageCircle } from 'lucide-react'
import { listarPedidosOffline } from '../services/offlineClient'
import type { Pedido } from '../api/client'
import { useNavigate } from 'react-router-dom'

import { gerarLinkWhatsApp, mensagemNovoPedido } from '../utils/whatsapp'

const statusLabels: Record<string, string> = {
  recebido: '📥 Recebido',
  producao: '👩‍🍳 Em Produção',
  entrega: '🚚 Em Entrega',
  entregue: '✅ Entregue',
  cancelado: '❌ Cancelado',
}

const statusColors: Record<string, string> = {
  recebido: 'bg-blue-100 text-blue-800',
  producao: 'bg-yellow-100 text-yellow-800',
  entrega: 'bg-purple-100 text-purple-800',
  entregue: 'bg-green-100 text-green-800',
  cancelado: 'bg-red-100 text-red-800',
}

export default function Pedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const navigate = useNavigate()

  useEffect(() => { listarPedidosOffline().then(setPedidos) }, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Pedidos</h1>
        <button onClick={() => navigate('/pedidos/novo')}
          className="flex items-center gap-2 bg-massa-600 text-white px-4 py-2 rounded-lg hover:bg-massa-700">
          <Plus className="w-4 h-4" /> Novo Pedido
        </button>
      </div>

      <div className="bg-white card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">#</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Cliente</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Pagamento</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Total</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Data</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {pedidos.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-mono text-gray-500">#{p.id}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-800">{p.cliente_nome}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[p.status] || 'bg-gray-100'}`}>
                    {statusLabels[p.status] || p.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{p.forma_pagamento || '-'}</td>
                <td className="px-4 py-3 text-sm font-medium text-right">R$ {p.total.toFixed(2)}</td>
                <td className="px-4 py-3 text-sm text-gray-500 text-right">
                  {new Date(p.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {p.cliente_whatsapp && (
                      <button
                        onClick={() => {
                          const msg = mensagemNovoPedido(p.cliente_nome, p.id, p.total)
                          const link = gerarLinkWhatsApp(p.cliente_whatsapp!, msg)
                          if (link) window.open(link, '_blank')
                        }}
                        className="text-green-600 hover:text-green-800 text-sm flex items-center gap-1 px-2 py-1 rounded hover:bg-green-50 transition-colors"
                        title="Enviar WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => navigate(`/pedidos/${p.id}`)}
                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1">
                      <Search className="w-4 h-4" /> Detalhes
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {pedidos.length === 0 && (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">Nenhum pedido encontrado</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
