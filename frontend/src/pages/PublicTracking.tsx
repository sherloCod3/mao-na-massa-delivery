import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CookingPot, Clock } from 'lucide-react'
import { obterTrackingOffline } from '../services/offlineClient'
import type { Pedido } from '../api/client'

const statusInfo: Record<string, { icon: string; label: string; color: string }> = {
  recebido: { icon: '📥', label: 'Pedido Recebido', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  producao: { icon: '👩‍🍳', label: 'Em Produção', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  entrega: { icon: '🚚', label: 'Saiu para Entrega', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  entregue: { icon: '✅', label: 'Entregue!', color: 'bg-green-100 text-green-800 border-green-300' },
}

const steps = ['recebido', 'producao', 'entrega', 'entregue']

export default function PublicTracking() {
  const { token } = useParams()
  const [pedido, setPedido] = useState<Pedido | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    obterTrackingOffline(token)
      .then(setPedido)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
      <Clock className="w-8 h-8 text-massa-400 animate-spin" />
    </div>
  )

  if (error || !pedido) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
      <div className="text-center p-8">
        <p className="text-4xl mb-4">🔍</p>
        <h1 className="text-xl font-bold text-gray-800 mb-2">Pedido não encontrado</h1>
        <p className="text-sm text-gray-500">O link pode estar incorreto ou o pedido foi cancelado.</p>
      </div>
    </div>
  )

  const currentIdx = steps.indexOf(pedido.status)

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-white px-6 py-3 rounded-full shadow-sm mb-4">
            <CookingPot className="w-6 h-6 text-massa-600" />
            <span className="font-bold text-gray-800">Mão na Massa</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Olá, {pedido.cliente_nome}!</h1>
          <p className="text-gray-500 text-sm mt-1">Acompanhe seu pedido</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border p-6 mb-4">
          {/* Status atual */}
          <div className={`text-center p-4 rounded-xl border-2 mb-6 ${statusInfo[pedido.status]?.color || 'bg-gray-100'}`}>
            <p className="text-3xl mb-2">{statusInfo[pedido.status]?.icon}</p>
            <p className="font-bold text-lg">{statusInfo[pedido.status]?.label}</p>
          </div>

          {/* Timeline */}
          <div className="space-y-0">
            {steps.map((step, idx) => {
              const info = statusInfo[step]
              const done = idx <= currentIdx
              return (
                <div key={step} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                      done ? 'bg-massa-600 text-white' : 'bg-gray-200 text-gray-400'
                    }`}>
                      {done ? '✓' : idx + 1}
                    </div>
                    {idx < steps.length - 1 && (
                      <div className={`w-0.5 h-10 ${done ? 'bg-massa-600' : 'bg-gray-200'}`} />
                    )}
                  </div>
                  <div className={`pb-8 ${done ? 'opacity-100' : 'opacity-40'}`}>
                    <p className={`text-sm font-medium ${done ? 'text-gray-800' : 'text-gray-400'}`}>{info.label}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Itens */}
          <div className="border-t pt-4 mt-2">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Itens do Pedido</h3>
            {pedido.itens.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm py-1">
                <span className="text-gray-600">{item.quantidade}x Item #{item.variacao_id}</span>
                <span className="font-medium">R$ {item.subtotal.toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t">
              <span>Total</span>
              <span className="text-massa-600">R$ {pedido.total.toFixed(2)}</span>
            </div>
          </div>

          {pedido.observacoes && (
            <div className="mt-4 text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
              📝 {pedido.observacoes}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400">
          Mão na Massa — Gestão de produção artesanal
        </p>
      </div>
    </div>
  )
}
