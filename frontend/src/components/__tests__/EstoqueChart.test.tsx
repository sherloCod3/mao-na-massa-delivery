import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import EstoqueChart from '../EstoqueChart'

const mockIngredientes = [
  { id: 1, nome: 'Farinha', unidade_medida: 'g', preco_atual: 5, embalagem: 1000, quantidade_estoque: 5000, estoque_minimo: 2000, ativo: true, created_at: '' },
  { id: 2, nome: 'Óleo', unidade_medida: 'ml', preco_atual: 8, embalagem: 900, quantidade_estoque: 200, estoque_minimo: 500, ativo: true, created_at: '', estoque_baixo: true },
  { id: 3, nome: 'Sal', unidade_medida: 'g', preco_atual: 2, embalagem: 1000, quantidade_estoque: 300, estoque_minimo: 100, ativo: false, created_at: '' },
  { id: 4, nome: 'Açúcar', unidade_medida: 'g', preco_atual: 3, embalagem: 1000, quantidade_estoque: 500, estoque_minimo: 0, ativo: true, created_at: '' },
]

vi.mock('../../services/offlineClient', () => ({
  listarIngredientesOffline: vi.fn(),
}))

const { listarIngredientesOffline } = await import('../../services/offlineClient')

describe('components/EstoqueChart', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders chart with ingredients', async () => {
    vi.mocked(listarIngredientesOffline).mockResolvedValue(mockIngredientes)

    render(<EstoqueChart />)

    await waitFor(() => {
      expect(screen.getByText('Nível de Estoque')).toBeInTheDocument()
      expect(screen.getByText('Farinha')).toBeInTheDocument()
      expect(screen.getByText('Óleo')).toBeInTheDocument()
    })
  })

  it('does not render when no active ingredients with min stock', async () => {
    vi.mocked(listarIngredientesOffline).mockResolvedValue([
      { id: 1, nome: 'Inativo', unidade_medida: 'un', preco_atual: 0, embalagem: 1, quantidade_estoque: 0, estoque_minimo: 10, ativo: false, created_at: '' },
    ])

    const { container } = render(<EstoqueChart />)

    await waitFor(() => {
      expect(container.innerHTML).toBe('')
    })
  })

  it('shows legend', async () => {
    vi.mocked(listarIngredientesOffline).mockResolvedValue(mockIngredientes)

    render(<EstoqueChart />)

    await waitFor(() => {
      expect(screen.getByText('Estável')).toBeInTheDocument()
      expect(screen.getByText('Próximo do mínimo')).toBeInTheDocument()
      expect(screen.getByText('Crítico')).toBeInTheDocument()
    })
  })

  it('has link to ingredients page', async () => {
    vi.mocked(listarIngredientesOffline).mockResolvedValue(mockIngredientes)

    render(<EstoqueChart />)

    await waitFor(() => {
      const link = screen.getByText('Gerenciar')
      expect(link).toBeInTheDocument()
      expect(link.getAttribute('href')).toBe('/admin/ingredientes')
    })
  })
})
