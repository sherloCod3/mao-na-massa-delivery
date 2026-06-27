import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getCachedOrFetch, invalidateCache } from '../../services/db'

// ─── Mocks ───────────────────────────────────────────────────────

vi.mock('../../services/db', () => {
  // Create table objects that look like Dexie tables
  const table = () => ({
    get: vi.fn(),
    put: vi.fn(),
    clear: vi.fn(),
  })
  return {
    db: {
      ingredientes: table(),
      produtos: table(),
      variacoes: table(),
      receitaItems: table(),
      custoVariacao: table(),
      pedidos: table(),
      pedidoDetalhe: table(),
      dashboardHoje: table(),
      listaCompras: table(),
      listaComprasResumo: table(),
    },
    getCachedOrFetch: vi.fn(),
    invalidateCache: vi.fn(),
  }
})

const mockGetCachedOrFetch = vi.mocked(getCachedOrFetch)
const mockInvalidateCache = vi.mocked(invalidateCache)

// Mock the API client methods
vi.mock('../../api/client', () => ({
  ingredientesApi: {
    listar: vi.fn(),
    criar: vi.fn(),
    atualizar: vi.fn(),
    desativar: vi.fn(),
    movimentar: vi.fn(),
    movimentacoes: vi.fn(),
  },
  produtosApi: {
    listar: vi.fn(),
  },
  variacoesApi: {
    listar: vi.fn(),
    receita: vi.fn(),
    custo: vi.fn(),
  },
  pedidosApi: {
    listar: vi.fn(),
    obter: vi.fn(),
  },
  trackingApi: {
    tracking: vi.fn(),
  },
  dashboardApi: {
    hoje: vi.fn(),
  },
  listaComprasApi: {
    listar: vi.fn(),
    resumo: vi.fn(),
  },
}))

const {
  ingredientesApi,
  produtosApi,
  variacoesApi,
  pedidosApi,
  trackingApi,
  dashboardApi,
  listaComprasApi,
} = await import('../../api/client')

import {
  listarIngredientesOffline,
  criarIngredienteOffline,
  atualizarIngredienteOffline,
  desativarIngredienteOffline,
  movimentarEstoqueOffline,
  listarMovimentacoesOffline,
  listarProdutosOffline,
  listarVariacoesOffline,
  obterReceitaOffline,
  obterCustoOffline,
  listarPedidosOffline,
  obterPedidoDetalheOffline,
  obterTrackingOffline,
  obterDashboardHojeOffline,
  listarComprasOffline,
  obterResumoComprasOffline,
} from '../offlineClient'

describe('services/offlineClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ─── Ingredientes ──────────────────────────────────────────

  describe('listarIngredientesOffline', () => {
    it('delegates to getCachedOrFetch with ingredientes listar', async () => {
      const dados = [{ id: 1, nome: 'Farinha' }]
      mockGetCachedOrFetch.mockResolvedValue(dados)

      const result = await listarIngredientesOffline()

      expect(result).toBe(dados)
      expect(mockGetCachedOrFetch).toHaveBeenCalledWith(
        expect.anything(), 'all', expect.any(Function),
      )
    })
  })

  describe('criarIngredienteOffline', () => {
    it('calls API and invalidates cache', async () => {
      const data = { nome: 'Farinha' }
      const created = { id: 1, nome: 'Farinha' }
      vi.mocked(ingredientesApi.criar).mockResolvedValue(created as any)

      const result = await criarIngredienteOffline(data)

      expect(result).toBe(created)
      expect(ingredientesApi.criar).toHaveBeenCalledWith(data)
      expect(mockInvalidateCache).toHaveBeenCalled()
    })
  })

  describe('atualizarIngredienteOffline', () => {
    it('calls API and invalidates cache', async () => {
      const data = { nome: 'Farinha Integral' }
      vi.mocked(ingredientesApi.atualizar).mockResolvedValue({ id: 1 } as any)

      await atualizarIngredienteOffline(1, data)

      expect(ingredientesApi.atualizar).toHaveBeenCalledWith(1, data)
      expect(mockInvalidateCache).toHaveBeenCalled()
    })
  })

  describe('desativarIngredienteOffline', () => {
    it('calls API and invalidates cache', async () => {
      vi.mocked(ingredientesApi.desativar).mockResolvedValue(undefined)

      await desativarIngredienteOffline(1)

      expect(ingredientesApi.desativar).toHaveBeenCalledWith(1)
      expect(mockInvalidateCache).toHaveBeenCalled()
    })
  })

  describe('movimentarEstoqueOffline', () => {
    it('calls API and invalidates cache', async () => {
      const mov = { tipo: 'saida', quantidade: 5 } as const
      vi.mocked(ingredientesApi.movimentar).mockResolvedValue({ id: 1 } as any)

      await movimentarEstoqueOffline(1, mov)

      expect(ingredientesApi.movimentar).toHaveBeenCalledWith(1, mov)
      expect(mockInvalidateCache).toHaveBeenCalled()
    })
  })

  describe('listarMovimentacoesOffline', () => {
    it('calls API directly without cache', async () => {
      vi.mocked(ingredientesApi.movimentacoes).mockResolvedValue([])

      const result = await listarMovimentacoesOffline(1)

      expect(result).toEqual([])
      expect(ingredientesApi.movimentacoes).toHaveBeenCalledWith(1, 50)
    })

    it('passes custom limit', async () => {
      vi.mocked(ingredientesApi.movimentacoes).mockResolvedValue([])

      await listarMovimentacoesOffline(1, 10)

      expect(ingredientesApi.movimentacoes).toHaveBeenCalledWith(1, 10)
    })
  })

  // ─── Produtos ──────────────────────────────────────────────

  describe('listarProdutosOffline', () => {
    it('delegates to getCachedOrFetch with produtos listar', async () => {
      const dados = [{ id: 1, nome: 'Salgados' }]
      mockGetCachedOrFetch.mockResolvedValue(dados)

      const result = await listarProdutosOffline()

      expect(result).toBe(dados)
      expect(mockGetCachedOrFetch).toHaveBeenCalledWith(
        expect.anything(), 'all', expect.any(Function),
      )
    })
  })

  // ─── Variacoes ─────────────────────────────────────────────

  describe('listarVariacoesOffline', () => {
    it('delegates with produto-specific key', async () => {
      const dados = [{ id: 1, nome: 'Frango' }]
      mockGetCachedOrFetch.mockResolvedValue(dados)

      const result = await listarVariacoesOffline(5)

      expect(result).toBe(dados)
      expect(mockGetCachedOrFetch).toHaveBeenCalledWith(
        expect.anything(), 'produto_5', expect.any(Function),
      )
    })
  })

  describe('obterReceitaOffline', () => {
    it('delegates with variacao-specific key', async () => {
      mockGetCachedOrFetch.mockResolvedValue([])

      await obterReceitaOffline(3)

      expect(mockGetCachedOrFetch).toHaveBeenCalledWith(
        expect.anything(), 'variacao_3', expect.any(Function),
      )
    })
  })

  describe('obterCustoOffline', () => {
    it('delegates with variacao-specific key', async () => {
      mockGetCachedOrFetch.mockResolvedValue({ custo: 5.0 })

      await obterCustoOffline(3)

      expect(mockGetCachedOrFetch).toHaveBeenCalledWith(
        expect.anything(), 'variacao_3', expect.any(Function),
      )
    })
  })

  // ─── Pedidos ───────────────────────────────────────────────

  describe('listarPedidosOffline', () => {
    it('delegates to getCachedOrFetch', async () => {
      mockGetCachedOrFetch.mockResolvedValue([])

      await listarPedidosOffline()

      expect(mockGetCachedOrFetch).toHaveBeenCalledWith(
        expect.anything(), 'all', expect.any(Function),
      )
    })
  })

  describe('obterPedidoDetalheOffline', () => {
    it('delegates with pedido-specific key', async () => {
      mockGetCachedOrFetch.mockResolvedValue({ id: 10 })

      const result = await obterPedidoDetalheOffline(10)

      expect(result).toEqual({ id: 10 })
      expect(mockGetCachedOrFetch).toHaveBeenCalledWith(
        expect.anything(), 'pedido_10', expect.any(Function),
      )
    })
  })

  // ─── Tracking ──────────────────────────────────────────────

  describe('obterTrackingOffline', () => {
    it('delegates with track-specific key', async () => {
      mockGetCachedOrFetch.mockResolvedValue({ id: 5 })

      const result = await obterTrackingOffline('abc123')

      expect(result).toEqual({ id: 5 })
      expect(mockGetCachedOrFetch).toHaveBeenCalledWith(
        expect.anything(), 'track_abc123', expect.any(Function),
      )
    })
  })

  // ─── Dashboard ─────────────────────────────────────────────

  describe('obterDashboardHojeOffline', () => {
    it('delegates with "hoje" key', async () => {
      mockGetCachedOrFetch.mockResolvedValue({ pedidos_ativos: 5 })

      const result = await obterDashboardHojeOffline()

      expect(result).toEqual({ pedidos_ativos: 5 })
      expect(mockGetCachedOrFetch).toHaveBeenCalledWith(
        expect.anything(), 'hoje', expect.any(Function),
      )
    })
  })

  // ─── Lista de Compras ──────────────────────────────────────

  describe('listarComprasOffline', () => {
    it('delegates to getCachedOrFetch', async () => {
      mockGetCachedOrFetch.mockResolvedValue([])

      await listarComprasOffline()

      expect(mockGetCachedOrFetch).toHaveBeenCalledWith(
        expect.anything(), 'all', expect.any(Function),
      )
    })
  })

  describe('obterResumoComprasOffline', () => {
    it('delegates with "resumo" key', async () => {
      const resumo = { total_estimado: 100 }
      mockGetCachedOrFetch.mockResolvedValue(resumo)

      const result = await obterResumoComprasOffline()

      expect(result).toBe(resumo)
      expect(mockGetCachedOrFetch).toHaveBeenCalledWith(
        expect.anything(), 'resumo', expect.any(Function),
      )
    })
  })
})
