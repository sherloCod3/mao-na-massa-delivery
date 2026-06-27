import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import SyncStatus from '../SyncStatus'

// Mock mutationQueue
vi.mock('../../services/mutationQueue', () => ({
  onPendingChange: vi.fn(() => vi.fn()),
  obterFilaPendente: vi.fn(),
  sincronizarAgora: vi.fn(),
}))

const { onPendingChange, obterFilaPendente, sincronizarAgora } = await import('../../services/mutationQueue')

describe('components/SyncStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(obterFilaPendente).mockResolvedValue(2)
    vi.mocked(onPendingChange).mockImplementation((fn: Function) => {
      // Store the listener so we can trigger it
      ; (SyncStatus as any).__listener = fn
      return vi.fn()
    })
    vi.mocked(sincronizarAgora).mockResolvedValue({ synced: 2, failed: 0 })
  })

  it('renders pending count when there are mutations', async () => {
    render(<SyncStatus />)
    const btn = await screen.findByText(/pendente/)
    expect(btn).toBeInTheDocument()
    expect(btn.textContent).toContain('2')
  })

  it('returns null when no pending mutations', async () => {
    vi.mocked(obterFilaPendente).mockResolvedValue(0)
    const { container } = render(<SyncStatus />)
    // Need to wait for the async effect
    await vi.waitFor(() => {
      expect(container.innerHTML).toBe('')
    })
  })

  it('syncs on click', async () => {
    render(<SyncStatus />)
    const btn = await screen.findByText(/pendente/)
    act(() => { btn.click() })

    expect(sincronizarAgora).toHaveBeenCalled()
  })
})
