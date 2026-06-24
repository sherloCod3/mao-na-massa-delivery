import { useEffect, useState, useCallback } from 'react'
import {
  ShoppingCart, Plus, Trash2, Check, X, DollarSign, ClipboardList,
  Lightbulb, Save, Download, Archive,
} from 'lucide-react'
import { listaComprasApi } from '../api/client'
import { listarComprasOffline, obterResumoComprasOffline } from '../services/offlineClient'
import { MutationQueuedError } from '../services/mutationQueue'
import { useToast } from '../components/Toast'
import type { ListaCompraItem, ListaCompraResumo, ListaSalvaResumo } from '../api/client'

export default function ListaCompras() {
  const [itens, setItens] = useState<ListaCompraItem[]>([])
  const [resumo, setResumo] = useState<ListaCompraResumo | null>(null)
  const [sugestoes, setSugestoes] = useState<{ nome: string; unidade_medida: string | null; valor_sugerido: number | null }[]>([])
  const [salvas, setSalvas] = useState<ListaSalvaResumo[]>([])
  const [novoNome, setNovoNome] = useState('')
  const [novoValor, setNovoValor] = useState('')
  const [novoQtd, setNovoQtd] = useState('1')
  const [loading, setLoading] = useState(true)
  const [showSalvarModal, setShowSalvarModal] = useState(false)
  const [nomeSalvar, setNomeSalvar] = useState('')
  const [showSalvas, setShowSalvas] = useState(false)
  const { toast } = useToast()

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const [itensData, resumoData, sugestoesData, salvasData] = await Promise.all([
        listarComprasOffline(),
        obterResumoComprasOffline(),
        listaComprasApi.sugestoes(),
        listaComprasApi.listarSalvas(),
      ])
      setItens(itensData)
      setResumo(resumoData)
      setSugestoes(sugestoesData)
      setSalvas(salvasData)
    } catch (e) {
      console.error('Erro ao carregar lista:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  const adicionar = async (nome?: string, qtd?: number, valor?: number | null) => {
    const itemNome = nome || novoNome.trim()
    if (!itemNome) return
    try {
      await listaComprasApi.criar({
        nome: itemNome,
        quantidade: qtd ?? (novoQtd ? parseFloat(novoQtd) : 1),
        valor_estimado: valor !== undefined ? valor : (novoValor ? parseFloat(novoValor) : null),
      })
      toast('success', 'Item adicionado!')
      setNovoNome('')
      setNovoValor('')
      setNovoQtd('1')
      await carregar()
    } catch (err) {
      const msg = err instanceof MutationQueuedError ? err.message : 'Erro ao adicionar item'
      toast(err instanceof MutationQueuedError ? 'info' : 'error', msg)
    }
  }

  const toggleComprado = async (item: ListaCompraItem) => {
    try {
      await listaComprasApi.atualizar(item.id, { comprado: !item.comprado })
      await carregar()
    } catch (err) {
      const msg = err instanceof MutationQueuedError ? err.message : 'Erro ao atualizar item'
      toast(err instanceof MutationQueuedError ? 'info' : 'error', msg)
    }
  }

  const atualizarValor = async (item: ListaCompraItem, valor: string) => {
    const v = valor ? parseFloat(valor) : null
    if (v === item.valor_estimado) return
    try {
      await listaComprasApi.atualizar(item.id, { valor_estimado: v })
      await carregar()
    } catch (err) {
      const msg = err instanceof MutationQueuedError ? err.message : 'Erro ao atualizar valor'
      toast(err instanceof MutationQueuedError ? 'info' : 'error', msg)
    }
  }

  const remover = async (id: number) => {
    try {
      await listaComprasApi.remover(id)
      toast('success', 'Item removido')
      await carregar()
    } catch (err) {
      const msg = err instanceof MutationQueuedError ? err.message : 'Erro ao remover item'
      toast(err instanceof MutationQueuedError ? 'info' : 'error', msg)
    }
  }

  const limparComprados = async () => {
    try {
      await listaComprasApi.limparComprados()
      toast('success', 'Itens comprados removidos!')
      await carregar()
    } catch (err) {
      const msg = err instanceof MutationQueuedError ? err.message : 'Erro ao limpar itens'
      toast(err instanceof MutationQueuedError ? 'info' : 'error', msg)
    }
  }

  const salvarLista = async () => {
    if (!nomeSalvar.trim()) return
    try {
      await listaComprasApi.salvar(nomeSalvar.trim())
      toast('success', 'Lista salva!')
      setNomeSalvar('')
      setShowSalvarModal(false)
      await carregar()
    } catch (err) {
      const msg = err instanceof MutationQueuedError ? err.message : 'Erro ao salvar lista'
      toast(err instanceof MutationQueuedError ? 'info' : 'error', msg)
    }
  }

  const carregarSalva = async (id: number) => {
    try {
      await listaComprasApi.carregar(id)
      toast('success', 'Lista carregada!')
      setShowSalvas(false)
      await carregar()
    } catch (err) {
      const msg = err instanceof MutationQueuedError ? err.message : 'Erro ao carregar lista'
      toast(err instanceof MutationQueuedError ? 'info' : 'error', msg)
    }
  }

  const deletarSalva = async (id: number) => {
    try {
      await listaComprasApi.deletarSalva(id)
      toast('success', 'Lista removida')
      await carregar()
    } catch (err) {
      const msg = err instanceof MutationQueuedError ? err.message : 'Erro ao remover lista'
      toast(err instanceof MutationQueuedError ? 'info' : 'error', msg)
    }
  }

  const pendentes = itens.filter(i => !i.comprado)
  const comprados = itens.filter(i => i.comprado)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <ShoppingCart className="w-7 h-7 text-massa-500" />
          <h1 className="text-2xl font-bold text-gray-800">Lista de Compras</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Salvar */}
          <button
            onClick={() => { setNomeSalvar(''); setShowSalvarModal(true) }}
            disabled={itens.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 bg-white border rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40"
          >
            <Save className="w-4 h-4" /> Salvar
          </button>

          {/* Carregar */}
          <div className="relative">
            <button
              onClick={() => setShowSalvas(!showSalvas)}
              disabled={salvas.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 bg-white border rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40"
            >
              <Download className="w-4 h-4" /> Carregar
            </button>
            {showSalvas && salvas.length > 0 && (
              <div className="absolute right-0 top-full mt-1 w-64 bg-white border rounded-xl shadow-lg z-20 py-1">
                {salvas.map(s => (
                  <div key={s.id} className="flex items-center justify-between px-3 py-2 hover:bg-gray-50">
                    <button
                      onClick={() => carregarSalva(s.id)}
                      className="flex-1 text-left text-sm"
                    >
                      <span className="font-medium">{s.nome}</span>
                      <span className="text-gray-400 ml-2">({s.total_itens} itens)</span>
                    </button>
                    <button onClick={() => deletarSalva(s.id)} className="p-1 text-gray-300 hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Limpar comprados */}
          {comprados.length > 0 && (
            <button onClick={limparComprados} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
              <Archive className="w-4 h-4" /> Limpar
            </button>
          )}
        </div>
      </div>

      {/* Sugestões */}
      {sugestoes.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 text-amber-700 text-sm font-medium mb-2">
            <Lightbulb className="w-4 h-4" /> Sugestões dos ingredientes
          </div>
          <div className="flex flex-wrap gap-2">
            {sugestoes.map(s => (
              <button
                key={s.nome}
                onClick={() => adicionar(s.nome, 1, s.valor_sugerido ? Math.ceil(s.valor_sugerido * 10) / 10 : null)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-amber-300 rounded-full text-sm text-amber-800 hover:bg-amber-100 transition-colors"
              >
                <Plus className="w-3 h-3" />
                {s.nome}
                {s.unidade_medida && <span className="text-amber-500">({s.unidade_medida})</span>}
                {s.valor_sugerido && <span className="text-amber-600 font-medium">R$ {s.valor_sugerido.toFixed(2)}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Resumo */}
      {resumo && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="card p-4">
            <p className="text-xs text-gray-500">Pendentes</p>
            <p className="text-xl font-bold text-gray-800">{resumo.itens_pendentes}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-gray-500">Comprados</p>
            <p className="text-xl font-bold text-green-600">{resumo.itens_comprados}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-gray-500">Total Estimado</p>
            <p className="text-xl font-bold text-amber-600">R$ {resumo.total_estimado.toFixed(2)}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-gray-500">Gasto (comprados)</p>
            <p className="text-xl font-bold text-red-600">R$ {resumo.total_comprado.toFixed(2)}</p>
          </div>
        </div>
      )}

      {/* Formulário de novo item */}
      <div className="card p-4 mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Item</label>
            <input
              type="text"
              value={novoNome}
              onChange={e => setNovoNome(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && adicionar()}
              placeholder="Ex: Farinha de Trigo"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-massa-500 focus:border-transparent"
              list="sugestoes-datalist"
            />
            <datalist id="sugestoes-datalist">
              {sugestoes.map(s => (
                <option key={s.nome} value={s.nome} />
              ))}
            </datalist>
          </div>
          <div className="w-20">
            <label className="block text-xs font-medium text-gray-500 mb-1">Qtd</label>
            <input
              type="number"
              value={novoQtd}
              onChange={e => setNovoQtd(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-massa-500 focus:border-transparent"
              min="0"
              step="0.5"
            />
          </div>
          <div className="w-28">
            <label className="block text-xs font-medium text-gray-500 mb-1">Valor (R$)</label>
            <input
              type="number"
              value={novoValor}
              onChange={e => setNovoValor(e.target.value)}
              placeholder="0,00"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-massa-500 focus:border-transparent"
              min="0"
              step="0.10"
            />
          </div>
          <button
            onClick={() => adicionar()}
            disabled={!novoNome.trim()}
            className="flex items-center gap-1.5 px-4 py-2 bg-massa-500 text-white rounded-lg hover:bg-massa-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" /> Adicionar
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <ClipboardList className="w-8 h-8 text-gray-300 animate-pulse" />
        </div>
      )}

      {/* Itens pendentes */}
      {!loading && (
        <>
          {pendentes.length > 0 && (
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Para comprar ({pendentes.length})
              </h2>
              <div className="space-y-2">
                {pendentes.map(item => (
                  <ItemRow key={item.id} item={item} onToggle={toggleComprado} onValorChange={atualizarValor} onRemover={remover} />
                ))}
              </div>
            </div>
          )}

          {comprados.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Comprados ({comprados.length})
              </h2>
              <div className="space-y-2 opacity-60">
                {comprados.map(item => (
                  <ItemRow key={item.id} item={item} onToggle={toggleComprado} onValorChange={atualizarValor} onRemover={remover} />
                ))}
              </div>
            </div>
          )}

          {itens.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">Lista vazia</p>
              <p className="text-sm">Adicione itens para não esquecer nada no mercado!</p>
              {sugestoes.length > 0 && (
                <p className="text-sm text-amber-500 mt-1">
                  Use as sugestões acima para começar rapidamente
                </p>
              )}
            </div>
          )}
        </>
      )}

      {/* Modal Salvar */}
      {showSalvarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowSalvarModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-80" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">Salvar lista</h3>
            <p className="text-sm text-gray-500 mb-4">Dê um nome para esta lista (ex: "Mercado semanal")</p>
            <input
              type="text"
              value={nomeSalvar}
              onChange={e => setNomeSalvar(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && salvarLista()}
              placeholder="Nome da lista"
              autoFocus
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-massa-500 focus:border-transparent mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowSalvarModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                Cancelar
              </button>
              <button
                onClick={salvarLista}
                disabled={!nomeSalvar.trim()}
                className="px-4 py-2 text-sm bg-massa-500 text-white rounded-lg hover:bg-massa-600 transition-colors disabled:opacity-50"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Item Row ─────────────────────────────────────────────────────

function ItemRow({
  item,
  onToggle,
  onValorChange,
  onRemover,
}: {
  item: ListaCompraItem
  onToggle: (item: ListaCompraItem) => void
  onValorChange: (item: ListaCompraItem, valor: string) => void
  onRemover: (id: number) => void
}) {
  const [editandoValor, setEditandoValor] = useState(false)
  const [valorInput, setValorInput] = useState(item.valor_estimado?.toFixed(2) ?? '')

  const salvarValor = () => {
    onValorChange(item, valorInput)
    setEditandoValor(false)
  }

  return (
    <div className={`card p-3 transition-all ${item.comprado ? 'border-green-200' : ''}`}>
      <button
        onClick={() => onToggle(item)}
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
          item.comprado
            ? 'bg-green-500 border-green-500 text-white'
            : 'border-gray-300 hover:border-massa-400'
        }`}
      >
        {item.comprado && <Check className="w-4 h-4" />}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`font-medium text-sm ${item.comprado ? 'line-through text-gray-400' : 'text-gray-800'}`}>
          {item.nome}
        </p>
        <p className="text-xs text-gray-400">
          {item.quantidade && `${item.quantidade}${item.unidade_medida ? ` ${item.unidade_medida}` : ' un'}`}
        </p>
      </div>

      <div className="flex items-center gap-1">
        <DollarSign className="w-3.5 h-3.5 text-gray-400" />
        {editandoValor ? (
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={valorInput}
              onChange={e => setValorInput(e.target.value)}
              className="w-20 px-2 py-1 border rounded text-sm text-right"
              step="0.10"
              min="0"
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') salvarValor(); if (e.key === 'Escape') setEditandoValor(false) }}
            />
            <button onClick={salvarValor} className="p-1 text-green-600 hover:bg-green-50 rounded">
              <Check className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setEditandoValor(false)} className="p-1 text-gray-400 hover:bg-gray-100 rounded">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setValorInput(item.valor_estimado?.toFixed(2) ?? ''); setEditandoValor(true) }}
            className={`text-sm font-medium hover:bg-gray-50 px-2 py-1 rounded ${item.valor_estimado ? 'text-gray-700' : 'text-gray-400'}`}
          >
            {item.valor_estimado ? `R$ ${item.valor_estimado.toFixed(2)}` : '—'}
          </button>
        )}
      </div>

      <button
        onClick={() => onRemover(item.id)}
        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        title="Remover"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}
