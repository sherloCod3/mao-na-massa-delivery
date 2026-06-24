import Dexie, { type Table } from 'dexie'
import type { DashboardHoje, Ingrediente, ListaCompraItem, ListaCompraResumo, Pedido, Produto, ReceitaItem, Variacao, CustoVariacao } from '../api/client'

export interface CachedResponse<T> {
  key: string
  data: T
  updatedAt: number
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
  }
}

export const db = new MaoNaMassaDB()

export async function getCachedOrFetch<T>(
  table: Table<CachedResponse<T>>,
  key: string,
  fetcher: () => Promise<T>,
): Promise<T> {
  // Try network first, fall back to IndexedDB cache when offline
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTable = Table<any, any, any>

export async function invalidateCache(...tables: AnyTable[]): Promise<void> {
  await Promise.all(tables.map(t => t.clear()))
}

export async function invalidateAllCache(): Promise<void> {
  await Promise.all(db.tables.map(t => t.clear()))
}
