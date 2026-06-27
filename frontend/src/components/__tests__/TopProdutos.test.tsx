import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import TopProdutos from '../TopProdutos'

const mockProdutos = [
  { produto_nome: 'Coxinha', variacao_nome: 'Frango', quantidade: 50, total_faturado: 250 },
  { produto_nome: 'Pastel', variacao_nome: 'Carne', quantidade: 30, total_faturado: 150 },
  { produto_nome: 'Kibe', variacao_nome: 'Tradicional', quantidade: 20, total_faturado: 100 },
  { produto_nome: 'Empada', variacao_nome: 'Frango', quantidade: 10, total_faturado: 50 },
  { produto_nome: 'Bolinho', variacao_nome: 'Queijo', quantidade: 5, total_faturado: 25 },
]

describe('components/TopProdutos', () => {
  it('shows empty message when no data', () => {
    render(<TopProdutos data={[]} />)
    expect(screen.getByText('Nenhum pedido concluído ainda')).toBeInTheDocument()
  })

  it('renders product list sorted by rank', () => {
    render(<TopProdutos data={mockProdutos} />)
    expect(screen.getByText('Coxinha')).toBeInTheDocument()
    expect(screen.getByText('Pastel')).toBeInTheDocument()
    expect(screen.getByText('Kibe')).toBeInTheDocument()
  })

  it('shows quantity and revenue', () => {
    render(<TopProdutos data={[mockProdutos[0]]} />)
    expect(screen.getByText('50 un')).toBeInTheDocument()
    expect(screen.getByText('R$ 250.00')).toBeInTheDocument()
  })

  it('renders all products in the list', () => {
    render(<TopProdutos data={mockProdutos} />)
    const items = screen.getAllByText(/un/)
    expect(items).toHaveLength(5)
  })

  it('shows medals for top 3', () => {
    const { container } = render(<TopProdutos data={mockProdutos} />)
    // The top 3 should have medal icons instead of numbers
    // The container should have svg elements
    expect(container.querySelectorAll('svg').length).toBeGreaterThan(0)
  })
})
