import { useEffect, useState } from 'react'
import { Package, AlertTriangle } from 'lucide-react'
import { listarIngredientesOffline } from '../services/offlineClient'
import type { Ingrediente } from '../api/client'

export default function EstoqueChart() {
  const [itens, setItens] = useState<Ingrediente[]>([])

  useEffect(() => {
    listarIngredientesOffline().then(setItens)
  }, [])

  const ativos = itens
    .filter(i => i.ativo && i.estoque_minimo > 0)
    .sort((a, b) => (a.quantidade_estoque / a.estoque_minimo) - (b.quantidade_estoque / b.estoque_minimo))
    .slice(0, 12)

  if (ativos.length === 0) return null

  const maxVal = Math.max(...ativos.map(i => Math.max(i.quantidade_estoque, i.estoque_minimo)))

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg flex items-center gap-2">
          <Package className="w-5 h-5 text-massa-500" />
          Nível de Estoque
        </h2>
        <a href="/ingredientes" className="text-xs text-massa-600 hover:text-massa-700 underline">
          Gerenciar
        </a>
      </div>

      <div className="space-y-3">
        {ativos.map(item => {
          const ratio = item.quantidade_estoque / item.estoque_minimo
          const baixo = item.estoque_baixo
          const pctAtual = (item.quantidade_estoque / maxVal) * 100
          const pctMin = (item.estoque_minimo / maxVal) * 100

          return (
            <div key={item.id}>
              <div className="flex items-center justify-between text-sm mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-gray-700">{item.nome}</span>
                  {baixo && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className={baixo ? 'text-red-600 font-semibold' : ''}>
                    {item.quantidade_estoque}
                  </span>
                  <span className="text-gray-300">|</span>
                  <span className="text-gray-400">min {item.estoque_minimo}</span>
                </div>
              </div>

              <div className="relative h-5 bg-gray-100 rounded-full overflow-hidden">
                {/* Minimum line indicator */}
                <div
                  className="absolute inset-y-0 border-r-2 border-dashed border-gray-400 z-10"
                  style={{ left: `${pctMin}%` }}
                />

                {/* Current stock bar */}
                <div
                  className={`h-full rounded-full transition-all ${
                    baixo
                      ? 'bg-gradient-to-r from-red-500 to-red-400'
                      : ratio < 1.5
                        ? 'bg-gradient-to-r from-amber-400 to-yellow-400'
                        : 'bg-gradient-to-r from-green-400 to-emerald-500'
                  }`}
                  style={{ width: `${Math.min(pctAtual, 100)}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-gradient-to-r from-green-400 to-emerald-500" />
          <span>Estável</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-gradient-to-r from-amber-400 to-yellow-400" />
          <span>Próximo do mínimo</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-gradient-to-r from-red-500 to-red-400" />
          <span>Crítico</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 border-t-2 border-dashed border-gray-400" />
          <span>Mínimo</span>
        </div>
      </div>
    </div>
  )
}
