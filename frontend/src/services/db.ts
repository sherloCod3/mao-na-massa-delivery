import Dexie, { type Table } from 'dexie'
import type {
  DashboardHoje, Ingrediente, ListaCompraItem, ListaCompraResumo,
  Pedido, Produto, ReceitaItem, Variacao, CustoVariacao,
} from '../api/client'

export interface CachedResponse<T> {
  key: string
  data: T
  updatedAt: number
}

export interface QueuedMutation {
  id?: number
  method: string        // POST | PUT | DELETE
  endpoint: string      // e.g. '/ingredientes' or '/ingredientes/5'
  body?: unknown
  entityType: string    // for cache invalidation after sync
  createdAt: number
  retryCount: number
  lastError?: string
}

class MaoNaMassaDB extends Dexie {
  ingredientes!: Table<CachedResponse<Ingrediente[]>>
  produtos!: Table<CachedResponse<Produto[]>>
  pedidos!: Table<CachedResponse<Pedido[]>>
  pedidoDetalhe!: Table<CachedResponse<Pedido>>
  dashboardHoje!: Table<CachedResponse<DashboardHoje>>
  listaCompras!: Table<CachedResponse<ListaCompraItem[]>>
  listaComprasResumo!: Table<CachedResponse<ListaCompraResumo>>
  variacoes!: Table<CachedResponse<Variacao[]>>
  receitaItems!: Table<CachedResponse<ReceitaItem[]>>
  custoVariacao!: Table<CachedResponse<CustoVariacao>>
  filaMutacoes!: Table<QueuedMutation>

  constructor() {
    super('MaoNaMassaDB')
    this.version(1).stores({
      ingredientes: 'key',
      produtos: 'key',
      pedidos: 'key',
      pedidoDetalhe: 'key',
      dashboardHoje: 'key',
      listaCompras: 'key',
      listaComprasResumo: 'key',
      variacoes: 'key',
      receitaItems: 'key',
      custoVariacao: 'key',
    })
    this.version(2).stores({
      filaMutacoes: '++id, createdAt, entityType',
    }).upgrade(tx => {
      // v2: adiciona tabela filaMutacoes — dados das tabelas v1
      // são preservados automaticamente pelo Dexie
      console.log('[DB] Upgrading to v2: added filaMutacoes table')
    })
  }
}

export const db = new MaoNaMassaDB()

export async function getCachedOrFetch<T>(
  table: Table<CachedResponse<T>>,
  key: string,
  fetcher: () => Promise<T>,
): Promise<T> {
  try {
    const data = await fetcher()
    await table.put({ key, data, updatedAt: Date.now() })
    return data
  } catch (err) {
    const cached = await table.get(key)
    if (cached) {
      return cached.data
    }
    throw err
  }
}

// Aceita qualquer tabela Dexie para limpeza de cache — seguro pois
// só chamamos .clear() que existe em todas as tabelas
type CacheTable = Table<{ key: string; data: unknown; updatedAt: number }, string, number>

export async function invalidateCache(...tables: CacheTable[]): Promise<void> {
  await Promise.all(tables.map(t => t.clear()))
}

export async function invalidateAllCache(): Promise<void> {
  await Promise.all(db.tables.filter(t => t.name !== 'filaMutacoes').map(t => t.clear()))
}
