import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, AlertTriangle, Package } from 'lucide-react'
import { listarIngredientesOffline, criarIngredienteOffline, atualizarIngredienteOffline, desativarIngredienteOffline } from '../services/offlineClient'
import { MutationQueuedError } from '../services/mutationQueue'
import { useToast } from '../components/Toast'
import type { Ingrediente } from '../api/client'

export default function Ingredientes() {
  const { toast } = useToast()
  const [items, setItems] = useState<Ingrediente[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState({
    nome: '', unidade_medida: 'g' as string,
    preco_atual: 0, embalagem: 1000,
    quantidade_estoque: 0, estoque_minimo: 0,
  })

  const load = () => listarIngredientesOffline().then(setItems)

  useEffect(() => { load() }, [])

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
      load()
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
        load()
      } catch (err) {
        const msg = err instanceof MutationQueuedError ? err.message : 'Erro ao desativar ingrediente'
        toast(err instanceof MutationQueuedError ? 'info' : 'error', msg)
      }
    }
  }

  const unidadeLabel = (u: string) => u === 'g' ? 'Gramas (g)' : u === 'ml' ? 'Mililitros (ml)' : u === 'un' ? 'Unidade' : u

  const estoqueBaixo = items.filter(i => i.ativo && i.quantidade_estoque <= i.estoque_minimo && i.estoque_minimo > 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Ingredientes</h1>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm({ nome: '', unidade_medida: 'g', preco_atual: 0, embalagem: 1000, quantidade_estoque: 0, estoque_minimo: 0 }) }}
          className="flex items-center gap-2 bg-massa-600 text-white px-4 py-2 rounded-lg hover:bg-massa-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Novo Ingrediente
        </button>
      </div>

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

      {showForm && (
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
                    <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-800 p-1">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-800 p-1 ml-2">
                      <Trash2 className="w-4 h-4" />
                    </button>
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
    </div>
  )
}
