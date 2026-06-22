const API_BASE = import.meta.env.VITE_API_URL ?? '/api/v1'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
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
}

// ─── Tipos compartilhados ───────────────────────────────────────

export interface Ingrediente {
  id: number
  nome: string
  unidade_medida: string
  preco_atual: number
  embalagem: number
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

export interface PedidoItem {
  id: number
  variacao_id: number
  quantidade: number
  preco_unitario: number
  customizacoes: string | null
  subtotal: number
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

export const pedidosApi = {
  listar: () => request<Pedido[]>('/pedidos'),
  criar: (data: any) => request<Pedido>('/pedidos', { method: 'POST', body: JSON.stringify(data) }),
  obter: (id: number) => request<Pedido>(`/pedidos/${id}`),
  atualizarStatus: (id: number, status: string) =>
    request<Pedido>(`/pedidos/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
}

export const trackingApi = {
  tracking: (token: string) => request<Pedido>(`/publico/pedidos/${token}`),
}

export const dashboardApi = {
  hoje: () => request<DashboardHoje>('/dashboard/hoje'),
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
