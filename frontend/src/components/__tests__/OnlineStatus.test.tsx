import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import OnlineStatus from '../OnlineStatus'

describe('components/OnlineStatus', () => {
  const originalOnLine = navigator.onLine

  afterEach(() => {
    // Restore navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      value: originalOnLine,
      writable: true,
    })
  })

  it('returns null when online', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true })
    const { container } = render(<OnlineStatus />)
    expect(container.innerHTML).toBe('')
  })

  it('renders offline banner when offline', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true })
    render(<OnlineStatus />)
    expect(screen.getByText(/Offline/)).toBeInTheDocument()
  })

  it('reacts to online event', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true })
    const { container } = render(<OnlineStatus />)
    expect(container.innerHTML).not.toBe('')

    act(() => {
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true })
      window.dispatchEvent(new Event('online'))
    })

    expect(container.innerHTML).toBe('')
  })

  it('reacts to offline event', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true })
    const { container } = render(<OnlineStatus />)
    expect(container.innerHTML).toBe('')

    act(() => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true })
      window.dispatchEvent(new Event('offline'))
    })

    expect(screen.getByText(/Offline/)).toBeInTheDocument()
  })
})
