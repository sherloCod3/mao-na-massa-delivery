import { useEffect, useState } from 'react'
import {
  ShoppingBag, DollarSign, TrendingUp, Clock, TrendingDown, PiggyBank,
  BarChart3, Medal, CalendarDays, Download, AlertTriangle, Package,
} from 'lucide-react'
import { obterDashboardHojeOffline, listarIngredientesOffline } from '../services/offlineClient'
import { dashboardApi } from '../api/client'
import type { DashboardHoje, DashboardMensal, DashboardPeriodo, DashboardTopProdutos, Ingrediente } from '../api/client'
import MensalChart from '../components/MensalChart'
import TopProdutos from '../components/TopProdutos'
import { exportCSV } from '../utils/csv'

type Tab = 'hoje' | 'mensal' | 'produtos'

export default function Dashboard() {
  const [tab, setTab] = useState<Tab>('hoje')

  return (
    <div>
      <h1 className="text-2xl mb-6">Dashboard</h1>

      {/* Estoque baixo - aparece em todas as tabs */}
      <EstoqueBaixoAlert />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 border shadow-sm">
        {[
          { id: 'hoje' as Tab, label: 'Hoje', icon: Clock },
          { id: 'mensal' as Tab, label: 'Mensal', icon: BarChart3 },
          { id: 'produtos' as Tab, label: 'Produtos', icon: Medal },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id
                ? 'bg-massa-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'hoje' && <DashboardHojeView />}
      {tab === 'mensal' && <DashboardMensalView />}
      {tab === 'produtos' && <DashboardProdutosView />}
    </div>
  )
}

// ─── Alerta de Estoque Baixo ──────────────────────────────────

function EstoqueBaixoAlert() {
  const [itens, setItens] = useState<Ingrediente[]>([])

  useEffect(() => {
    listarIngredientesOffline().then(setItens)
  }, [])

  const baixo = itens.filter(i => i.ativo && i.estoque_baixo)

  if (baixo.length === 0) return null

  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <p className="font-medium text-red-800 text-sm">
            <strong>{baixo.length}</strong> ingrediente{baixo.length > 1 ? 's' : ''} com estoque baixo
          </p>
          <a href="/ingredientes" className="text-xs text-red-700 hover:text-red-900 underline">
            Gerenciar
          </a>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {baixo.slice(0, 5).map(i => (
            <span key={i.id} className="inline-flex items-center gap-1 bg-white rounded-lg px-2.5 py-1 text-xs text-red-700 border border-red-100 shadow-sm">
              <Package className="w-3 h-3" />
              {i.nome}: <strong>{i.quantidade_estoque}</strong>/{i.estoque_minimo} {i.unidade_medida}
            </span>
          ))}
          {baixo.length > 5 && (
            <span className="text-xs text-red-500 self-center">+{baixo.length - 5} mais</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Tab: Hoje ────────────────────────────────────────────────

function DashboardHojeView() {
  const [data, setData] = useState<DashboardHoje | null>(null)

  useEffect(() => {
    obterDashboardHojeOffline().then(setData).catch(console.error)
  }, [])

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <Clock className="w-8 h-8 text-massa-300 animate-spin" />
      </div>
    )
  }

  const cards = [
    { label: 'Pedidos Ativos', value: data.pedidos_ativos, icon: ShoppingBag, accent: 'text-massa-500', bg: 'bg-massa-50' },
    { label: 'Entregues Hoje', value: data.pedidos_entregues_hoje, icon: TrendingUp, accent: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Faturamento', value: `R$ ${data.faturamento_hoje.toFixed(2)}`, icon: DollarSign, accent: 'text-massa-600', bg: 'bg-massa-50' },
    { label: 'Custo Estimado', value: `R$ ${data.custo_total_estimado.toFixed(2)}`, icon: TrendingDown, accent: 'text-amber-600', bg: 'bg-amber-50' },
    {
      label: 'Lucro Estimado',
      value: `R$ ${data.lucro_estimado.toFixed(2)}`,
      icon: PiggyBank,
      accent: data.lucro_estimado >= 0 ? 'text-emerald-600' : 'text-red-600',
      bg: data.lucro_estimado >= 0 ? 'bg-emerald-50' : 'bg-red-50',
    },
    { label: 'Total Hoje', value: data.total_pedidos, icon: ShoppingBag, accent: 'text-massa-400', bg: 'bg-creme-100' },
  ]

  const margem = data.faturamento_hoje > 0
    ? ((data.lucro_estimado / data.faturamento_hoje) * 100).toFixed(1)
    : '—'

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {cards.map(c => (
          <div key={c.label} className="card card-hover p-4">
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 rounded-lg ${c.bg}`}>
                <c.icon className={`w-5 h-5 ${c.accent}`} />
              </div>
            </div>
            <p className="text-sm text-gray-500">{c.label}</p>
            <p className="text-xl font-bold mt-0.5" style={{ fontFamily: 'var(--font-serif)' }}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="card p-6">
        <h2 className="text-lg mb-4">Resumo Financeiro</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Faturamento</p>
            <p className="text-xl font-bold text-massa-600 mt-1">R$ {data.faturamento_hoje.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Custo</p>
            <p className="text-xl font-bold text-amber-600 mt-1">R$ {data.custo_total_estimado.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Lucro</p>
            <p className={`text-xl font-bold mt-1 ${data.lucro_estimado >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              R$ {data.lucro_estimado.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Margem</p>
            <p className="text-xl font-bold text-gray-800 mt-1">{margem !== '—' ? `${margem}%` : margem}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Tab: Mensal ──────────────────────────────────────────────

function DashboardMensalView() {
  const [data, setData] = useState<DashboardMensal | null>(null)
  const [erro, setErro] = useState('')
  const [periodo, setPeriodo] = useState<DashboardPeriodo | null>(null)
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  useEffect(() => {
    dashboardApi.mensal(12).then(setData).catch(() => setErro('Erro ao carregar dados mensais'))
  }, [])

  const buscarPeriodo = async () => {
    if (!dataInicio && !dataFim) return
    try {
      const res = await dashboardApi.periodo(dataInicio || undefined, dataFim || undefined)
      setPeriodo(res)
    } catch {
      setErro('Erro ao buscar relatório do período')
    }
  }

  const exportarMensal = () => {
    if (!data?.meses.length) return
    exportCSV(
      'relatorio-mensal',
      ['Mês', 'Pedidos', 'Faturamento', 'Custos', 'Lucro'],
      data.meses.map(m => [m.mes, String(m.total_pedidos), m.faturamento.toFixed(2), m.custos.toFixed(2), m.lucro.toFixed(2)]),
    )
  }

  return (
    <div className="space-y-6">
      {/* Gráfico Mensal */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg">Faturamento Mensal</h2>
          {data?.meses.length ? (
            <button onClick={exportarMensal} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-800 bg-gray-50 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <Download className="w-4 h-4" /> CSV
            </button>
          ) : null}
        </div>
        {erro && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 mb-4">{erro}</div>}
        {!data && !erro ? (
          <div className="flex items-center justify-center h-48"><Clock className="w-6 h-6 text-massa-300 animate-spin" /></div>
        ) : (
          <MensalChart data={data?.meses ?? []} />
        )}
      </div>

      {/* Consulta por Período */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays className="w-5 h-5 text-massa-500" />
          <h2 className="text-lg">Relatório por Período</h2>
        </div>
        <div className="flex flex-wrap items-end gap-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Data Início</label>
            <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Data Fim</label>
            <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm" />
          </div>
          <button onClick={buscarPeriodo}
            className="bg-massa-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-massa-700 transition-colors">
            Buscar
          </button>
        </div>

        {periodo && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Pedidos</p>
              <p className="text-xl font-bold text-gray-800 mt-1">{periodo.total_pedidos}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Faturamento</p>
              <p className="text-xl font-bold text-massa-600 mt-1">R$ {periodo.total_faturado.toFixed(2)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Custos</p>
              <p className="text-xl font-bold text-amber-600 mt-1">R$ {periodo.total_custos.toFixed(2)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Lucro</p>
              <p className={`text-xl font-bold mt-1 ${periodo.total_lucro >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                R$ {periodo.total_lucro.toFixed(2)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Tab: Produtos ────────────────────────────────────────────

function DashboardProdutosView() {
  const [data, setData] = useState<DashboardTopProdutos | null>(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    dashboardApi.topProdutos(15).then(setData).catch(() => setErro('Erro ao carregar top produtos'))
  }, [])

  const exportarProdutos = () => {
    if (!data?.produtos.length) return
    exportCSV(
      'produtos-mais-vendidos',
      ['Produto', 'Variação', 'Quantidade', 'Total Faturado'],
      data.produtos.map(p => [p.produto_nome, p.variacao_nome, String(p.quantidade), p.total_faturado.toFixed(2)]),
    )
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg">Produtos Mais Vendidos</h2>
        {data?.produtos.length ? (
          <button onClick={exportarProdutos} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-800 bg-gray-50 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <Download className="w-4 h-4" /> CSV
          </button>
        ) : null}
      </div>
      {erro && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 mb-4">{erro}</div>}
      {!data && !erro ? (
        <div className="flex items-center justify-center h-48"><Clock className="w-6 h-6 text-massa-300 animate-spin" /></div>
      ) : (
        <TopProdutos data={data?.produtos ?? []} />
      )}
    </div>
  )
}
