import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CookingPot, Clock, CheckCircle2, ShoppingBag, Truck, UtensilsCrossed } from 'lucide-react'
import { obterTrackingOffline } from '../services/offlineClient'
import type { Pedido } from '../api/client'

const statusInfo: Record<string, { icon: string; label: string; stepLabel: string; color: string; Icon: typeof CheckCircle2 }> = {
  recebido: { icon: '📥', label: 'Pedido Recebido', stepLabel: 'Seu pedido foi recebido e logo começaremos a preparar!', color: 'from-blue-500 to-blue-600', Icon: CheckCircle2 },
  producao: { icon: '👩‍🍳', label: 'Em Produção', stepLabel: 'Seus salgados estão sendo preparados com todo carinho!', color: 'from-yellow-500 to-orange-500', Icon: UtensilsCrossed },
  entrega: { icon: '🚚', label: 'Saiu para Entrega', stepLabel: 'Seu pedido está a caminho! Fique de olho.', color: 'from-purple-500 to-purple-600', Icon: Truck },
  entregue: { icon: '✅', label: 'Entregue!', stepLabel: 'Seu pedido foi entregue. Bom apetite! 🎉', color: 'from-green-500 to-emerald-600', Icon: CheckCircle2 },
}

const steps = ['recebido', 'producao', 'entrega', 'entregue']

function TempoRelativo({ date }: { date: string }) {
  const [label, setLabel] = useState('')
  useEffect(() => {
    const update = () => {
      const diff = Date.now() - new Date(date).getTime()
      const mins = Math.floor(diff / 60000)
      if (mins < 1) setLabel('agora mesmo')
      else if (mins < 60) setLabel(`há ${mins} min`)
      else if (mins < 1440) setLabel(`há ${Math.floor(mins / 60)}h`)
      else setLabel(new Date(date).toLocaleDateString('pt-BR'))
    }
    update()
    const interval = setInterval(update, 30000)
    return () => clearInterval(interval)
  }, [date])
  return <span className="text-xs text-gray-400">{label}</span>
}

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-amber-50">
      <div className="text-center">
        <div className="relative mx-auto w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-massa-200" />
          <div className="absolute inset-0 rounded-full border-4 border-massa-600 border-t-transparent animate-spin" />
        </div>
        <p className="text-gray-500 animate-pulse">Buscando seu pedido...</p>
      </div>
    </div>
  )

  if (error || !pedido) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-amber-50">
      <div className="text-center p-8 max-w-sm">
        <div className="text-6xl mb-4 animate-bounce">🔍</div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">Pedido não encontrado</h1>
        <p className="text-sm text-gray-500">O link pode estar incorreto ou o pedido foi cancelado.</p>
        <a href="/" className="inline-block mt-6 text-sm text-massa-600 hover:text-massa-700 underline">
          Voltar para o início
        </a>
      </div>
    </div>
  )

  const currentIdx = steps.indexOf(pedido.status)
  const info = statusInfo[pedido.status] || statusInfo.recebido

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-amber-50">
      {/* Banner decorativo */}
      <div className={`bg-gradient-to-r ${info.color} h-2`} />

      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-sm border border-white/50 mb-4">
            <CookingPot className="w-5 h-5 text-massa-600" />
            <span className="font-bold text-gray-800">Mão na Massa</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            Olá, {pedido.cliente_nome}! 🥟
          </h1>
          <div className="flex items-center justify-center gap-2 mt-1">
            <p className="text-gray-500 text-sm">Acompanhe seu pedido</p>
            <TempoRelativo date={pedido.created_at} />
          </div>
        </div>

        {/* Status Card */}
        <div className={`bg-gradient-to-br ${info.color} rounded-2xl shadow-lg p-6 text-white mb-6 relative overflow-hidden`}>
          {/* Background decoration */}
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
          <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/5" />

          <div className="relative">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{info.icon}</span>
              <div>
                <p className="font-bold text-lg">{info.label}</p>
                <p className="text-sm text-white/80">{info.stepLabel}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Timeline */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/50 p-6 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Progresso
          </h3>
          <div className="space-y-0">
            {steps.map((step, idx) => {
              const s = statusInfo[step]
              const done = idx <= currentIdx
              return (
                <div key={step} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shadow-sm transition-all duration-300 ${
                      done
                        ? 'bg-massa-600 text-white scale-100'
                        : 'bg-gray-100 text-gray-400 scale-90'
                    }`}>
                      {done ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        idx + 1
                      )}
                    </div>
                    {idx < steps.length - 1 && (
                      <div className={`w-0.5 h-10 my-1 transition-colors duration-300 ${
                        done ? 'bg-massa-600' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                  <div className={`pb-8 transition-opacity duration-300 ${done ? 'opacity-100' : 'opacity-30'}`}>
                    <p className={`text-sm font-medium ${done ? 'text-gray-800' : 'text-gray-400'}`}>
                      {s.label}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Itens */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/50 p-6 mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" /> Itens do Pedido
          </h3>
          <div className="space-y-2">
            {pedido.itens.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-massa-600 bg-massa-50 w-6 h-6 rounded-full flex items-center justify-center">
                    {item.quantidade}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {item.produto_nome || `Item #${item.variacao_id}`}
                    </p>
                    {item.variacao_nome && (
                      <p className="text-xs text-gray-400">{item.variacao_nome}</p>
                    )}
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  R$ {item.subtotal.toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-200">
            <span className="text-sm font-semibold text-gray-700">Total</span>
            <span className="text-xl font-bold text-massa-600">
              R$ {pedido.total.toFixed(2)}
            </span>
          </div>

          {pedido.forma_pagamento && (
            <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
              <span>💳 Pagamento: {pedido.forma_pagamento}</span>
            </div>
          )}
        </div>

        {/* Observações */}
        {pedido.observacoes && (
          <div className="bg-amber-50/80 backdrop-blur-sm rounded-2xl shadow-sm border border-amber-200/50 p-4 mb-4">
            <p className="text-sm text-amber-800 flex items-start gap-2">
              <span>📝</span>
              <span>{pedido.observacoes}</span>
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-400">
            Mão na Massa — Gestão de produção artesanal
          </p>
          <p className="text-[10px] text-gray-300 mt-1">
            Pedido #{pedido.id}
          </p>
        </div>
      </div>
    </div>
  )
}
