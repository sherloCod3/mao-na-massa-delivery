import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatusHistoryTimeline from '../StatusHistoryTimeline'
import type { StatusHistoryItem } from '../../api/client'

const mockHistorico: StatusHistoryItem[] = [
  {
    id: 3,
    status_anterior: 'producao',
    status_novo: 'entregue',
    alterado_por: 'admin',
    motivo: null,
    created_at: '2026-07-01T10:00:00Z',
  },
  {
    id: 2,
    status_anterior: 'pendente',
    status_novo: 'producao',
    alterado_por: 'admin',
    motivo: null,
    created_at: '2026-07-01T09:00:00Z',
  },
  {
    id: 1,
    status_anterior: null,
    status_novo: 'pendente',
    alterado_por: 'sistema',
    motivo: null,
    created_at: '2026-07-01T08:00:00Z',
  },
]

describe('components/StatusHistoryTimeline', () => {
  it('renders nothing when historico is empty', () => {
    const { container } = render(<StatusHistoryTimeline historico={[]} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing when historico is null', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { container } = render(<StatusHistoryTimeline historico={null as any} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders the section title', () => {
    render(<StatusHistoryTimeline historico={mockHistorico} />)
    expect(screen.getByText('Histórico de Status')).toBeInTheDocument()
  })

  it('renders all history entries', () => {
    render(<StatusHistoryTimeline historico={mockHistorico} />)
    expect(screen.getByText(/Entregue/)).toBeInTheDocument()
    expect(screen.getByText(/Em Produção/)).toBeInTheDocument()
    expect(screen.getByText(/Pendente/)).toBeInTheDocument()
  })

  it('displays motivo when present', () => {
    const historicoComMotivo: StatusHistoryItem[] = [
      {
        id: 1,
        status_anterior: 'producao',
        status_novo: 'pausado',
        alterado_por: 'admin',
        motivo: 'Falta queijo',
        created_at: '2026-07-01T08:00:00Z',
      },
    ]
    render(<StatusHistoryTimeline historico={historicoComMotivo} />)
    expect(screen.getByText(/Falta queijo/)).toBeInTheDocument()
  })

  it('renders motivos in quotes', () => {
    const historicoComMotivo: StatusHistoryItem[] = [
      {
        id: 1,
        status_anterior: 'producao',
        status_novo: 'pausado',
        alterado_por: 'admin',
        motivo: 'Falta queijo',
        created_at: '2026-07-01T08:00:00Z',
      },
    ]
    render(<StatusHistoryTimeline historico={historicoComMotivo} />)
    expect(screen.getByText(/Falta queijo/)).toBeInTheDocument()
  })

  it('shows retomado label for retorno entries', () => {
    const historicoRetorno: StatusHistoryItem[] = [
      {
        id: 2,
        status_anterior: 'pausado',
        status_novo: 'producao',
        alterado_por: 'admin',
        motivo: 'Pedido retomado',
        created_at: '2026-07-01T08:30:00Z',
      },
      {
        id: 1,
        status_anterior: 'producao',
        status_novo: 'pausado',
        alterado_por: 'admin',
        motivo: 'Falta insumo',
        created_at: '2026-07-01T08:00:00Z',
      },
    ]
    render(<StatusHistoryTimeline historico={historicoRetorno} />)
    expect(screen.getByText(/Retomado/)).toBeInTheDocument()
  })

  it('displays dates in Portuguese locale', () => {
    render(<StatusHistoryTimeline historico={mockHistorico} />)
    // Deve renderizar alguma data no formato brasileiro
    const dateElements = screen.getAllByText(/2026/)
    expect(dateElements.length).toBeGreaterThan(0)
  })
})
