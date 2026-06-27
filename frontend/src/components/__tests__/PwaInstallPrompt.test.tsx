import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PwaInstallPrompt from '../PwaInstallPrompt'

describe('components/PwaInstallPrompt', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('does not render when beforeinstallprompt never fires', () => {
    const { container } = render(<PwaInstallPrompt />)
    expect(container.innerHTML).toBe('')
  })

  it('shows banner when beforeinstallprompt fires', () => {
    render(<PwaInstallPrompt />)

    act(() => {
      window.dispatchEvent(new Event('beforeinstallprompt'))
    })

    expect(screen.getByText('Instalar App')).toBeInTheDocument()
    expect(screen.getByText('Instalar Mão na Massa')).toBeInTheDocument()
  })

  it('dismisses banner on X click and remembers choice', async () => {
    const user = userEvent.setup()
    render(<PwaInstallPrompt />)
    act(() => { window.dispatchEvent(new Event('beforeinstallprompt')) })

    // Find all X buttons and click the first one in the install banner
    const dismissButtons = screen.getAllByRole('button').filter(
      btn => btn.querySelector('svg') && btn.closest('[class*="fixed"]')
    )
    if (dismissButtons.length > 0) {
      await user.click(dismissButtons[0])
    }

    // Wait for state update
    await vi.waitFor(() => {
      expect(screen.queryByText('Instalar App')).not.toBeInTheDocument()
    })

    expect(localStorage.getItem('pwa-install-dismissed')).toBe('true')
  })

  it('does not show banner if previously dismissed', () => {
    localStorage.setItem('pwa-install-dismissed', 'true')
    render(<PwaInstallPrompt />)
    act(() => { window.dispatchEvent(new Event('beforeinstallprompt')) })

    expect(screen.queryByText('Instalar App')).not.toBeInTheDocument()
  })
})
