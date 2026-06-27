import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Loading, Empty, ErrorState } from '../AsyncWrapper'

describe('components/AsyncWrapper', () => {
  describe('Loading', () => {
    it('renders default message', () => {
      render(<Loading />)
      expect(screen.getByText('Carregando...')).toBeInTheDocument()
    })

    it('renders custom message', () => {
      render(<Loading message="Buscando dados..." />)
      expect(screen.getByText('Buscando dados...')).toBeInTheDocument()
    })

    it('applies custom height class', () => {
      const { container } = render(<Loading height="h-32" />)
      const div = container.querySelector('.h-32')
      expect(div).toBeInTheDocument()
    })
  })

  describe('Empty', () => {
    it('renders default title', () => {
      render(<Empty />)
      expect(screen.getByText('Nenhum registro encontrado')).toBeInTheDocument()
    })

    it('renders custom title and message', () => {
      render(<Empty title="Sem dados" message="Nada aqui ainda" />)
      expect(screen.getByText('Sem dados')).toBeInTheDocument()
      expect(screen.getByText('Nada aqui ainda')).toBeInTheDocument()
    })

    it('renders action button', () => {
      render(<Empty action={<button>Criar</button>} />)
      expect(screen.getByText('Criar')).toBeInTheDocument()
    })

    it('does not render message when not provided', () => {
      const { container } = render(<Empty />)
      // Should only have the title, no extra message paragraph
      const paragraphs = container.querySelectorAll('p')
      expect(paragraphs.length).toBe(1)
    })
  })

  describe('ErrorState', () => {
    it('renders default error message', () => {
      render(<ErrorState />)
      expect(screen.getByText('Erro ao carregar dados')).toBeInTheDocument()
    })

    it('renders custom message and detail', () => {
      render(<ErrorState message="Falha na conexão" detail="Verifique sua internet" />)
      expect(screen.getByText('Falha na conexão')).toBeInTheDocument()
      expect(screen.getByText('Verifique sua internet')).toBeInTheDocument()
    })

    it('renders retry button when onRetry is provided', () => {
      const onRetry = vi.fn()
      render(<ErrorState onRetry={onRetry} />)
      const btn = screen.getByText('Tentar novamente')
      expect(btn).toBeInTheDocument()
      btn.click()
      expect(onRetry).toHaveBeenCalledOnce()
    })

    it('does not render retry button when onRetry is undefined', () => {
      render(<ErrorState />)
      expect(screen.queryByText('Tentar novamente')).not.toBeInTheDocument()
    })
  })
})
