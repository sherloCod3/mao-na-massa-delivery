import { TrendingUp, Medal } from 'lucide-react'
import type { ProdutoMaisVendido } from '../api/client'

const rankColors = ['text-amber-500', 'text-gray-400', 'text-amber-700']

export default function TopProdutos({ data }: { data: ProdutoMaisVendido[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
        <TrendingUp className="w-5 h-5 mr-2" />
        Nenhum pedido concluído ainda
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {data.map((p, idx) => (
        <div
          key={`${p.produto_nome}|${p.variacao_nome}`}
          className="flex items-center justify-between bg-white rounded-xl border p-3 hover:border-massa-200 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              idx < 3 ? 'bg-massa-50 text-massa-600' : 'bg-gray-50 text-gray-400'
            }`}>
              {idx < 3 ? <Medal className={`w-4 h-4 ${rankColors[idx]}`} /> : idx + 1}
            </div>
            <div>
              <p className="text-sm font-medium text-primary">{p.produto_nome}</p>
              <p className="text-xs text-gray-400">{p.variacao_nome}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-primary">{p.quantidade} un</p>
            <p className="text-xs text-gray-500">R$ {p.total_faturado.toFixed(2)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
