import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ConfirmDialog from '../ConfirmDialog'

describe('components/ConfirmDialog', () => {
  const defaultProps = {
    open: true,
    title: 'Confirmar ação',
    message: 'Tem certeza que deseja continuar?',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when closed', () => {
    render(<ConfirmDialog {...defaultProps} open={false} />)
    expect(screen.queryByText('Confirmar ação')).not.toBeInTheDocument()
    expect(screen.queryByText('Tem certeza que deseja continuar?')).not.toBeInTheDocument()
  })

  it('renders title and message when open', () => {
    render(<ConfirmDialog {...defaultProps} />)
    expect(screen.getByText('Confirmar ação')).toBeInTheDocument()
    expect(screen.getByText('Tem certeza que deseja continuar?')).toBeInTheDocument()
  })

  it('renders default button labels', () => {
    render(<ConfirmDialog {...defaultProps} />)
    expect(screen.getByText('Confirmar')).toBeInTheDocument()
    expect(screen.getByText('Cancelar')).toBeInTheDocument()
  })

  it('renders custom button labels', () => {
    render(
      <ConfirmDialog
        {...defaultProps}
        confirmLabel="Sim, excluir"
        cancelLabel="Não, voltar"
      />
    )
    expect(screen.getByText('Sim, excluir')).toBeInTheDocument()
    expect(screen.getByText('Não, voltar')).toBeInTheDocument()
  })

  it('calls onConfirm when confirm button is clicked', async () => {
    const onConfirm = vi.fn()
    render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />)

    await userEvent.click(screen.getByText('Confirmar'))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('calls onCancel when cancel button is clicked', async () => {
    const onCancel = vi.fn()
    render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />)

    await userEvent.click(screen.getByText('Cancelar'))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('closes when clicking the overlay backdrop', async () => {
    const onCancel = vi.fn()
    render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />)

    // Click the overlay (outside the dialog box)
    const overlay = screen.getByTestId('confirm-overlay')
    await userEvent.click(overlay)
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('does not close when clicking inside the dialog', async () => {
    const onCancel = vi.fn()
    render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />)

    // Click inside the dialog box
    await userEvent.click(screen.getByText('Confirmar ação'))
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('closes on Escape key press', () => {
    const onCancel = vi.fn()
    render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />)

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    })
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('does not register Escape when closed', () => {
    const onCancel = vi.fn()
    render(<ConfirmDialog {...defaultProps} open={false} onCancel={onCancel} />)

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    })
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('shows loading spinner when loading is true', () => {
    render(<ConfirmDialog {...defaultProps} loading={true} />)
    expect(screen.getByText('Confirmar')).toBeInTheDocument()
    // Spinner element should be inside the confirm button
    const confirmBtn = screen.getByText('Confirmar').closest('button')
    expect(confirmBtn?.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('disables both buttons when loading', () => {
    render(<ConfirmDialog {...defaultProps} loading={true} />)
    const buttons = screen.getAllByRole('button')
    buttons.forEach(btn => {
      expect(btn).toBeDisabled()
    })
  })

  it('has accessible role alertdialog', () => {
    render(<ConfirmDialog {...defaultProps} />)
    const dialog = screen.getByRole('alertdialog')
    expect(dialog).toBeInTheDocument()
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  describe('variants', () => {
    it('renders danger variant correctly', () => {
      render(<ConfirmDialog {...defaultProps} variant="danger" />)
    })

    it('renders warning variant correctly', () => {
      render(<ConfirmDialog {...defaultProps} variant="warning" />)
    })

    it('renders default variant correctly', () => {
      render(<ConfirmDialog {...defaultProps} variant="default" />)
    })

    it.each(['danger', 'warning', 'default'] as const)(
      'renders %s variant without error',
      (variant) => {
        render(<ConfirmDialog {...defaultProps} variant={variant} />)
        expect(screen.getByText('Confirmar ação')).toBeInTheDocument()
      }
    )
  })

  it('updates Escape handler when open state changes', () => {
    const onCancel = vi.fn()
    const { rerender } = render(
      <ConfirmDialog {...defaultProps} open={true} onCancel={onCancel} />
    )

    // Escape should work when open
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    })
    expect(onCancel).toHaveBeenCalledTimes(1)

    // Re-render with closed state
    rerender(
      <ConfirmDialog {...defaultProps} open={false} onCancel={onCancel} />
    )

    // Escape should not fire when closed
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    })
    expect(onCancel).toHaveBeenCalledTimes(1) // still 1
  })
})
