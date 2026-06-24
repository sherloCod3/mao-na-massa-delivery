import {
  type Ingrediente,
  ingredientesApi,
  produtosApi,
  variacoesApi,
  pedidosApi,
  dashboardApi,
  listaComprasApi,
  trackingApi,
} from '../api/client'
import { db, getCachedOrFetch, invalidateCache } from './db'

// ─── Ingredientes ────────────────────────────────────────────

export async function listarIngredientesOffline() {
  return getCachedOrFetch(db.ingredientes, 'all', () => ingredientesApi.listar())
}

export async function criarIngredienteOffline(data: Partial<Ingrediente>) {
  const result = await ingredientesApi.criar(data)
  await invalidateCache(db.ingredientes)
  return result
}

export async function atualizarIngredienteOffline(id: number, data: Partial<Ingrediente>) {
  const result = await ingredientesApi.atualizar(id, data)
  await invalidateCache(db.ingredientes)
  return result
}

export async function desativarIngredienteOffline(id: number) {
  await ingredientesApi.desativar(id)
  await invalidateCache(db.ingredientes)
}

export async function movimentarEstoqueOffline(id: number, data: { tipo: 'entrada' | 'saida'; quantidade: number; motivo?: string }) {
  const result = await ingredientesApi.movimentar(id, data)
  await invalidateCache(db.ingredientes)
  return result
}

export async function listarMovimentacoesOffline(id: number, limite = 50) {
  return ingredientesApi.movimentacoes(id, limite)
}

// ─── Produtos ────────────────────────────────────────────────

export async function listarProdutosOffline() {
  return getCachedOrFetch(db.produtos, 'all', () => produtosApi.listar())
}

// ─── Variacoes ───────────────────────────────────────────────

export async function listarVariacoesOffline(produtoId: number) {
  const key = `produto_${produtoId}`
  return getCachedOrFetch(db.variacoes, key, () => variacoesApi.listar(produtoId))
}

export async function obterReceitaOffline(variacaoId: number) {
  const key = `variacao_${variacaoId}`
  return getCachedOrFetch(db.receitaItems, key, () => variacoesApi.receita(variacaoId))
}

export async function obterCustoOffline(variacaoId: number) {
  const key = `variacao_${variacaoId}`
  return getCachedOrFetch(db.custoVariacao, key, () => variacoesApi.custo(variacaoId))
}

// ─── Pedidos ─────────────────────────────────────────────────

export async function listarPedidosOffline() {
  return getCachedOrFetch(db.pedidos, 'all', () => pedidosApi.listar())
}

export async function obterPedidoDetalheOffline(id: number) {
  return getCachedOrFetch(db.pedidoDetalhe, `pedido_${id}`, () => pedidosApi.obter(id))
}

// ─── Tracking Público ──────────────────────────────────────────

export async function obterTrackingOffline(token: string) {
  return getCachedOrFetch(db.pedidoDetalhe, `track_${token}`, () => trackingApi.tracking(token))
}

// ─── Dashboard ────────────────────────────────────────────────

export async function obterDashboardHojeOffline() {
  return getCachedOrFetch(db.dashboardHoje, 'hoje', () => dashboardApi.hoje())
}

// ─── Lista de Compras ─────────────────────────────────────────

export async function listarComprasOffline() {
  return getCachedOrFetch(db.listaCompras, 'all', () => listaComprasApi.listar())
}

export async function obterResumoComprasOffline() {
  return getCachedOrFetch(db.listaComprasResumo, 'resumo', () => listaComprasApi.resumo())
}
