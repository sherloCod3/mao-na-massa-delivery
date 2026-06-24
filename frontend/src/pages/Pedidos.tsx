import { useEffect, useState } from 'react'
import { Plus, Search, MessageCircle } from 'lucide-react'
import { listarPedidosOffline } from '../services/offlineClient'
import type { Pedido } from '../api/client'
import { useNavigate } from 'react-router-dom'

import { gerarLinkWhatsApp, mensagemNovoPedido } from '../utils/whatsapp'
import { getStatusLabel, getStatusColorSimple } from '../utils/pedido'
import PageHeader from '../components/PageHeader'
import { ShoppingBag } from 'lucide-react'

export default function Pedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const navigate = useNavigate()

  useEffect(() => { listarPedidosOffline().then(setPedidos) }, [])

  return (
    <div>
      <PageHeader
        title="Pedidos"
        icon={<ShoppingBag className="w-6 h-6" />}
        action={
          <button onClick={() => navigate('/pedidos/novo')}
            className="flex items-center gap-2 bg-massa-600 text-white px-4 py-2 rounded-lg hover:bg-massa-700 transition-colors min-w-[44px] min-h-[44px] justify-center">
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Novo Pedido</span>
          </button>
        }
      />

      {/* Desktop: tabela */}
      <div className="hidden sm:block bg-white card overflow-hidden">
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
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColorSimple(p.status)}`}>
                    {getStatusLabel(p.status)}
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
                        className="text-green-600 hover:text-green-800 p-2 rounded hover:bg-green-50 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                        title="Enviar WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => navigate(`/pedidos/${p.id}`)}
                      className="text-blue-600 hover:text-blue-800 text-sm p-2 rounded hover:bg-blue-50 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
                      <Search className="w-4 h-4" />
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

      {/* Mobile: card list */}
      <div className="sm:hidden space-y-3">
        {pedidos.map(p => (
          <div
            key={p.id}
            onClick={() => navigate(`/pedidos/${p.id}`)}
            className="bg-white card p-4 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-mono text-gray-500">#{p.id}</span>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColorSimple(p.status)}`}>
                {getStatusLabel(p.status)}
              </span>
            </div>
            <p className="font-medium text-gray-800">{p.cliente_nome}</p>
            <div className="flex items-center justify-between mt-2 text-sm">
              <span className="text-gray-500">{p.forma_pagamento || '-'}</span>
              <span className="font-bold text-massa-600">R$ {p.total.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
              <span className="text-xs text-gray-400">
                {new Date(p.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </span>
              <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                {p.cliente_whatsapp && (
                  <button
                    onClick={() => {
                      const msg = mensagemNovoPedido(p.cliente_nome, p.id, p.total)
                      const link = gerarLinkWhatsApp(p.cliente_whatsapp!, msg)
                      if (link) window.open(link, '_blank')
                    }}
                    className="text-green-600 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                    title="Enviar WhatsApp"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {pedidos.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p>Nenhum pedido encontrado</p>
          </div>
        )}
      </div>
    </div>
  )
}
