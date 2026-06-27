import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AutocompleteIngrediente from '../../components/AutocompleteIngrediente'

// Mock the API client
vi.mock('../../api/client', () => ({
  ingredientesApi: {
    listar: vi.fn(),
  },
}))

// Mock offline fallback
vi.mock('../../services/offlineClient', () => ({
  listarIngredientesOffline: vi.fn(),
}))

import { ingredientesApi } from '../../api/client'
import { listarIngredientesOffline } from '../../services/offlineClient'

describe('AutocompleteIngrediente', () => {
  const mockSelect = vi.fn()
  const mockIngredientes = [
    {
      id: 1,
      nome: 'Farinha de Trigo',
      unidade_medida: 'kg',
      preco_atual: 5.50,
      embalagem: 1,
      quantidade_estoque: 10,
      estoque_minimo: 2,
      estoque_baixo: false,
      ativo: true,
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 2,
      nome: 'Açúcar Refinado',
      unidade_medida: 'kg',
      preco_atual: 3.20,
      embalagem: 1,
      quantidade_estoque: 5,
      estoque_minimo: 2,
      estoque_baixo: false,
      ativo: true,
      created_at: '2024-01-01T00:00:00Z',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(ingredientesApi.listar).mockResolvedValue(mockIngredientes)
  })

  it('renders input with default placeholder', () => {
    render(<AutocompleteIngrediente onSelect={mockSelect} />)
    expect(screen.getByPlaceholderText('Buscar ingrediente...')).toBeDefined()
  })

  it('renders input with custom placeholder', () => {
    render(
      <AutocompleteIngrediente
        onSelect={mockSelect}
        placeholder="Encontrar ingrediente..."
      />
    )
    expect(screen.getByPlaceholderText('Encontrar ingrediente...')).toBeDefined()
  })

  it('renders in disabled state', () => {
    render(<AutocompleteIngrediente onSelect={mockSelect} disabled />)
    const input = screen.getByPlaceholderText('Buscar ingrediente...')
    expect(input).toHaveProperty('disabled', true)
  })

  it('shows error message when error prop is set', () => {
    render(<AutocompleteIngrediente onSelect={mockSelect} error="Erro de conexão" />)
    expect(screen.getByText('Erro de conexão')).toBeDefined()
  })

  it('calls API with search query when typing', async () => {
    const user = userEvent.setup()
    render(<AutocompleteIngrediente onSelect={mockSelect} />)

    const input = screen.getByPlaceholderText('Buscar ingrediente...')
    await user.type(input, 'Farinha')

    await waitFor(() => {
      expect(ingredientesApi.listar).toHaveBeenCalledWith('Farinha', 10)
    })
  })

  it('renders with controlled value', () => {
    render(
      <AutocompleteIngrediente
        onSelect={mockSelect}
        value="Farinha"
        onChange={vi.fn()}
      />
    )
    const input = screen.getByPlaceholderText('Buscar ingrediente...') as HTMLInputElement
    expect(input.value).toBe('Farinha')
  })

  it('falls back to offline data when API fails', async () => {
    vi.mocked(ingredientesApi.listar).mockRejectedValue(new Error('Network error'))
    vi.mocked(listarIngredientesOffline).mockResolvedValue(mockIngredientes)

    const user = userEvent.setup()
    render(<AutocompleteIngrediente onSelect={mockSelect} />)

    const input = screen.getByPlaceholderText('Buscar ingrediente...')
    await user.type(input, 'Farinha')

    await waitFor(() => {
      expect(listarIngredientesOffline).toHaveBeenCalled()
    })
  })
})
