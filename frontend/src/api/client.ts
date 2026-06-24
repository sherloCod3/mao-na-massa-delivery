import { enfileirarMutacao, MutationQueuedError } from '../services/mutationQueue'

// ─── Notificações ────────────────────────────────────────────────

export interface Notificacao {
  id: number
  tipo: string
  titulo: string
  mensagem: string
  referencia_tipo: string | null
  referencia_id: number | null
  lida: boolean
  created_at: string
}

export interface NotificacaoResponse {
  total: number
  notificacoes: Notificacao[]
}

const API_BASE = import.meta.env.VITE_API_URL ?? '/api/v1'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${url}`, {
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      ...options,
    })
    if (!res.ok) {
      const text = await res.text().catch(() => 'Erro desconhecido')
      throw new Error(`HTTP ${res.status}: ${text}`)
    }
    if (res.status === 204) return undefined as T
    return res.json()
  } catch (err) {
    // When offline and this is a write operation (POST/PUT/DELETE), queue it
    const method = options?.method || 'GET'
    if (!navigator.onLine && method !== 'GET') {
      const body = options?.body ? JSON.parse(options.body as string) : undefined
      await enfileirarMutacao({
        method,
        endpoint: url,
        body,
        entityType: url.split('/')[1] || 'unknown',
      })
      throw new MutationQueuedError()
    }
    throw err
  }
}

// ─── Tipos compartilhados ───────────────────────────────────────

export interface Ingrediente {
  id: number
  nome: string
  unidade_medida: string
  preco_atual: number
  embalagem: number
  quantidade_estoque: number
  estoque_minimo: number
  estoque_baixo: boolean
  ativo: boolean
  created_at: string
}

export interface Produto {
  id: number
  nome: string
  descricao: string | null
  imagem_url: string | null
  ativo: boolean
  variacoes?: Variacao[]
}

export interface Variacao {
  id: number
  produto_id: number
  nome: string
  preco_venda: number | null
  preco_minimo: number | null
  margem_percentual: number
  ativo: boolean
  custo_unitario: number
  preco_sugerido: number
}

export interface ReceitaItem {
  id: number
  ingrediente_id: number
  ingrediente: Ingrediente
  quantidade: number
}

export interface MovimentacaoEstoque {
  id: number
  ingrediente_id: number
  tipo: string
  quantidade: number
  saldo_anterior: number
  saldo_posterior: number
  motivo: string | null
  created_at: string
}

export interface PedidoItem {
  id: number
  variacao_id: number
  quantidade: number
  preco_unitario: number
  customizacoes: string | null
  subtotal: number
  variacao_nome: string | null
  produto_nome: string | null
}

export interface Pedido {
  id: number
  cliente_nome: string
  cliente_whatsapp: string | null
  token_acesso: string
  status: string
  forma_pagamento: string | null
  observacoes: string | null
  total: number
  data_entrega: string | null
  created_at: string
  updated_at: string
  itens: PedidoItem[]
}

export interface DashboardHoje {
  pedidos_ativos: number
  pedidos_entregues_hoje: number
  faturamento_hoje: number
  custo_total_estimado: number
  lucro_estimado: number
  total_pedidos: number
  pedidos_por_status: Record<string, number>
}

export interface DashboardPeriodo {
  total_pedidos: number
  total_faturado: number
  total_custos: number
  total_lucro: number
  ticket_medio: number
}

export interface MesItem {
  mes: string
  faturamento: number
  custos: number
  lucro: number
  total_pedidos: number
}

export interface DashboardMensal {
  meses: MesItem[]
}

export interface ProdutoMaisVendido {
  produto_nome: string
  variacao_nome: string
  quantidade: number
  total_faturado: number
}

export interface DashboardTopProdutos {
  produtos: ProdutoMaisVendido[]
}

// ─── Lista de Compras ─────────────────────────────────────────────

export interface ListaCompraItem {
  id: number
  nome: string
  quantidade: number | null
  unidade_medida: string | null
  valor_estimado: number | null
  comprado: boolean
  created_at: string
  updated_at: string
}

export interface ListaCompraResumo {
  total_estimado: number
  total_comprado: number
  itens_pendentes: number
  itens_comprados: number
}

export interface ListaSalvaResumo {
  id: number
  nome: string
  total_itens: number
  created_at: string
}

export interface CustoVariacao {
  variacao_id: number
  variacao_nome: string
  custo_unitario: number
  margem_percentual: number
  preco_sugerido: number
  preco_minimo_atual: number | null
}

// ─── API methods ─────────────────────────────────────────────────

export const ingredientesApi = {
  listar: () => request<Ingrediente[]>('/ingredientes'),
  criar: (data: Partial<Ingrediente>) => request<Ingrediente>('/ingredientes', { method: 'POST', body: JSON.stringify(data) }),
  atualizar: (id: number, data: Partial<Ingrediente>) => request<Ingrediente>(`/ingredientes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  desativar: (id: number) => request<void>(`/ingredientes/${id}`, { method: 'DELETE' }),
  movimentar: (id: number, data: { tipo: 'entrada' | 'saida'; quantidade: number; motivo?: string }) =>
    request<MovimentacaoEstoque>(`/ingredientes/${id}/movimentar`, { method: 'POST', body: JSON.stringify(data) }),
}

export const produtosApi = {
  listar: () => request<Produto[]>('/produtos'),
  criar: (data: Partial<Produto>) => request<Produto>('/produtos', { method: 'POST', body: JSON.stringify(data) }),
  obter: (id: number) => request<Produto>(`/produtos/${id}`),
}

export const variacoesApi = {
  listar: (produtoId: number) => request<Variacao[]>(`/produtos/${produtoId}/variacoes`),
  criar: (produtoId: number, data: Partial<Variacao>) => request<Variacao>(`/produtos/${produtoId}/variacoes`, { method: 'POST', body: JSON.stringify(data) }),
  atualizar: (id: number, data: Partial<Variacao>) => request<Variacao>(`/variacoes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  receita: (variacaoId: number) => request<ReceitaItem[]>(`/variacoes/${variacaoId}/receita`),
  adicionarIngrediente: (variacaoId: number, data: { ingrediente_id: number; quantidade: number }) =>
    request<ReceitaItem>(`/variacoes/${variacaoId}/receita`, { method: 'POST', body: JSON.stringify(data) }),
  removerIngrediente: (receitaItemId: number) => request<void>(`/receita/${receitaItemId}`, { method: 'DELETE' }),
  custo: (variacaoId: number) => request<CustoVariacao>(`/variacoes/${variacaoId}/custo`),
}

export interface PedidoPayload {
  cliente_nome: string
  cliente_whatsapp?: string | null
  forma_pagamento?: string
  observacoes?: string | null
  itens: {
    variacao_id: number
    quantidade: number
    preco_unitario: number
    customizacoes?: { nome: string; preco: number }[]
  }[]
}

export const pedidosApi = {
  listar: () => request<Pedido[]>('/pedidos'),
  criar: (data: PedidoPayload) => request<Pedido>('/pedidos', { method: 'POST', body: JSON.stringify(data) }),
  obter: (id: number) => request<Pedido>(`/pedidos/${id}`),
  atualizarStatus: (id: number, status: string) =>
    request<Pedido>(`/pedidos/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
}

export const trackingApi = {
  tracking: (token: string) => request<Pedido>(`/publico/pedidos/${token}`),
}

export const dashboardApi = {
  hoje: () => request<DashboardHoje>('/dashboard/hoje'),
  periodo: (dataInicio?: string, dataFim?: string) => {
    const params = new URLSearchParams()
    if (dataInicio) params.set('data_inicio', dataInicio)
    if (dataFim) params.set('data_fim', dataFim)
    const qs = params.toString()
    return request<DashboardPeriodo>(`/dashboard/periodo${qs ? `?${qs}` : ''}`)
  },
  mensal: (meses = 6) => request<DashboardMensal>(`/dashboard/mensal?meses=${meses}`),
  topProdutos: (limite = 10) => request<DashboardTopProdutos>(`/dashboard/top-produtos?limite=${limite}`),
}

export const notificacoesApi = {
  listar: (apenasNaoLidas = true) =>
    request<NotificacaoResponse>(`/notificacoes?apenas_nao_lidas=${apenasNaoLidas}`),
  marcarLida: (id: number) =>
    request<{ ok: boolean }>(`/notificacoes/${id}/ler`, { method: 'POST' }),
  marcarTodasLidas: () =>
    request<{ ok: boolean }>('/notificacoes/ler-todas', { method: 'POST' }),
}

export const listaComprasApi = {
  listar: () => request<ListaCompraItem[]>('/lista-compras'),
  resumo: () => request<ListaCompraResumo>('/lista-compras/resumo'),
  criar: (data: { nome: string; quantidade?: number | null; unidade_medida?: string | null; valor_estimado?: number | null }) =>
    request<ListaCompraItem>('/lista-compras', { method: 'POST', body: JSON.stringify(data) }),
  atualizar: (id: number, data: Partial<ListaCompraItem>) =>
    request<ListaCompraItem>(`/lista-compras/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remover: (id: number) => request<void>(`/lista-compras/${id}`, { method: 'DELETE' }),
  limparComprados: () => request<void>('/lista-compras/limpar-comprados', { method: 'POST' }),
  sugestoes: () => request<{ nome: string; unidade_medida: string | null; valor_sugerido: number | null }[]>('/lista-compras/sugestoes'),
  salvar: (nome: string) => request<ListaSalvaResumo>('/lista-compras/salvar', { method: 'POST', body: JSON.stringify({ nome }) }),
  listarSalvas: () => request<ListaSalvaResumo[]>('/lista-compras/salvas'),
  carregar: (id: number) => request<ListaCompraItem[]>('/lista-compras/carregar/' + id, { method: 'POST' }),
  deletarSalva: (id: number) => request<void>('/lista-compras/salvas/' + id, { method: 'DELETE' }),
}
