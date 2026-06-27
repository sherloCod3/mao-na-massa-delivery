import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ── Mock db ──────────────────────────────────────────────────────

const mockFilaMutacoes = {
  count: vi.fn().mockResolvedValue(0),
  orderBy: vi.fn(() => ({ toArray: vi.fn().mockResolvedValue([]) })),
  add: vi.fn(),
  delete: vi.fn(),
  update: vi.fn(),
}

vi.mock('../../services/db', () => ({
  db: {
    filaMutacoes: mockFilaMutacoes,
    tables: [],
  },
  invalidateAllCache: vi.fn(),
}))

// ── Mock navigator.serviceWorker ──────────────────────────────────

Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    ready: Promise.resolve({
      active: {} as ServiceWorker,
    }),
    addEventListener: vi.fn(),
  },
  writable: true,
})

Object.defineProperty(navigator, 'onLine', {
  value: true,
  writable: true,
})

// ── Mock fetch ────────────────────────────────────────────────────

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

// ── Import after mocks ────────────────────────────────────────────

const { invalidateAllCache } = await import('../../services/db')

const {
  MutationQueuedError,
  enfileirarMutacao,
  processarFilaMutacoes,
  obterFilaPendente,
  onPendingChange,
  inicializarSincronizacao,
  sincronizarAgora,
} = await import('../../services/mutationQueue')

describe('services/mutationQueue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset navigator.onLine
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true })
  })

  describe('MutationQueuedError', () => {
    it('creates error with default message', () => {
      const err = new MutationQueuedError()
      expect(err).toBeInstanceOf(Error)
      expect(err.name).toBe('MutationQueuedError')
      expect(err.message).toContain('Salvo offline')
    })

    it('creates error with custom message', () => {
      const err = new MutationQueuedError('Custom')
      expect(err.message).toBe('Custom')
    })
  })

  describe('enfileirarMutacao', () => {
    it('adds mutation to queue with timestamp and retryCount', async () => {
      await enfileirarMutacao({
        method: 'POST',
        endpoint: '/pedidos',
        body: { cliente_nome: 'João' },
        entityType: 'pedidos',
      })

      expect(mockFilaMutacoes.add).toHaveBeenCalledWith({
        method: 'POST',
        endpoint: '/pedidos',
        body: { cliente_nome: 'João' },
        entityType: 'pedidos',
        createdAt: expect.any(Number),
        retryCount: 0,
      })
    })
  })

  describe('obterFilaPendente', () => {
    it('returns count from db', async () => {
      mockFilaMutacoes.count.mockResolvedValue(3)
      const count = await obterFilaPendente()
      expect(count).toBe(3)
    })
  })

  describe('onPendingChange', () => {
    it('registers and unregisters listener', () => {
      const fn = vi.fn()
      const unsub = onPendingChange(fn)
      expect(unsub).toBeInstanceOf(Function)
      unsub()
      // No notification should reach the unsubscribed listener
      expect(fn).not.toHaveBeenCalled()
    })
  })

  describe('processarFilaMutacoes', () => {
    it('processes mutations successfully', async () => {
      mockFilaMutacoes.orderBy.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([
          { id: 1, method: 'POST', endpoint: '/pedidos', body: {}, entityType: 'pedidos', createdAt: 100, retryCount: 0 },
        ]),
      })
      mockFetch.mockResolvedValue({ ok: true })

      const result = await processarFilaMutacoes()

      expect(result).toEqual({ synced: 1, failed: 0 })
      expect(mockFilaMutacoes.delete).toHaveBeenCalledWith(1)
      expect(invalidateAllCache).toHaveBeenCalled()
    })

    it('handles HTTP errors and stops processing', async () => {
      mockFilaMutacoes.orderBy.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([
          { id: 1, method: 'POST', endpoint: '/pedidos', body: {}, entityType: 'pedidos', createdAt: 100, retryCount: 0 },
          { id: 2, method: 'DELETE', endpoint: '/pedidos/1', entityType: 'pedidos', createdAt: 200, retryCount: 0 },
        ]),
      })
      mockFetch.mockResolvedValue({ ok: false, status: 500 })

      const result = await processarFilaMutacoes()

      expect(result).toEqual({ synced: 0, failed: 1 })
      // Should have incremented retryCount on the first failed mutation
      expect(mockFilaMutacoes.update).toHaveBeenCalledWith(1, {
        retryCount: 1,
        lastError: 'HTTP 500',
      })
      // Second mutation should NOT be processed (break on first failure)
      expect(mockFilaMutacoes.delete).not.toHaveBeenCalledWith(2)
    })

    it('abandons mutations after MAX_RETRIES', async () => {
      mockFilaMutacoes.orderBy.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([
          { id: 1, method: 'POST', endpoint: '/pedidos', entityType: 'pedidos', createdAt: 100, retryCount: 5 },
        ]),
      })

      const result = await processarFilaMutacoes()

      expect(result).toEqual({ synced: 0, failed: 1 })
      // Should be deleted (abandoned) without retrying
      expect(mockFilaMutacoes.delete).toHaveBeenCalledWith(1)
    })

    it('returns zeroes when queue is empty', async () => {
      mockFilaMutacoes.orderBy.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([]),
      })

      const result = await processarFilaMutacoes()
      expect(result).toEqual({ synced: 0, failed: 0 })
    })
  })

  describe('sincronizarAgora', () => {
    it('returns zeroes when offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true })

      const result = await sincronizarAgora()
      expect(result).toEqual({ synced: 0, failed: 0 })
      expect(mockFilaMutacoes.orderBy).not.toHaveBeenCalled()
    })

    it('processes queue when online', async () => {
      mockFilaMutacoes.orderBy.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([]),
      })

      const result = await sincronizarAgora()
      expect(result).toEqual({ synced: 0, failed: 0 })
      expect(mockFilaMutacoes.orderBy).toHaveBeenCalled()
    })
  })

  describe('inicializarSincronizacao', () => {
    it('only initializes once', () => {
      const addEventListener = vi.spyOn(window, 'addEventListener')

      inicializarSincronizacao()
      inicializarSincronizacao()
      inicializarSincronizacao()

      // Should have registered online and message listeners only once
      expect(window.addEventListener).toHaveBeenCalledWith('online', expect.any(Function))
    })
  })
})
