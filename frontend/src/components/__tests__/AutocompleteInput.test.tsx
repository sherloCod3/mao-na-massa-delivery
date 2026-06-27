import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AutocompleteInput from '../../components/AutocompleteInput'

describe('AutocompleteInput', () => {
  const mockSearch = vi.fn<(_: string) => Promise<{ id: number; label: string; sublabel?: string }[]>>()
  const mockSelect = vi.fn()

  beforeEach(() => {
    mockSearch.mockResolvedValue([
      { id: 1, label: 'Farinha de Trigo', sublabel: '10 kg' },
      { id: 2, label: 'Farinha de Mandioca', sublabel: '5 kg' },
    ])
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const renderAutocomplete = (props: Record<string, unknown> = {}) => {
    return render(
      <AutocompleteInput
        onSearch={mockSearch}
        onSelect={mockSelect}
        placeholder="Buscar ingrediente..."
        {...props}
      />
    )
  }

  it('renders input with placeholder', () => {
    renderAutocomplete()
    expect(screen.getByPlaceholderText('Buscar ingrediente...')).toBeDefined()
  })

  it('renders search icon', () => {
    renderAutocomplete()
    const svg = document.querySelector('svg')
    expect(svg).not.toBeNull()
  })

  it('shows error message when error prop is set', () => {
    renderAutocomplete({ error: 'Erro ao buscar' })
    expect(screen.getByText('Erro ao buscar')).toBeDefined()
  })

  it('calls onSearch when user types', async () => {
    const user = userEvent.setup()
    renderAutocomplete()

    const input = screen.getByPlaceholderText('Buscar ingrediente...')
    await user.type(input, 'Farinha')

    await waitFor(() => {
      expect(mockSearch).toHaveBeenCalledWith('Farinha')
    })
  })

  it('does not search for short queries (< minChars)', async () => {
    const user = userEvent.setup()
    renderAutocomplete()

    const input = screen.getByPlaceholderText('Buscar ingrediente...')
    await user.type(input, 'a')

    // Small delay to ensure debounce fired
    await new Promise(r => setTimeout(r, 400))
    expect(mockSearch).not.toHaveBeenCalled()
  })

  it('shows results dropdown after search', async () => {
    const user = userEvent.setup()
    renderAutocomplete()

    const input = screen.getByPlaceholderText('Buscar ingrediente...')
    await user.type(input, 'Farinha')

    await waitFor(() => {
      expect(screen.getByText('Farinha de Trigo')).toBeDefined()
      expect(screen.getByText('Farinha de Mandioca')).toBeDefined()
    })
  })

  it('shows sublabel in dropdown items', async () => {
    const user = userEvent.setup()
    renderAutocomplete()

    const input = screen.getByPlaceholderText('Buscar ingrediente...')
    await user.type(input, 'Farinha')

    await waitFor(() => {
      expect(screen.getByText('10 kg')).toBeDefined()
    })
  })

  it('calls onSelect when item is clicked', async () => {
    const user = userEvent.setup()
    renderAutocomplete()

    const input = screen.getByPlaceholderText('Buscar ingrediente...')
    await user.type(input, 'Farinha')

    await waitFor(() => {
      expect(screen.getByText('Farinha de Trigo')).toBeDefined()
    })

    await user.click(screen.getByText('Farinha de Trigo'))
    expect(mockSelect).toHaveBeenCalledWith({
      id: 1,
      label: 'Farinha de Trigo',
      sublabel: '10 kg',
    })
  })

  it('closes dropdown when Escape is pressed', async () => {
    const user = userEvent.setup()
    renderAutocomplete()

    const input = screen.getByPlaceholderText('Buscar ingrediente...')
    await user.type(input, 'Farinha')

    await waitFor(() => {
      expect(screen.getByText('Farinha de Trigo')).toBeDefined()
    })

    await user.keyboard('{Escape}')

    // Dropdown should close
    await waitFor(() => {
      expect(screen.queryByText('Farinha de Trigo')).toBeNull()
    })
  })

  it('shows loading indicator while searching', async () => {
    mockSearch.mockImplementation(() => new Promise(() => {}))
    const user = userEvent.setup()
    renderAutocomplete()

    const input = screen.getByPlaceholderText('Buscar ingrediente...')
    await user.type(input, 'Farinha')

    await waitFor(() => {
      const spinner = document.querySelector('.animate-spin')
      expect(spinner).not.toBeNull()
    })
  })

  it('renders in disabled state', () => {
    renderAutocomplete({ disabled: true })
    const input = screen.getByPlaceholderText('Buscar ingrediente...')
    expect(input).toHaveProperty('disabled', true)
  })

  it('clears input on clear button click', async () => {
    const user = userEvent.setup()
    renderAutocomplete()

    const input = screen.getByPlaceholderText('Buscar ingrediente...')
    await user.type(input, 'Farinha')

    // Clear button should appear
    await waitFor(() => {
      const clearBtn = document.querySelector('button[tabindex="-1"]')
      expect(clearBtn).not.toBeNull()
    })

    const clearBtn = document.querySelector('button[tabindex="-1"]')!
    await user.click(clearBtn)

    expect(input).toHaveProperty('value', '')
  })

  it('shows empty state when no results found', async () => {
    mockSearch.mockResolvedValue([])
    const user = userEvent.setup()
    renderAutocomplete()

    const input = screen.getByPlaceholderText('Buscar ingrediente...')
    await user.type(input, 'xyz')

    await waitFor(() => {
      expect(screen.getByText('Nenhum resultado encontrado')).toBeDefined()
    })
  })

  it('supports controlled value via value prop', () => {
    renderAutocomplete({ value: 'Farinha' })
    const input = screen.getByPlaceholderText('Buscar ingrediente...') as HTMLInputElement
    expect(input.value).toBe('Farinha')
  })

  it('handles search error gracefully', async () => {
    mockSearch.mockRejectedValue(new Error('Network error'))
    const user = userEvent.setup()
    renderAutocomplete()

    const input = screen.getByPlaceholderText('Buscar ingrediente...')
    await user.type(input, 'Farinha')

    // Should not show results on error
    await new Promise(r => setTimeout(r, 500))
    expect(screen.queryByText('Farinha de Trigo')).toBeNull()
  })
})
