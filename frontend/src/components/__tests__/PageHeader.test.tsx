import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PageHeader from '../../components/PageHeader'

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('PageHeader', () => {
  it('renders the title', () => {
    renderWithRouter(<PageHeader title="Dashboard" />)
    expect(screen.getByText('Dashboard')).toBeDefined()
  })

  it('renders subtitle when provided', () => {
    renderWithRouter(<PageHeader title="Pedidos" subtitle="5 pedidos ativos" />)
    expect(screen.getByText('5 pedidos ativos')).toBeDefined()
  })

  it('renders back button when backTo is provided', () => {
    renderWithRouter(<PageHeader title="Detalhe" backTo="/pedidos" />)
    const backBtn = screen.getByLabelText('Voltar')
    expect(backBtn).toBeDefined()
  })

  it('does not render back button without backTo', () => {
    renderWithRouter(<PageHeader title="Dashboard" />)
    expect(screen.queryByLabelText('Voltar')).toBeNull()
  })

  it('renders action slot when provided', () => {
    renderWithRouter(
      <PageHeader
        title="Lista"
        action={<button>Novo</button>}
      />
    )
    expect(screen.getByText('Novo')).toBeDefined()
  })

  it('renders icon when provided', () => {
    const icon = <span data-testid="test-icon">🔍</span>
    renderWithRouter(<PageHeader title="Busca" icon={icon} />)
    expect(screen.getByTestId('test-icon')).toBeDefined()
  })
})
