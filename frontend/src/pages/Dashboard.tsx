import { useEffect, useState } from 'react'
import { ShoppingBag, DollarSign, TrendingUp, Clock, TrendingDown, PiggyBank } from 'lucide-react'
import { dashboardApi } from '../api/client'
import type { DashboardHoje } from '../api/client'

export default function Dashboard() {
  const [data, setData] = useState<DashboardHoje | null>(null)

  useEffect(() => {
    dashboardApi.hoje().then(setData).catch(console.error)
  }, [])

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <Clock className="w-8 h-8 text-massa-300 animate-spin" />
      </div>
    )
  }

  const cards = [
    {
      label: 'Pedidos Ativos',
      value: data.pedidos_ativos,
      icon: ShoppingBag,
      accent: 'text-massa-500',
      bg: 'bg-massa-50',
    },
    {
      label: 'Entregues Hoje',
      value: data.pedidos_entregues_hoje,
      icon: TrendingUp,
      accent: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Faturamento',
      value: `R$ ${data.faturamento_hoje.toFixed(2)}`,
      icon: DollarSign,
      accent: 'text-massa-600',
      bg: 'bg-massa-50',
    },
    {
      label: 'Custo Estimado',
      value: `R$ ${data.custo_total_estimado.toFixed(2)}`,
      icon: TrendingDown,
      accent: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Lucro Estimado',
      value: `R$ ${data.lucro_estimado.toFixed(2)}`,
      icon: PiggyBank,
      accent: data.lucro_estimado >= 0 ? 'text-emerald-600' : 'text-red-600',
      bg: data.lucro_estimado >= 0 ? 'bg-emerald-50' : 'bg-red-50',
    },
    {
      label: 'Total Hoje',
      value: data.total_pedidos,
      icon: ShoppingBag,
      accent: 'text-massa-400',
      bg: 'bg-creme-100',
    },
  ]

  const margem =
    data.faturamento_hoje > 0 ? ((data.lucro_estimado / data.faturamento_hoje) * 100).toFixed(1) : '—'

  return (
    <div>
      <h1 className="text-2xl mb-6">Dashboard</h1>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="card card-hover p-4">
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 rounded-lg ${c.bg}`}>
                <c.icon className={`w-5 h-5 ${c.accent}`} />
              </div>
            </div>
            <p className="text-sm text-gray-500">{c.label}</p>
            <p className="text-xl font-bold mt-0.5" style={{ fontFamily: 'var(--font-serif)' }}>
              {c.value}
            </p>
          </div>
        ))}
      </div>

      {/* Resumo Financeiro */}
      <div className="card p-6">
        <h2 className="text-lg mb-4">Resumo Financeiro</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Faturamento</p>
            <p className="text-xl font-bold text-massa-600 mt-1">
              R$ {data.faturamento_hoje.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Custo</p>
            <p className="text-xl font-bold text-amber-600 mt-1">
              R$ {data.custo_total_estimado.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Lucro</p>
            <p className={`text-xl font-bold mt-1 ${data.lucro_estimado >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              R$ {data.lucro_estimado.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Margem</p>
            <p className="text-xl font-bold text-gray-800 mt-1">
              {margem !== '—' ? `${margem}%` : margem}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
