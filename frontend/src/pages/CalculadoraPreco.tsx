import { useState } from 'react'
import { Calculator, Trash2, Percent, ShoppingBag, Clock } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import AutocompleteIngrediente from '../components/AutocompleteIngrediente'
import { useToast } from '../components/Toast'
import { calculadoraApi } from '../api/client'
import type { Ingrediente, CalculoResponse } from '../api/client'

interface IngredienteSelecionado {
  ingrediente_id: number
  nome: string
  unidade_medida: string
  quantidade: number
}



export default function CalculadoraPreco() {
  const { toast } = useToast()
  const [ingredientes, setIngredientes] = useState<IngredienteSelecionado[]>([])
  const [searchIng, setSearchIng] = useState('')
  const [margem, setMargem] = useState(60)
  const [quantidade, setQuantidade] = useState(1)
  const [resultado, setResultado] = useState<CalculoResponse | null>(null)
  const [calculando, setCalculando] = useState(false)

  const addIngrediente = (ing: Ingrediente) => {
    if (ingredientes.some(i => i.ingrediente_id === ing.id)) {
      toast('info', `${ing.nome} já está na lista`)
      return
    }
    setIngredientes([...ingredientes, {
      ingrediente_id: ing.id,
      nome: ing.nome,
      unidade_medida: ing.unidade_medida,
      quantidade: 100,
    }])
    setSearchIng('')
  }

  const removeIngrediente = (idx: number) => {
    setIngredientes(ingredientes.filter((_, i) => i !== idx))
  }

  const updateQuantidade = (idx: number, qtd: number) => {
    const newIngs = [...ingredientes]
    newIngs[idx].quantidade = qtd
    setIngredientes(newIngs)
  }

  const calcular = async () => {
    if (ingredientes.length === 0) {
      toast('error', 'Adicione pelo menos um ingrediente')
      return
    }
    setCalculando(true)
    setResultado(null)
    try {
      const data = await calculadoraApi.calcular({
        ingredientes: ingredientes.map(i => ({ ingrediente_id: i.ingrediente_id, quantidade: i.quantidade })),
        margem_percentual: margem,
        quantidade_unidades: quantidade,
      })
      setResultado(data)
    } catch {
      toast('error', 'Erro ao calcular preço')
    } finally {
      setCalculando(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader title="Calculadora de Preço" icon={<Calculator className="w-6 h-6" />} />

      <div className="space-y-6">
        {/* Ingredientes */}
        <div className="bg-white card p-6">
          <h2 className="text-lg font-semibold mb-4">Ingredientes</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Adicionar ingrediente</label>
            <AutocompleteIngrediente
              value={searchIng}
              onChange={setSearchIng}
              onSelect={addIngrediente}
              placeholder="Buscar ingrediente..."
            />
          </div>

          {ingredientes.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              Adicione ingredientes para calcular o preço
            </p>
          ) : (
            <div className="space-y-2">
              {ingredientes.map((ing, idx) => (
                <div key={ing.ingrediente_id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                  <div className="flex-1 min-w-0">                     <p className="text-sm font-medium text-primary">{ing.nome}</p>
                    <p className="text-xs text-gray-400">{ing.unidade_medida === 'g' ? 'Gramas' : ing.unidade_medida === 'ml' ? 'Mililitros' : 'Unidades'}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0.1"
                      step="1"
                      value={ing.quantidade}
                      onChange={e => updateQuantidade(idx, parseFloat(e.target.value) || 0)}
                      className="w-20 border rounded-lg px-3 py-1.5 text-sm text-right"
                    />
                    <span className="text-xs text-gray-400 w-6">{ing.unidade_medida}</span>
                  </div>
                  <button onClick={() => removeIngrediente(idx)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Margem e Quantidade */}
        <div className="bg-white card p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Percent className="w-4 h-4 text-massa-500" />
                Margem de lucro: <strong className="text-massa-600">{margem}%</strong>
              </label>
              <input
                type="range"
                min="10"
                max="200"
                step="5"
                value={margem}
                onChange={e => setMargem(parseInt(e.target.value))}
                className="w-full accent-massa-500"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>10%</span>
                <span>100%</span>
                <span>200%</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-massa-500" />
                Quantidade de unidades
              </label>
              <input
                type="number"
                min="1"
                value={quantidade}
                onChange={e => setQuantidade(parseInt(e.target.value) || 1)}
                className="w-full border rounded-lg px-4 py-2.5 text-lg font-medium"
              />
            </div>
          </div>
        </div>

        {/* Calcular */}
        <button
          onClick={calcular}
          disabled={ingredientes.length === 0 || calculando}
          className="w-full bg-massa-600 text-white py-3 rounded-xl font-medium hover:bg-massa-700
            transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[48px]"
        >
          {calculando ? (
            <><Clock className="w-5 h-5 animate-spin" /> Calculando...</>
          ) : (
            <><Calculator className="w-5 h-5" /> Calcular Preço</>
          )}
        </button>

        {/* Resultado */}
        {resultado && (
          <div className="bg-white card p-6 border-2 border-massa-200">
            <h2 className="text-lg font-semibold mb-4 text-massa-800">Resultado</h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-massa-50 rounded-xl p-4 text-center">
                <p className="text-xs text-massa-500 uppercase tracking-wide mb-1">Custo Unitário</p>
                <p className="text-2xl font-bold text-primary" style={{ fontFamily: 'var(--font-serif)' }}>
                  R$ {resultado.custo_unitario.toFixed(2)}
                </p>
              </div>
              <div className="bg-massa-50 rounded-xl p-4 text-center border-2 border-massa-300">
                <p className="text-xs text-massa-500 uppercase tracking-wide mb-1">Preço Sugerido /un</p>
                <p className="text-2xl font-bold text-massa-600" style={{ fontFamily: 'var(--font-serif)' }}>
                  R$ {resultado.preco_sugerido_unitario.toFixed(2)}
                </p>
              </div>
              <div className="bg-massa-50 rounded-xl p-4 text-center">
                <p className="text-xs text-massa-500 uppercase tracking-wide mb-1">Total ({resultado.quantidade_unidades} un)</p>
                <p className="text-2xl font-bold text-green-600" style={{ fontFamily: 'var(--font-serif)' }}>
                  R$ {resultado.preco_sugerido_total.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Comparação preço/custo */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Custo: R$ {resultado.custo_unitario.toFixed(2)}</span>
                <span>Preço: R$ {resultado.preco_sugerido_unitario.toFixed(2)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-massa-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((resultado.custo_unitario / resultado.preco_sugerido_unitario) * 100, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0</span>
                <span className="text-green-600 font-medium">
                  Lucro: R$ {(resultado.preco_sugerido_unitario - resultado.custo_unitario).toFixed(2)}/un
                </span>
                <span>R$ {resultado.preco_sugerido_unitario.toFixed(2)}</span>
              </div>
            </div>

            {/* Tabela de detalhamento */}
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Detalhamento por Ingrediente</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b">
                  <th className="pb-2 pr-4">Ingrediente</th>
                  <th className="pb-2 pr-4 text-right">Qtd</th>
                  <th className="pb-2 pr-4 text-right">Preço/{resultado.detalhes[0]?.unidade_medida || 'g'}</th>
                  <th className="pb-2 text-right">Custo</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {resultado.detalhes.map(d => (
                  <tr key={d.ingrediente_id}>
                    <td className="py-2 pr-4 font-medium text-primary">{d.nome}</td>
                    <td className="py-2 pr-4 text-right text-gray-600">{d.quantidade}{d.unidade_medida}</td>
                    <td className="py-2 pr-4 text-right text-gray-500">R$ {d.preco_por_unidade_medida.toFixed(4)}</td>
                    <td className="py-2 text-right font-medium">R$ {d.custo.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-bold text-primary border-t-2">
                  <td className="py-2 pr-4">Total</td>
                  <td colSpan={2} />
                  <td className="py-2 text-right">R$ {resultado.custo_unitario.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>

            {/* Resumo final */}
            <div className="mt-6 bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Margem de lucro</span>
                <span className="font-medium">{resultado.margem_percentual}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Lucro por unidade</span>
                <span className="font-medium text-green-600">
                  R$ {(resultado.preco_sugerido_unitario - resultado.custo_unitario).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Lucro total ({resultado.quantidade_unidades} un)</span>
                <span className="font-medium text-green-600">
                  R$ {(resultado.preco_sugerido_total - resultado.custo_unitario * resultado.quantidade_unidades).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
