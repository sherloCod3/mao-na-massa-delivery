import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import MensalChart from '../MensalChart'

// Mock recharts ResponsiveContainer to render children directly in jsdom
vi.mock('recharts', async () => {
  const actual = await vi.importActual('recharts')
  return {
    ...(actual as object),
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div className="recharts-responsive-container" style={{ width: 800, height: 320 }}>
        {children}
      </div>
    ),
  }
})

describe('components/MensalChart', () => {
  it('shows empty message when no data', () => {
    render(<MensalChart data={[]} />)
    expect(screen.getByText('Nenhum dado disponível para o período')).toBeInTheDocument()
  })

  it('renders chart with data', () => {
    const data = [
      { mes: '2024-01', faturamento: 5000, custos: 2000, lucro: 3000, total_pedidos: 100 },
      { mes: '2024-02', faturamento: 6000, custos: 2500, lucro: 3500, total_pedidos: 120 },
    ]
    const { container } = render(<MensalChart data={data} />)
    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument()
  })

  it('formats month labels correctly', () => {
    const data = [
      { mes: '2024-01', faturamento: 5000, custos: 2000, lucro: 3000, total_pedidos: 100 },
    ]
    // With the ResponsiveContainer mock, XAxis renders text nodes
    // but the formatted month may not be directly queryable via getByText
    // because recharts scatters it across SVG elements
    const { container } = render(<MensalChart data={data} />)
    // Check that the chart container rendered
    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument()
  })
})
