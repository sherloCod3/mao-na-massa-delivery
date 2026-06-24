import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { listarIngredientesOffline, criarIngredienteOffline, atualizarIngredienteOffline, desativarIngredienteOffline } from '../services/offlineClient'
import { useToast } from '../components/Toast'
import type { Ingrediente } from '../api/client'

export default function Ingredientes() {
  const { toast } = useToast()
  const [items, setItems] = useState<Ingrediente[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState({ nome: '', unidade_medida: 'g', preco_atual: 0, embalagem: 1000 })

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
      setForm({ nome: '', unidade_medida: 'g', preco_atual: 0, embalagem: 1000 })
      load()
    } catch {
      toast('error', 'Erro ao salvar ingrediente')
    }
  }

  const handleEdit = (item: Ingrediente) => {
    setForm({ nome: item.nome, unidade_medida: item.unidade_medida, preco_atual: item.preco_atual, embalagem: item.embalagem })
    setEditId(item.id)
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm('Desativar este ingrediente?')) {
      try {
        await desativarIngredienteOffline(id)
        toast('success', 'Ingrediente desativado')
        load()
      } catch {
        toast('error', 'Erro ao desativar ingrediente')
      }
    }
  }

  const unidadeLabel = (u: string) => u === 'g' ? 'Gramas (g)' : u === 'ml' ? 'Mililitros (ml)' : u === 'un' ? 'Unidade' : u

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Ingredientes</h1>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm({ nome: '', unidade_medida: 'g', preco_atual: 0, embalagem: 1000 }) }}
          className="flex items-center gap-2 bg-massa-600 text-white px-4 py-2 rounded-lg hover:bg-massa-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Novo Ingrediente
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white card p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">{editId ? 'Editar' : 'Novo'} Ingrediente</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Ex: Frango R$15,90/kg → preço=15.90, embalagem=1000g
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
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Preço/{'g/ml'}</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map(item => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-800">{item.nome}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{unidadeLabel(item.unidade_medida)}</td>
                <td className="px-4 py-3 text-sm text-right">R$ {item.preco_atual.toFixed(2)}</td>
                <td className="px-4 py-3 text-sm text-right">{item.embalagem}</td>
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
            ))}
            {items.length === 0 && (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">Nenhum ingrediente cadastrado</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
