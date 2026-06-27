import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AutocompleteProduto from '../../components/AutocompleteProduto'

// Mock the API client
vi.mock('../../api/client', () => ({
  produtosApi: {
    listar: vi.fn(),
  },
}))

// Mock offline fallback
vi.mock('../../services/offlineClient', () => ({
  listarProdutosOffline: vi.fn(),
}))

import { produtosApi } from '../../api/client'
import { listarProdutosOffline } from '../../services/offlineClient'

describe('AutocompleteProduto', () => {
  const mockSelect = vi.fn()
  const mockProdutos = [
    {
      id: 1,
      nome: 'Coxinha',
      descricao: 'Frango com catupiry',
      imagem_url: null,
      ativo: true,
      variacoes: [
        { id: 1, produto_id: 1, nome: 'Tradicional', preco_venda: 8.0, preco_minimo: 6.0, margem_percentual: 40, ativo: true, custo_unitario: 3.0, preco_sugerido: 7.0 },
        { id: 2, produto_id: 1, nome: 'Cheddar', preco_venda: 9.0, preco_minimo: 7.0, margem_percentual: 40, ativo: true, custo_unitario: 3.5, preco_sugerido: 8.0 },
      ],
    },
    {
      id: 2,
      nome: 'Brigadeiro',
      descricao: 'Chocolate',
      imagem_url: null,
      ativo: true,
      variacoes: [
        { id: 3, produto_id: 2, nome: 'Tradicional', preco_venda: 5.0, preco_minimo: 3.0, margem_percentual: 40, ativo: true, custo_unitario: 1.5, preco_sugerido: 4.0 },
      ],
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(produtosApi.listar).mockResolvedValue(mockProdutos)
  })

  it('renders input with default placeholder', () => {
    render(<AutocompleteProduto onSelect={mockSelect} />)
    expect(screen.getByPlaceholderText('Buscar produto...')).toBeDefined()
  })

  it('renders input with custom placeholder', () => {
    render(
      <AutocompleteProduto
        onSelect={mockSelect}
        placeholder="Procurar produto..."
      />
    )
    expect(screen.getByPlaceholderText('Procurar produto...')).toBeDefined()
  })

  it('renders in disabled state', () => {
    render(<AutocompleteProduto onSelect={mockSelect} disabled />)
    const input = screen.getByPlaceholderText('Buscar produto...')
    expect(input).toHaveProperty('disabled', true)
  })

  it('shows error message', () => {
    render(<AutocompleteProduto onSelect={mockSelect} error="Erro ao buscar" />)
    expect(screen.getByText('Erro ao buscar')).toBeDefined()
  })

  it('calls API with search query when typing', async () => {
    const user = userEvent.setup()
    render(<AutocompleteProduto onSelect={mockSelect} />)

    const input = screen.getByPlaceholderText('Buscar produto...')
    await user.type(input, 'Coxinha')

    await waitFor(() => {
      expect(produtosApi.listar).toHaveBeenCalledWith('Coxinha', 10)
    })
  })

  it('renders with controlled value', () => {
    render(
      <AutocompleteProduto
        onSelect={mockSelect}
        value="Coxinha"
        onChange={vi.fn()}
      />
    )
    const input = screen.getByPlaceholderText('Buscar produto...') as HTMLInputElement
    expect(input.value).toBe('Coxinha')
  })

  it('falls back to offline when API fails', async () => {
    vi.mocked(produtosApi.listar).mockRejectedValue(new Error('Network error'))
    vi.mocked(listarProdutosOffline).mockResolvedValue(mockProdutos)

    const user = userEvent.setup()
    render(<AutocompleteProduto onSelect={mockSelect} />)

    const input = screen.getByPlaceholderText('Buscar produto...')
    await user.type(input, 'Coxinha')

    await waitFor(() => {
      expect(listarProdutosOffline).toHaveBeenCalled()
    })
  })
})
