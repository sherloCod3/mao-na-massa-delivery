import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Layout from '../Layout'

// Mock contexts and services
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ logout: vi.fn() }),
}))

vi.mock('../../services/mutationQueue', () => ({
  inicializarSincronizacao: vi.fn(),
}))

vi.mock('../NotificationBell', () => ({
  default: () => <div data-testid="notification-bell">Bell</div>,
}))

vi.mock('../ThemeToggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle">Theme</div>,
}))

vi.mock('../OnlineStatus', () => ({
  default: () => <div data-testid="online-status">Online</div>,
}))

vi.mock('../SyncStatus', () => ({
  default: () => <div data-testid="sync-status">Sync</div>,
}))

vi.mock('../PwaInstallPrompt', () => ({
  default: () => <div data-testid="pwa-prompt">PWA</div>,
}))

describe('components/Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders navigation items in sidebar', () => {
    render(
      <BrowserRouter>
        <Layout><div>Conteúdo</div></Layout>
      </BrowserRouter>
    )

    // "Mão na Massa" appears twice (sidebar header + mobile top bar)
    const titles = screen.getAllByText('Mão na Massa')
    expect(titles.length).toBeGreaterThanOrEqual(2)

    // Nav items appear in both sidebar and bottom nav (mobile)
    const dashboards = screen.getAllByText('Dashboard')
    expect(dashboards.length).toBeGreaterThanOrEqual(1)
    const pedidos = screen.getAllByText('Pedidos')
    expect(pedidos.length).toBeGreaterThanOrEqual(1)
    const produtos = screen.getAllByText('Produtos')
    expect(produtos.length).toBeGreaterThanOrEqual(1)
  })

  it('renders secondary navigation items', () => {
    render(
      <BrowserRouter>
        <Layout><div /></Layout>
      </BrowserRouter>
    )

    expect(screen.getByText('Configuração')).toBeInTheDocument()
    expect(screen.getByText('Depoimentos')).toBeInTheDocument()
  })

  it('renders children content', () => {
    render(
      <BrowserRouter>
        <Layout><div>Conteúdo</div></Layout>
      </BrowserRouter>
    )

    expect(screen.getByText('Conteúdo')).toBeInTheDocument()
  })

  it('renders logout button', () => {
    render(
      <BrowserRouter>
        <Layout><div /></Layout>
      </BrowserRouter>
    )

    expect(screen.getByText('Sair')).toBeInTheDocument()
  })

  it('renders notification bell and theme toggle', () => {
    render(
      <BrowserRouter>
        <Layout><div /></Layout>
      </BrowserRouter>
    )

    // These components appear in sidebar AND mobile top bar
    const bells = screen.getAllByTestId('notification-bell')
    expect(bells.length).toBeGreaterThanOrEqual(1)
    const toggles = screen.getAllByTestId('theme-toggle')
    expect(toggles.length).toBeGreaterThanOrEqual(1)
  })

  it('renders version info', () => {
    render(
      <BrowserRouter>
        <Layout><div /></Layout>
      </BrowserRouter>
    )

    expect(screen.getByText('Mão na Massa v0.1')).toBeInTheDocument()
  })

  it('renders PWA prompt, OnlineStatus and SyncStatus', () => {
    render(
      <BrowserRouter>
        <Layout><div /></Layout>
      </BrowserRouter>
    )

    expect(screen.getByTestId('pwa-prompt')).toBeInTheDocument()
    expect(screen.getByTestId('online-status')).toBeInTheDocument()
    expect(screen.getByTestId('sync-status')).toBeInTheDocument()
  })
})
