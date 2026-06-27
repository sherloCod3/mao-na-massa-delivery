import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ErrorBoundary from '../ErrorBoundary'

// Mock import.meta.env.DEV
vi.stubGlobal('import', { meta: { env: { DEV: true } } })

const GoodChild = () => <div>Funcionando</div>

const BadChild = () => {
  throw new Error('Algo quebrou!')
}

describe('components/ErrorBoundary', () => {
  beforeEach(() => {
    // Suppress console.error from React during error boundary tests
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('renders children when no error', () => {
    render(<ErrorBoundary><GoodChild /></ErrorBoundary>)
    expect(screen.getByText('Funcionando')).toBeInTheDocument()
  })

  it('renders fallback UI on error', () => {
    render(<ErrorBoundary><BadChild /></ErrorBoundary>)
    expect(screen.getByText('Erro inesperado')).toBeInTheDocument()
    expect(screen.getByText('Algo deu errado ao carregar esta seção. Tente recarregar.')).toBeInTheDocument()
  })

  it('shows retry button on error', () => {
    render(<ErrorBoundary><BadChild /></ErrorBoundary>)
    expect(screen.getByText('Tentar novamente')).toBeInTheDocument()
  })

  it('shows reload page link on error', () => {
    render(<ErrorBoundary><BadChild /></ErrorBoundary>)
    const reloadLinks = screen.getAllByText('Recarregar página')
    expect(reloadLinks.length).toBeGreaterThanOrEqual(1)
  })

  it('renders custom fallback when provided', () => {
    render(<ErrorBoundary fallback={<div>Custom Error</div>}><BadChild /></ErrorBoundary>)
    expect(screen.getByText('Custom Error')).toBeInTheDocument()
    expect(screen.queryByText('Erro inesperado')).not.toBeInTheDocument()
  })

  it('calls onError when error occurs', () => {
    const onError = vi.fn()
    render(<ErrorBoundary onError={onError}><BadChild /></ErrorBoundary>)
    expect(onError).toHaveBeenCalledOnce()
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error)
    expect(onError.mock.calls[0][0].message).toBe('Algo quebrou!')
  })

  it('recovers after retry', async () => {
    const { rerender } = render(<ErrorBoundary><BadChild /></ErrorBoundary>)
    expect(screen.getByText('Erro inesperado')).toBeInTheDocument()

    // Click retry and re-render with good child
    const btn = screen.getByText('Tentar novamente')
    btn.click()

    rerender(<ErrorBoundary><GoodChild /></ErrorBoundary>)
    expect(screen.getByText('Funcionando')).toBeInTheDocument()
  })
})
