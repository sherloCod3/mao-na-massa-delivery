import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, ShoppingBag } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { pedidosApi } from '../api/client'
import { listarProdutosOffline } from '../services/offlineClient'
import { MutationQueuedError } from '../services/mutationQueue'
import { useToast } from '../components/Toast'
import type { Produto, Variacao } from '../api/client'

interface ItemPedido {
  variacao_id: number
  quantidade: number
  preco_unitario: number
  variacao_nome?: string
  customizacoes: { nome: string; preco: number }[]
}

export default function PedidoNovo() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [form, setForm] = useState({ cliente_nome: '', cliente_whatsapp: '', forma_pagamento: 'PIX', observacoes: '' })
  const [itens, setItens] = useState<ItemPedido[]>([])

  useEffect(() => { listarProdutosOffline().then(setProdutos) }, [])

  const addItem = (v: Variacao, pnome: string) => {
    setItens([...itens, { variacao_id: v.id, quantidade: 1, preco_unitario: v.preco_venda || 0, variacao_nome: `${pnome} - ${v.nome}`, customizacoes: [] }])
  }

  const removeItem = (idx: number) => setItens(itens.filter((_, i) => i !== idx))

  const total = itens.reduce((acc, item) => {
    const customTotal = item.customizacoes.reduce((s, c) => s + c.preco, 0)
    return acc + item.quantidade * (item.preco_unitario + customTotal)
  }, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (itens.length === 0) {
      toast('error', 'Adicione pelo menos um item ao pedido!')
      return
    }
    try {
      await pedidosApi.criar({
        ...form,
        itens: itens.map(i => ({
          variacao_id: i.variacao_id,
          quantidade: i.quantidade,
          preco_unitario: i.preco_unitario,
          customizacoes: i.customizacoes,
        })),
      })
      toast('success', 'Pedido criado com sucesso!')
      navigate('/pedidos')
    } catch (err) {
      const msg = err instanceof MutationQueuedError ? err.message : 'Erro ao criar pedido'
      toast(err instanceof MutationQueuedError ? 'info' : 'error', msg)
      if (err instanceof MutationQueuedError) navigate('/pedidos')
    }
  }

  return (
    <div>
      <PageHeader title="Novo Pedido" icon={<ShoppingBag className="w-6 h-6" />} backTo="/pedidos" />

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        {/* Dados do cliente */}
        <div className="bg-white card p-6">
          <h2 className="text-lg font-semibold mb-4">Dados do Cliente</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
              <input required className="w-full border rounded-lg px-3 py-2" value={form.cliente_nome}
                onChange={e => setForm({ ...form, cliente_nome: e.target.value })} placeholder="Nome do cliente" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
              <input className="w-full border rounded-lg px-3 py-2" value={form.cliente_whatsapp}
                onChange={e => setForm({ ...form, cliente_whatsapp: e.target.value })} placeholder="11999999999" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pagamento</label>
              <select className="w-full border rounded-lg px-3 py-2" value={form.forma_pagamento}
                onChange={e => setForm({ ...form, forma_pagamento: e.target.value })}>
                <option value="PIX">PIX</option>
                <option value="Dinheiro">Dinheiro</option>
                <option value="Cartão">Cartão</option>
                <option value="Pendente">Pendente</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
              <input className="w-full border rounded-lg px-3 py-2" value={form.observacoes}
                onChange={e => setForm({ ...form, observacoes: e.target.value })} placeholder="Sem cebola..." />
            </div>
          </div>
        </div>

        {/* Itens */}
        <div className="bg-white card p-6">
          <h2 className="text-lg font-semibold mb-4">Itens do Pedido</h2>

          {itens.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 mb-2">
              <div className="flex-1">
                <p className="text-sm font-medium">{item.variacao_nome}</p>
                <p className="text-xs text-gray-500">R$ {item.preco_unitario.toFixed(2)}/un</p>
              </div>
              <input type="number" min="1" className="w-16 border rounded px-2 py-1 text-sm text-center"
                value={item.quantidade}
                onChange={e => {
                  const newItens = [...itens]
                  newItens[idx].quantidade = parseInt(e.target.value) || 1
                  setItens(newItens)
                }} />
              <span className="text-sm font-medium w-20 text-right">
                R$ {(item.quantidade * item.preco_unitario).toFixed(2)}
              </span>
              <button type="button" onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-700 p-1">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {/* Seleção de variações */}
          <details className="mt-3">
            <summary className="text-sm text-massa-600 cursor-pointer hover:text-massa-800 font-medium">
              <Plus className="w-4 h-4 inline mr-1" /> Adicionar item
            </summary>
            <div className="mt-3 space-y-2 max-h-60 overflow-auto">
              {produtos.map(p => (
                <div key={p.id}>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{p.nome}</p>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {p.variacoes?.filter(v => v.ativo).map(v => (
                      <button type="button" key={v.id} onClick={() => addItem(v, p.nome)}
                        className="text-left p-2 border rounded-lg hover:bg-massa-50 hover:border-massa-300 text-sm">
                        {v.nome}
                        <span className="block text-xs text-gray-500">R$ {v.preco_venda?.toFixed(2) || '—'}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </details>
        </div>

        {/* Total */}
        <div className="bg-white card p-6 flex items-center justify-between">
          <span className="text-lg font-semibold">Total</span>
          <span className="text-2xl font-bold text-massa-600">R$ {total.toFixed(2)}</span>
        </div>

        <button type="submit" className="w-full bg-massa-600 text-white py-3 rounded-xl font-medium hover:bg-massa-700 transition-colors">
          Finalizar Pedido
        </button>
      </form>
    </div>
  )
}
