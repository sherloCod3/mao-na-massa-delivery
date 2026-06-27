import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { ThemeToggle, useTheme } from '../ThemeToggle'

describe('components/ThemeToggle', () => {
  const originalMatchMedia = window.matchMedia
  const originalLocalStorage = window.localStorage

  beforeEach(() => {
    // Mock matchMedia with light mode default
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    // Clear localStorage
    localStorage.clear()
  })

  afterEach(() => {
    window.matchMedia = originalMatchMedia
    document.documentElement.classList.remove('dark')
  })

  it('renders in light mode by default', () => {
    render(<ThemeToggle />)
    expect(screen.getByRole('button')).toBeInTheDocument()
    // In light mode, shows Moon icon (title: "Modo escuro")
    expect(screen.getByTitle('Modo escuro')).toBeInTheDocument()
  })

  it('toggles to dark mode on click', () => {
    render(<ThemeToggle />)
    const btn = screen.getByRole('button')

    act(() => { btn.click() })

    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem('mao-na-massa-theme')).toBe('dark')
    expect(screen.getByTitle('Modo claro')).toBeInTheDocument()
  })

  it('toggles back to light mode', () => {
    render(<ThemeToggle />)
    const btn = screen.getByRole('button')

    act(() => { btn.click() })  // → dark
    act(() => { btn.click() })  // → light

    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(localStorage.getItem('mao-na-massa-theme')).toBe('light')
  })

  it('applies custom className', () => {
    const { container } = render(<ThemeToggle className="custom-class" />)
    const btn = container.querySelector('button')
    expect(btn?.className).toContain('custom-class')
  })
})

describe('useTheme', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('dark')
  })

  it('returns light theme initially', () => {
    function TestComponent() {
      const { theme, isDark } = useTheme()
      return <div data-testid="theme">{theme} {isDark ? 'dark' : 'light'}</div>
    }
    render(<TestComponent />)
    expect(screen.getByTestId('theme').textContent).toBe('light light')
  })
})
