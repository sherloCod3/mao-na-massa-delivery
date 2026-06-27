import { describe, it, expect, vi, beforeEach } from 'vitest'

// Create mock table with all needed methods
function createMockTable() {
  return {
    get: vi.fn(),
    put: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
    count: vi.fn().mockResolvedValue(0),
    orderBy: vi.fn(() => ({ toArray: vi.fn().mockResolvedValue([]) })),
    add: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
    where: vi.fn(() => ({ toArray: vi.fn().mockResolvedValue([]) })),
  }
}

const mockDb = {
  tabelas: {
    ingredientes: createMockTable(),
    produtos: createMockTable(),
    filaMutacoes: createMockTable(),
  },
  tables: [
    { name: 'ingredientes' },
    { name: 'produtos' },
    { name: 'filaMutacoes' },
  ],
}

vi.mock('../../services/db', () => ({
  db: mockDb,
  getCachedOrFetch: vi.fn(),
  invalidateCache: vi.fn(),
  invalidateAllCache: vi.fn(),
}))

const { db, getCachedOrFetch, invalidateCache, invalidateAllCache } = await import('../../services/db')

describe('services/db', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getCachedOrFetch', () => {
    it('returns fetched data and caches it on success', async () => {
      const fetcher = vi.fn().mockResolvedValue([{ id: 1, nome: 'Farinha' }])
      vi.mocked(getCachedOrFetch).mockImplementation(async (_table, _key, fetcherFn) => {
        const data = await fetcherFn()
        return data
      })

      const result = await getCachedOrFetch(db.tabelas.ingredientes, 'all', fetcher)

      expect(result).toEqual([{ id: 1, nome: 'Farinha' }])
    })

    it('returns cached data when fetcher fails', async () => {
      const fetcher = vi.fn().mockRejectedValue(new Error('Network error'))
      vi.mocked(getCachedOrFetch).mockImplementation(async (table, key) => {
        const cached = await table.get(key)
        if (cached) return cached.data
        throw new Error('Network error')
      })
      vi.mocked(db.tabelas.ingredientes.get).mockResolvedValue({
        key: 'all',
        data: [{ id: 1, nome: 'Farinha' }],
        updatedAt: Date.now(),
      })

      const result = await getCachedOrFetch(db.tabelas.ingredientes, 'all', fetcher)

      expect(result).toEqual([{ id: 1, nome: 'Farinha' }])
    })

    it('throws when fetcher fails and no cache', async () => {
      const fetcher = vi.fn().mockRejectedValue(new Error('Network error'))
      vi.mocked(getCachedOrFetch).mockImplementation(async (_table, _key, fetcherFn) => {
        const data = await fetcherFn().catch(() => { throw new Error('Network error') })
        return data
      })

      await expect(getCachedOrFetch(db.tabelas.ingredientes, 'all', fetcher)).rejects.toThrow('Network error')
    })
  })

  describe('invalidateCache', () => {
    it('clears specified tables', async () => {
      vi.mocked(invalidateCache).mockImplementation(async (...tables) => {
        await Promise.all(tables.map(t => (t as any).clear()))
      })

      await invalidateCache(db.tabelas.ingredientes, db.tabelas.produtos)

      expect(db.tabelas.ingredientes.clear).toHaveBeenCalledOnce()
      expect(db.tabelas.produtos.clear).toHaveBeenCalledOnce()
    })
  })

  describe('invalidateAllCache', () => {
    it('clears all tables except filaMutacoes', async () => {
      vi.mocked(invalidateAllCache).mockImplementation(async () => {
        await Promise.all(
          db.tables.filter(t => t.name !== 'filaMutacoes').map(t => {
            const tableKey = t.name as keyof typeof db.tabelas
            return db.tabelas[tableKey]?.clear() ?? Promise.resolve()
          })
        )
      })

      await invalidateAllCache()

      expect(db.tabelas.ingredientes.clear).toHaveBeenCalled()
      expect(db.tabelas.produtos.clear).toHaveBeenCalled()
      expect(db.tabelas.filaMutacoes.clear).not.toHaveBeenCalled()
    })
  })
})
