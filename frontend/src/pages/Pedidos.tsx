import { useEffect, useState, useMemo } from 'react'
import { Plus, Search, MessageCircle, ShoppingBag, ArrowUpDown, Filter, Clock, CalendarDays } from 'lucide-react'
import { listarPedidosOffline } from '../services/offlineClient'
import type { Pedido } from '../api/client'
import { useNavigate } from 'react-router-dom'

import { gerarLinkWhatsApp, mensagemNovoPedido } from '../utils/whatsapp'
import { getStatusLabel, getStatusColorSimple } from '../utils/pedido'
import PageHeader from '../components/PageHeader'

type SortField = 'data' | 'total' | 'status'
type SortDir = 'asc' | 'desc'
type StatusFilter = string | 'todos'

export default function Pedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos')
  const [sortField, setSortField] = useState<SortField>('data')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    listarPedidosOffline()
      .then(setPedidos)
      .catch(() => setError('Erro ao carregar pedidos'))
      .finally(() => setLoading(false))
  }, [])

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const filtered = useMemo(() => {
    let result = [...pedidos]
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(p =>
        p.cliente_nome.toLowerCase().includes(q) ||
        p.id.toString().includes(q) ||
        (p.cliente_whatsapp || '').includes(q)
      )
    }
    if (statusFilter !== 'todos') {
      result = result.filter(p => p.status === statusFilter)
    }
    if (dataInicio) {
      const inicio = new Date(dataInicio)
      result = result.filter(p => new Date(p.created_at) >= inicio)
    }
    if (dataFim) {
      const fim = new Date(dataFim)
      fim.setHours(23, 59, 59, 999)
      result = result.filter(p => new Date(p.created_at) <= fim)
    }
    result.sort((a, b) => {
      let cmp = 0
      if (sortField === 'data') cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      else if (sortField === 'total') cmp = a.total - b.total
      else if (sortField === 'status') cmp = a.status.localeCompare(b.status)
      return sortDir === 'asc' ? cmp : -cmp
    })
    return result
  }, [pedidos, search, statusFilter, sortField, sortDir])

  function renderSortIcon(field: SortField) {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 inline ml-1 opacity-30" />
    return <ArrowUpDown className={`w-3 h-3 inline ml-1 ${sortDir === 'asc' ? 'rotate-180' : ''}`} />
  }

  return (
    <div>
      <PageHeader
        title="Pedidos"
        icon={<ShoppingBag className="w-6 h-6" />}
        action={
          <button onClick={() => navigate('/admin/pedidos/novo')}
            className="flex items-center gap-2 bg-massa-600 text-white px-4 py-2 rounded-lg hover:bg-massa-700 transition-colors min-w-[44px] min-h-[44px] justify-center">
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Novo Pedido</span>
          </button>
        }
      />

      {/* Filtros e busca */}
      <div className="bg-white card p-4 mb-4 space-y-3">
        {/* Date range filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <CalendarDays className="w-4 h-4 text-gray-400" />
          <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-xs w-36" title="Data início" />
          <span className="text-xs text-gray-400">até</span>
          <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-xs w-36" title="Data fim" />
          {(dataInicio || dataFim) && (
            <button onClick={() => { setDataInicio(''); setDataFim('') }}
              className="text-xs text-massa-600 hover:underline">Limpar</button>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por cliente, ID ou WhatsApp..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-massa-500/20 focus:border-massa-500 transition-colors" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400" />
          <div className="flex gap-1 flex-wrap">
            {[
              { value: 'todos', label: 'Todos' },
              { value: 'recebido', label: 'Recebidos' },
              { value: 'producao', label: 'Em Produção' },
              { value: 'entrega', label: 'Em Entrega' },
              { value: 'entregue', label: 'Entregues' },
              { value: 'cancelado', label: 'Cancelados' },
            ].map(s => (
              <button key={s.value} onClick={() => setStatusFilter(s.value as StatusFilter)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  statusFilter === s.value ? 'bg-massa-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>{s.label}</button>
            ))}
          </div>
          <div className="ml-auto hidden sm:flex items-center gap-1">
            <span className="text-xs text-gray-400 mr-1">Ordenar:</span>
            <button onClick={() => toggleSort('data')}
              className={`text-xs px-2 py-1 rounded transition-colors ${sortField === 'data' ? 'bg-massa-100 text-massa-700 font-medium' : 'text-gray-500 hover:bg-gray-100'}`}>
              Data {renderSortIcon('data')}</button>
            <button onClick={() => toggleSort('total')}
              className={`text-xs px-2 py-1 rounded transition-colors ${sortField === 'total' ? 'bg-massa-100 text-massa-700 font-medium' : 'text-gray-500 hover:bg-gray-100'}`}>
              Total {renderSortIcon('total')}</button>
            <button onClick={() => toggleSort('status')}
              className={`text-xs px-2 py-1 rounded transition-colors ${sortField === 'status' ? 'bg-massa-100 text-massa-700 font-medium' : 'text-gray-500 hover:bg-gray-100'}`}>
              Status {renderSortIcon('status')}</button>
          </div>
        </div>
      </div>

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

      {/* Desktop: tabela */}
      {!loading && !error && (
        <div className="hidden sm:block bg-white card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">#</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Cliente</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Pagamento</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Total</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Data</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono text-gray-500">#{p.id}</td>
                  <td className="px-4 py-3 text-sm font-medium text-primary">{p.cliente_nome}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColorSimple(p.status)}`}>
                      {getStatusLabel(p.status)}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{p.forma_pagamento || '-'}</td>
                  <td className="px-4 py-3 text-sm font-medium text-right tabular">R$ {p.total.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 text-right">
                    {new Date(p.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {p.cliente_whatsapp && (
                        <button onClick={() => {
                          const msg = mensagemNovoPedido(p.cliente_nome, p.id, p.total)
                          const link = gerarLinkWhatsApp(p.cliente_whatsapp!, msg)
                          if (link) window.open(link, '_blank')
                        }}
                          className="text-green-600 hover:text-green-800 p-2 rounded hover:bg-green-50 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                          title="Enviar WhatsApp">
                          <MessageCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => navigate(`/admin/pedidos/${p.id}`)}
                        className="text-blue-600 hover:text-blue-800 text-sm p-2 rounded hover:bg-blue-50 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
                        <Search className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">Nenhum pedido encontrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile: card list */}
      {!loading && !error && (
        <div className="sm:hidden space-y-3">
          {filtered.map(p => (
            <div key={p.id} onClick={() => navigate(`/admin/pedidos/${p.id}`)}
              className="bg-white card p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-mono text-gray-500">#{p.id}</span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColorSimple(p.status)}`}>
                  {getStatusLabel(p.status)}</span>
              </div>
              <p className="font-medium text-primary">{p.cliente_nome}</p>
              <div className="flex items-center justify-between mt-2 text-sm">
                <span className="text-gray-500">{p.forma_pagamento || '-'}</span>
                <span className="font-bold text-massa-600 tabular">R$ {p.total.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                <span className="text-xs text-gray-400">
                  {new Date(p.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </span>
                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                  {p.cliente_whatsapp && (
                    <button onClick={() => {
                      const msg = mensagemNovoPedido(p.cliente_nome, p.id, p.total)
                      const link = gerarLinkWhatsApp(p.cliente_whatsapp!, msg)
                      if (link) window.open(link, '_blank')
                    }}
                      className="text-green-600 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                      title="Enviar WhatsApp">
                      <MessageCircle className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400"><p>Nenhum pedido encontrado</p></div>
          )}
        </div>
      )}

      {/* Contagem */}
      {!loading && !error && pedidos.length > 0 && (
        <div className="text-xs text-gray-400 text-center mt-4">
          Exibindo {filtered.length} de {pedidos.length} pedido{pedidos.length !== 1 ? 's' : ''}
          {search && ` (filtro: \"${search}\")`}
        </div>
      )}
    </div>
  )
}
