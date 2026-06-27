import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { ToastProvider, useToast } from '../Toast'

// Helper component that uses the toast hook
function ToastTrigger({ type = 'success' as const, message = 'Teste' }) {
  const { toast } = useToast()
  return <button onClick={() => toast(type, message)}>Mostrar Toast</button>
}

describe('components/Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('provides toast context to children', () => {
    render(<ToastProvider><ToastTrigger /></ToastProvider>)
    expect(screen.getByText('Mostrar Toast')).toBeInTheDocument()
  })

  it('renders success toast on trigger', () => {
    render(<ToastProvider><ToastTrigger type="success" message="Salvo!" /></ToastProvider>)
    act(() => { screen.getByText('Mostrar Toast').click() })
    expect(screen.getByText('Salvo!')).toBeInTheDocument()
  })

  it('renders error toast', () => {
    render(<ToastProvider><ToastTrigger type="error" message="Erro!" /></ToastProvider>)
    act(() => { screen.getByText('Mostrar Toast').click() })
    expect(screen.getByText('Erro!')).toBeInTheDocument()
  })

  it('renders info toast', () => {
    render(<ToastProvider><ToastTrigger type="info" message="Info" /></ToastProvider>)
    act(() => { screen.getByText('Mostrar Toast').click() })
    expect(screen.getByText('Info')).toBeInTheDocument()
  })

  it('removes toast after timeout', () => {
    render(<ToastProvider><ToastTrigger message="Temporário" /></ToastProvider>)
    act(() => { screen.getByText('Mostrar Toast').click() })
    expect(screen.getByText('Temporário')).toBeInTheDocument()

    // Advance past the 3500ms timeout
    act(() => { vi.advanceTimersByTime(4000) })
    expect(screen.queryByText('Temporário')).not.toBeInTheDocument()
  })

  it('allows dismissing toast manually', () => {
    render(<ToastProvider><ToastTrigger message="Dismissível" /></ToastProvider>)
    act(() => { screen.getByText('Mostrar Toast').click() })

    // Find and click the X button
    const dismissBtn = screen.getByText('Dismissível').closest('div')?.querySelector('button')
    expect(dismissBtn).toBeInTheDocument()
    if (dismissBtn) act(() => { dismissBtn.click() })
    expect(screen.queryByText('Dismissível')).not.toBeInTheDocument()
  })

  it('useToast throws outside provider', () => {
    const TestComp = () => {
      useToast()
      return null
    }

    expect(() => render(<TestComp />)).toThrow('useToast must be used within ToastProvider')
  })
})
