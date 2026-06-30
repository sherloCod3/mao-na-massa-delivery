import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2, ShoppingBag, Package, Loader2 } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import AutocompleteProduto from '../components/AutocompleteProduto'
import { pedidosApi } from '../api/client'
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
  const [form, setForm] = useState({ cliente_nome: '', cliente_whatsapp: '', forma_pagamento: 'PIX', observacoes: '' })
  const [itens, setItens] = useState<ItemPedido[]>([])
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null)
  const [prodSearch, setProdSearch] = useState('')
  const [submitting, setSubmitting] = useState(false)

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
    if (!form.cliente_nome.trim()) {
      toast('error', 'Informe o nome do cliente!')
      return
    }
    setSubmitting(true)
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
      navigate('/admin/pedidos')
    } catch (err) {
      const msg = err instanceof MutationQueuedError ? err.message : 'Erro ao criar pedido'
      toast(err instanceof MutationQueuedError ? 'info' : 'error', msg)
      if (err instanceof MutationQueuedError) navigate('/admin/pedidos')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>          <PageHeader title="Novo Pedido" icon={<ShoppingBag className="w-6 h-6" />} backTo="/admin/pedidos" />

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

          {/* Busca de produtos com autocomplete */}
          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Adicionar produto</label>
            <AutocompleteProduto
              value={prodSearch}
              onChange={setProdSearch}
              onSelect={(produto) => {
                setSelectedProduto(produto)
                setProdSearch(produto.nome)
              }}
              placeholder="Buscar produto..."
              autoFocus={false}
            />
          </div>

          {/* Variações do produto selecionado */}
          {selectedProduto && (
            <div className="mt-3 p-4 bg-massa-50 rounded-xl border border-massa-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-massa-600" />
                  <span className="font-medium text-sm text-massa-800">{selectedProduto.nome}</span>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedProduto(null); setProdSearch('') }}
                  className="text-xs text-massa-600 hover:text-massa-800 underline"
                >
                  Trocar produto
                </button>
              </div>
              {selectedProduto.variacoes?.filter(v => v.ativo).length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-3">Nenhuma variação ativa</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {selectedProduto.variacoes?.filter(v => v.ativo).map(v => (
                    <button
                      type="button"
                      key={v.id}
                      onClick={() => {
                        addItem(v, selectedProduto.nome)
                        setSelectedProduto(null)
                        setProdSearch('')
                      }}
                      className="text-left p-3 border border-massa-200 bg-white rounded-xl
                        hover:border-massa-400 hover:shadow-sm hover:bg-massa-50
                        active:scale-[0.98] transition-all duration-150"
                    >
                      <span className="block text-sm font-medium text-primary">{v.nome}</span>
                      <span className="block text-xs text-massa-600 font-semibold mt-1">
                        R$ {v.preco_venda?.toFixed(2) || '—'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Total */}
        <div className="bg-white card p-6 flex items-center justify-between">
          <span className="text-lg font-semibold">Total</span>
          <span className="text-2xl font-bold text-massa-600">R$ {total.toFixed(2)}</span>
        </div>

        <button type="submit" disabled={submitting}
          className="w-full bg-massa-600 text-white py-3 rounded-xl font-medium hover:bg-massa-700
            transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[48px]">
          {submitting ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Criando pedido...</>
          ) : (
            'Finalizar Pedido'
          )}
        </button>
      </form>
    </div>
  )
}
