import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import NotificationBell from '../NotificationBell'

// Mock API client
vi.mock('../../api/client', () => ({
  notificacoesApi: {
    listar: vi.fn(),
    marcarLida: vi.fn(),
    marcarTodasLidas: vi.fn(),
  },
}))

const { notificacoesApi } = await import('../../api/client')

describe('components/NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(notificacoesApi.listar).mockResolvedValue({
      total: 2,
      notificacoes: [
        { id: 1, tipo: 'novo_pedido', titulo: 'Novo Pedido #42', mensagem: 'João fez um pedido', lida: false, referencia_tipo: null, referencia_id: null, created_at: new Date().toISOString() },
        { id: 2, tipo: 'estoque_baixo', titulo: 'Estoque baixo: Farinha', mensagem: 'Farinha está abaixo do mínimo', lida: false, referencia_tipo: null, referencia_id: null, created_at: new Date(Date.now() - 3600000).toISOString() },
      ],
    })
  })

  it('renders bell button', async () => {
    render(<NotificationBell />)
    const btn = await screen.findByTitle('Notificações')
    expect(btn).toBeInTheDocument()
  })

  it('shows notification count badge', async () => {
    render(<NotificationBell />)
    const badge = await screen.findByText('2')
    expect(badge).toBeInTheDocument()
  })

  it('opens dropdown on click', async () => {
    render(<NotificationBell />)
    act(() => { screen.getByTitle('Notificações').click() })

    await waitFor(() => {
      expect(screen.getByText('Novo Pedido #42')).toBeInTheDocument()
      expect(screen.getByText('Estoque baixo: Farinha')).toBeInTheDocument()
    })
  })

  it('shows empty state when no notifications', async () => {
    vi.mocked(notificacoesApi.listar).mockResolvedValue({
      total: 0,
      notificacoes: [],
    })

    render(<NotificationBell />)
    act(() => { screen.getByTitle('Notificações').click() })

    await waitFor(() => {
      expect(screen.getByText('Nenhuma notificação')).toBeInTheDocument()
    })
  })

  it('calls marcarTodas when clicking "Marcar todas"', async () => {
    vi.mocked(notificacoesApi.marcarTodasLidas).mockResolvedValue({ ok: true })

    render(<NotificationBell />)
    act(() => { screen.getByTitle('Notificações').click() })

    const btn = await screen.findByText('Marcar todas')
    act(() => { btn.click() })

    expect(notificacoesApi.marcarTodasLidas).toHaveBeenCalled()
  })
})
