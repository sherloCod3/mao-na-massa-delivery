import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { variacoesApi } from '../api/client'
import { listarProdutosOffline, listarIngredientesOffline, obterReceitaOffline, obterCustoOffline } from '../services/offlineClient'
import { useToast } from '../components/Toast'
import type { Produto, Ingrediente, CustoVariacao } from '../api/client'

export default function Produtos() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [showVariacao, setShowVariacao] = useState<{ produtoId: number } | null>(null)
  const [showReceita, setShowReceita] = useState<{ variacaoId: number; nome: string } | null>(null)
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([])

  useEffect(() => {
    listarProdutosOffline().then(setProdutos)
    listarIngredientesOffline().then(setIngredientes)
  }, [])

  const loadProdutos = () => listarProdutosOffline().then(setProdutos)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Produtos</h1>

      {showVariacao && <VariacaoForm produtoId={showVariacao.produtoId} onClose={() => setShowVariacao(null)} onSave={loadProdutos} />}
      {showReceita && <ReceitaForm variacaoId={showReceita.variacaoId} nome={showReceita.nome} ingredientes={ingredientes}
        onClose={() => setShowReceita(null)} onSave={() => loadProdutos()} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {produtos.map(produto => (
          <div key={produto.id} className="bg-white card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">{produto.nome}</h3>
              <button onClick={() => setShowVariacao({ produtoId: produto.id })}
                className="flex items-center gap-1 text-sm text-massa-600 hover:text-massa-800">
                <Plus className="w-4 h-4" /> Variação
              </button>
            </div>
            {produto.descricao && <p className="text-sm text-gray-500 mb-3">{produto.descricao}</p>}
            {(!produto.variacoes || produto.variacoes.length === 0) ? (
              <p className="text-sm text-gray-400">Nenhuma variação cadastrada</p>
            ) : (
              <div className="space-y-2">
                {produto.variacoes.map(v => (
                  <div key={v.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{v.nome}</p>
                      <p className="text-xs text-gray-500">
                        Custo: R$ {v.custo_unitario.toFixed(2)} | Sugerido: R$ {v.preco_sugerido.toFixed(2)} | Margem: {v.margem_percentual}%
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {v.preco_venda && <span className="text-sm font-bold text-green-600">R$ {v.preco_venda.toFixed(2)}</span>}
                      <button onClick={async () => {
                        setShowReceita({ variacaoId: v.id, nome: v.nome })
                      }} className="text-xs text-blue-600 hover:text-blue-800">
                        Receita
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {produtos.length === 0 && (
          <div className="col-span-2 text-center py-12 text-gray-400">
            Nenhum produto cadastrado. Use a API para criar um.
          </div>
        )}
      </div>
    </div>
  )
}

function VariacaoForm({ produtoId, onClose, onSave }: { produtoId: number; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({ nome: '', preco_venda: 0, preco_minimo: 0, margem_percentual: 60 })
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await variacoesApi.criar(produtoId, { ...form, preco_minimo: form.preco_minimo || null, preco_venda: form.preco_venda || null })
      toast('success', 'Variação criada!')
      onSave()
      onClose()
    } catch {
      toast('error', 'Erro ao criar variação')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <form onClick={e => e.stopPropagation()} onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Nova Variação</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input required className="w-full border rounded-lg px-3 py-2" value={form.nome}
              onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Tradicional" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preço Venda (R$)</label>
              <input type="number" step="0.01" min="0" className="w-full border rounded-lg px-3 py-2"
                value={form.preco_venda} onChange={e => setForm({ ...form, preco_venda: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Margem (%)</label>
              <input type="number" step="5" min="0" required className="w-full border rounded-lg px-3 py-2"
                value={form.margem_percentual}
                onChange={e => setForm({ ...form, margem_percentual: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-6">
          <button type="submit" className="bg-massa-600 text-white px-6 py-2 rounded-lg hover:bg-massa-700">Criar</button>
          <button type="button" onClick={onClose} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200">Cancelar</button>
        </div>
      </form>
    </div>
  )
}

function ReceitaForm({ variacaoId, nome, ingredientes, onClose, onSave }: {
  variacaoId: number; nome: string; ingredientes: Ingrediente[]; onClose: () => void; onSave: () => void
}) {
  const [receita, setReceita] = useState<any[]>([])
  const [custo, setCusto] = useState<CustoVariacao | null>(null)
  const [addIngrediente, setAddIngrediente] = useState({ ingrediente_id: 0, quantidade: 0 })
  const { toast } = useToast()

  const load = async () => {
    setReceita(await obterReceitaOffline(variacaoId))
    setCusto(await obterCustoOffline(variacaoId))
  }

  useEffect(() => { load() }, [variacaoId])

  const handleAdd = async () => {
    if (!addIngrediente.ingrediente_id || !addIngrediente.quantidade) {
      toast('error', 'Selecione um ingrediente e informe a quantidade')
      return
    }
    try {
      await variacoesApi.adicionarIngrediente(variacaoId, addIngrediente)
      toast('success', 'Ingrediente adicionado à receita!')
      setAddIngrediente({ ingrediente_id: 0, quantidade: 0 })
      load()
      onSave()
    } catch {
      toast('error', 'Erro ao adicionar ingrediente')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[80vh] overflow-auto">
        <h2 className="text-lg font-semibold mb-1">Receita: {nome}</h2>
        {custo && (
          <p className="text-sm text-gray-500 mb-4">
            Custo unitário: <strong>R$ {custo.custo_unitario.toFixed(2)}</strong> |
            Preço sugerido: <strong>R$ {custo.preco_sugerido.toFixed(2)}</strong> ({custo.margem_percentual}% margem)
          </p>
        )}

        <div className="space-y-2 mb-4">
          {receita.map(item => (
            <div key={item.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
              <div>
                <p className="text-sm font-medium">{item.ingrediente?.nome}</p>
                <p className="text-xs text-gray-500">{item.quantidade}{item.ingrediente?.unidade_medida} × R$ {(item.ingrediente?.preco_atual / item.ingrediente?.embalagem).toFixed(4)}</p>
              </div>
              <p className="text-sm font-mono">R$ {(item.quantidade * item.ingrediente?.preco_atual / item.ingrediente?.embalagem).toFixed(4)}</p>
            </div>
          ))}
          {receita.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Nenhum ingrediente na receita</p>}
        </div>

        <div className="flex gap-2 items-end border-t pt-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">Ingrediente</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm" value={addIngrediente.ingrediente_id}
              onChange={e => setAddIngrediente({ ...addIngrediente, ingrediente_id: parseInt(e.target.value) })}>
              <option value={0}>Selecione...</option>
              {ingredientes.filter(i => !receita.find(r => r.ingrediente_id === i.id)).map(i =>
                <option key={i.id} value={i.id}>{i.nome} (R$ {i.preco_atual.toFixed(2)}/{i.embalagem}{i.unidade_medida})</option>
              )}
            </select>
          </div>
          <div className="w-24">
            <label className="block text-xs font-medium text-gray-700 mb-1">Qtd ({receita[0]?.ingrediente?.unidade_medida || 'g'})</label>
            <input type="number" step="1" min="0" className="w-full border rounded-lg px-3 py-2 text-sm"
              value={addIngrediente.quantidade} onChange={e => setAddIngrediente({ ...addIngrediente, quantidade: parseFloat(e.target.value) || 0 })} />
          </div>
          <button onClick={handleAdd} className="bg-massa-600 text-white px-4 py-2 rounded-lg hover:bg-massa-700 text-sm">+</button>
        </div>

        <button onClick={onClose} className="mt-4 w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 text-sm">Fechar</button>
      </div>
    </div>
  )
}
