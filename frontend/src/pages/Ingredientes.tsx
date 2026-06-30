import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, AlertTriangle, Package, ArrowUpDown, X, History, ClipboardList, Clock } from 'lucide-react'
import { listarIngredientesOffline, criarIngredienteOffline, atualizarIngredienteOffline, desativarIngredienteOffline, movimentarEstoqueOffline, listarMovimentacoesOffline } from '../services/offlineClient'
import { MutationQueuedError } from '../services/mutationQueue'
import { useToast } from '../components/Toast'
import type { Ingrediente, MovimentacaoEstoque } from '../api/client'
import PageHeader from '../components/PageHeader'
import AutocompleteIngrediente from '../components/AutocompleteIngrediente'

export default function Ingredientes() {
  const { toast } = useToast()
  const [items, setItems] = useState<Ingrediente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState({
    nome: '', unidade_medida: 'g' as string,
    preco_atual: 0, embalagem: 1000,
    quantidade_estoque: 0, estoque_minimo: 0,
  })
  const [movForm, setMovForm] = useState<{ open: boolean; id: number; nome: string; tipo: 'entrada' | 'saida'; quantidade: number; motivo: string }>({
    open: false, id: 0, nome: '', tipo: 'entrada', quantidade: 0, motivo: '',
  })
  const [movIngSearch, setMovIngSearch] = useState('')
  const [histModal, setHistModal] = useState<{ open: boolean; nome: string; movs: MovimentacaoEstoque[] }>({
    open: false, nome: '', movs: [],
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listarIngredientesOffline()
      setItems(data)
    } catch {
      setError('Erro ao carregar ingredientes')
    } finally {
      setLoading(false)
    }
  }, [])

  // Refresh pós-CRUD sem loading state
  const refresh = useCallback(async () => {
    try {
      const data = await listarIngredientesOffline()
      setItems(data)
    } catch {
      // Silêncio — dados anteriores continuam visíveis
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editId) {
        await atualizarIngredienteOffline(editId, form)
        toast('success', 'Ingrediente atualizado!')
      } else {
        await criarIngredienteOffline(form)
        toast('success', 'Ingrediente criado!')
      }
      setShowForm(false)
      setEditId(null)
      setForm({ nome: '', unidade_medida: 'g', preco_atual: 0, embalagem: 1000, quantidade_estoque: 0, estoque_minimo: 0 })
      refresh()
    } catch (err) {
      const msg = err instanceof MutationQueuedError ? err.message : 'Erro ao salvar ingrediente'
      toast(err instanceof MutationQueuedError ? 'info' : 'error', msg)
    }
  }

  const handleEdit = (item: Ingrediente) => {
    setForm({
      nome: item.nome, unidade_medida: item.unidade_medida,
      preco_atual: item.preco_atual, embalagem: item.embalagem,
      quantidade_estoque: item.quantidade_estoque, estoque_minimo: item.estoque_minimo,
    })
    setEditId(item.id)
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm('Desativar este ingrediente?')) {
      try {
        await desativarIngredienteOffline(id)
        toast('success', 'Ingrediente desativado')
        refresh()
      } catch (err) {
        const msg = err instanceof MutationQueuedError ? err.message : 'Erro ao desativar ingrediente'
        toast(err instanceof MutationQueuedError ? 'info' : 'error', msg)
      }
    }
  }

  const unidadeLabel = (u: string) => u === 'g' ? 'Gramas (g)' : u === 'ml' ? 'Mililitros (ml)' : u === 'un' ? 'Unidade' : u

  const openHistorico = async (item: Ingrediente) => {
    try {
      const movs = await listarMovimentacoesOffline(item.id)
      setHistModal({ open: true, nome: item.nome, movs })
    } catch (err) {
      toast('error', 'Erro ao carregar histórico')
    }
  }

  const openMovForm = (item: Ingrediente, tipo: 'entrada' | 'saida') => {
    setMovForm({ open: true, id: item.id, nome: item.nome, tipo, quantidade: 0, motivo: '' })
    setMovIngSearch(item.nome) // Pré-preenche o autocomplete
  }

  const handleMovSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const result = await movimentarEstoqueOffline(movForm.id, {
        tipo: movForm.tipo,
        quantidade: movForm.quantidade,
        motivo: movForm.motivo || undefined,
      })
      toast('success', `${movForm.tipo === 'entrada' ? 'Entrada' : 'Saída'} registrada! Saldo: ${result.saldo_posterior}`)
      setMovForm({ open: false, id: 0, nome: '', tipo: 'entrada', quantidade: 0, motivo: '' })
      refresh()
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Erro ao movimentar estoque')
    }
  }

  const estoqueBaixo = items.filter(i => i.ativo && i.quantidade_estoque <= i.estoque_minimo && i.estoque_minimo > 0)

  return (
    <div>
      <PageHeader
        title="Ingredientes"
        icon={<ClipboardList className="w-6 h-6" />}
        action={
          <button
            onClick={() => { setShowForm(true); setEditId(null); setForm({ nome: '', unidade_medida: 'g', preco_atual: 0, embalagem: 1000, quantidade_estoque: 0, estoque_minimo: 0 }) }}
            className="flex items-center gap-2 bg-massa-600 text-white px-4 py-2 rounded-lg hover:bg-massa-700 transition-colors min-w-[44px] min-h-[44px] justify-center"
          >
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Novo Ingrediente</span>
          </button>
        }
      />

      {/* Alerta de estoque baixo */}
      {estoqueBaixo.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800 text-sm">
              {estoqueBaixo.length} ingrediente{estoqueBaixo.length > 1 ? 's' : ''} com estoque baixo
            </p>
            <ul className="text-sm text-red-700 mt-1 space-y-0.5">
              {estoqueBaixo.map(i => (
                <li key={i.id}>• {i.nome}: <strong>{i.quantidade_estoque}</strong>/{i.estoque_minimo} {i.unidade_medida}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <Clock className="w-8 h-8 text-massa-300 animate-spin" />
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="card p-8 text-center">
          <p className="text-red-600 mb-2">{error}</p>
          <button onClick={() => window.location.reload()} className="text-sm text-massa-600 hover:underline">Tentar novamente</button>
        </div>
      )}

      {!loading && !error && showForm && (
        <form onSubmit={handleSubmit} className="bg-white card p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">{editId ? 'Editar' : 'Novo'} Ingrediente</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <input required className="w-full border rounded-lg px-3 py-2" value={form.nome}
                onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Peito de Frango" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
              <select className="w-full border rounded-lg px-3 py-2" value={form.unidade_medida}
                onChange={e => setForm({ ...form, unidade_medida: e.target.value })}>
                <option value="g">Gramas (g)</option>
                <option value="ml">Mililitros (ml)</option>
                <option value="un">Unidade</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
              <input type="number" step="0.01" min="0" required className="w-full border rounded-lg px-3 py-2"
                value={form.preco_atual} onChange={e => setForm({ ...form, preco_atual: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Embalagem ({form.unidade_medida})</label>
              <input type="number" step="1" min="1" required className="w-full border rounded-lg px-3 py-2"
                value={form.embalagem}
                onChange={e => setForm({ ...form, embalagem: parseFloat(e.target.value) || 1 })}
                title="Quantidade na embalagem. Ex: 1000 para 1kg, 1 para unidade" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Package className="w-3.5 h-3.5" /> Estoque Atual ({form.unidade_medida})
              </label>
              <input type="number" step="0.01" min="0" required className="w-full border rounded-lg px-3 py-2"
                value={form.quantidade_estoque}
                onChange={e => setForm({ ...form, quantidade_estoque: parseFloat(e.target.value) || 0 })}
                title="Quantidade atual em estoque" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estoque Mínimo ({form.unidade_medida})</label>
              <input type="number" step="0.01" min="0" required className="w-full border rounded-lg px-3 py-2"
                value={form.estoque_minimo}
                onChange={e => setForm({ ...form, estoque_minimo: parseFloat(e.target.value) || 0 })}
                title="Nível mínimo para alerta. Ex: 500g = alerta quando estoque <= 500" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Ex: Frango R$15,90/kg → preço=15.90, embalagem=1000g, estoque=5000g, mínimo=1000g
          </p>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="bg-massa-600 text-white px-6 py-2 rounded-lg hover:bg-massa-700">
              {editId ? 'Salvar' : 'Criar'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditId(null) }}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {!loading && !error && (
      <div className="bg-white card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Nome</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Unidade</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Preço</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Embalagem</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Estoque</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Preço/g</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map(item => {
              const baixo = item.ativo && item.quantidade_estoque <= item.estoque_minimo && item.estoque_minimo > 0
              return (
                <tr key={item.id} className={`hover:bg-gray-50 ${baixo ? 'bg-red-50/50' : ''}`}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{item.nome}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{unidadeLabel(item.unidade_medida)}</td>
                  <td className="px-4 py-3 text-sm text-right">R$ {item.preco_atual.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-right">{item.embalagem}</td>
                  <td className="px-4 py-3 text-sm text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className={baixo ? 'text-red-700 font-semibold' : 'text-gray-700'}>
                        {item.quantidade_estoque}
                      </span>
                      {baixo && (
                        <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3" />
                          BAIXO
                        </span>
                      )}
                      {item.quantidade_estoque > item.estoque_minimo && item.estoque_minimo > 0 && (
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          OK
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-500">
                    R$ {(item.preco_atual / item.embalagem).toFixed(4)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center" title="Editar">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => openHistorico(item)} title="Histórico" className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 p-2 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
                        <History className="w-4 h-4" />
                      </button>
                      <button onClick={() => openMovForm(item, 'entrada')} title="Dar entrada" className="text-green-600 hover:text-green-800 hover:bg-green-50 p-2 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
                        <Package className="w-4 h-4" />
                      </button>
                      <button onClick={() => openMovForm(item, 'saida')} title="Dar saída" className="text-orange-600 hover:text-orange-800 hover:bg-orange-50 p-2 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
                        <ArrowUpDown className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center" title="Desativar">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {items.length === 0 && (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">Nenhum ingrediente cadastrado</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de histórico de movimentações */}
      {histModal.open && (
        <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50" onClick={() => setHistModal({ open: false, nome: '', movs: [] })}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <History className="w-5 h-5 text-gray-500" />
                Histórico — {histModal.nome}
              </h2>
              <button onClick={() => setHistModal({ open: false, nome: '', movs: [] })} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-6">
              {histModal.movs.length === 0 ? (
                <p className="text-center text-gray-400 py-8">Nenhuma movimentação registrada</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 uppercase tracking-wide">
                      <th className="pb-2 pr-4">Data</th>
                      <th className="pb-2 pr-4">Tipo</th>
                      <th className="pb-2 pr-4 text-right">Qtd</th>
                      <th className="pb-2 pr-4 text-right">Saldo Ant.</th>
                      <th className="pb-2 pr-4 text-right">Saldo Atual</th>
                      <th className="pb-2">Motivo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-sm">
                    {histModal.movs.map(m => (
                      <tr key={m.id}>
                        <td className="py-2.5 pr-4 text-gray-500 whitespace-nowrap">
                          {new Date(m.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            m.tipo === 'entrada' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {m.tipo === 'entrada' ? '📦 Entrada' : '📤 Saída'}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 text-right font-medium">{m.quantidade}</td>
                        <td className="py-2.5 pr-4 text-right text-gray-500">{m.saldo_anterior}</td>
                        <td className="py-2.5 pr-4 text-right font-semibold">{m.saldo_posterior}</td>
                        <td className="py-2.5 text-gray-500 max-w-[200px] truncate" title={m.motivo || ''}>{m.motivo || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de movimentação de estoque */}
      {movForm.open && (
        <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50" onClick={() => setMovForm({ ...movForm, open: false })}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {movForm.tipo === 'entrada' ? '📦 Dar Entrada' : '📤 Dar Saída'}
              </h2>
              <button onClick={() => setMovForm({ ...movForm, open: false })} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleMovSubmit} className="space-y-4">
              {/* Autocomplete para selecionar ingrediente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ingrediente</label>
                <AutocompleteIngrediente
                  value={movIngSearch}
                  onChange={setMovIngSearch}
                  placeholder="Buscar ingrediente..."
                  autoFocus
                  onSelect={ing => {
                    setMovForm(prev => ({ ...prev, id: ing.id, nome: ing.nome }))
                    setMovIngSearch(ing.nome)
                  }}
                />
                {movForm.id > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Selecionado: <strong>{movForm.nome}</strong>
                    {' — '}ID: {movForm.id}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantidade {movForm.tipo === 'entrada' ? 'a adicionar' : 'a remover'}
                </label>
                <input
                  type="number" step="0.01" min="0" required
                  className="w-full border rounded-lg px-3 py-2 text-lg"
                  value={movForm.quantidade || ''}
                  onChange={e => setMovForm({ ...movForm, quantidade: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo (opcional)</label>
                <input
                  type="text"
                  className="w-full border rounded-lg px-3 py-2"
                  value={movForm.motivo}
                  onChange={e => setMovForm({ ...movForm, motivo: e.target.value })}
                  placeholder={movForm.tipo === 'entrada' ? 'Ex: Compra do fornecedor' : 'Ex: Produção do dia'}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={!movForm.id}
                  className={`flex-1 py-2 rounded-lg text-white font-medium disabled:opacity-50 ${
                    movForm.tipo === 'entrada'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-orange-600 hover:bg-orange-700'
                  }`}>
                  Confirmar {movForm.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                </button>
                <button type="button" onClick={() => setMovForm({ ...movForm, open: false })}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
