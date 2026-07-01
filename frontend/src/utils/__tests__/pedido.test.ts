import { describe, it, expect } from 'vitest'
import {
  STATUS_FLOW,
  STATUS_LABELS,
  STATUS_COLORS,
  STATUS_COLORS_SIMPLE,
  getStatusLabel,
  getStatusColor,
  getStatusColorSimple,
  getStatusEmoji,
  getStatusStepLabel,
  getStatusGradient,
  getStatusBgColor,
  getAgingInfo,
  calcMinutesSince,
} from '../../utils/pedido'

describe('utils/pedido', () => {
  describe('STATUS_FLOW', () => {
    it('defines the correct order', () => {
      expect(STATUS_FLOW).toEqual(['pendente', 'producao', 'produzido', 'entrega', 'entregue'])
    })
  })

  describe('STATUS_LABELS', () => {
    it('has labels for all flow statuses', () => {
      for (const status of STATUS_FLOW) {
        expect(STATUS_LABELS[status]).toBeDefined()
        expect(STATUS_LABELS[status].length).toBeGreaterThan(0)
      }
    })

    it('includes pause and cancel', () => {
      expect(STATUS_LABELS['pausado']).toBeDefined()
      expect(STATUS_LABELS['pausado']).toContain('Pausado')
      expect(STATUS_LABELS['cancelado']).toBeDefined()
      expect(STATUS_LABELS['cancelado']).toContain('Cancelado')
    })
  })

  describe('STATUS_COLORS', () => {
    it('has colors for all flow statuses', () => {
      for (const status of STATUS_FLOW) {
        expect(STATUS_COLORS[status]).toBeDefined()
        expect(STATUS_COLORS[status]).toContain('text-')
      }
    })

    it('includes pause and cancel', () => {
      expect(STATUS_COLORS['pausado']).toBeDefined()
      expect(STATUS_COLORS['cancelado']).toBeDefined()
    })
  })

  describe('STATUS_COLORS_SIMPLE', () => {
    it('has colors for all statuses', () => {
      for (const status of Object.keys(STATUS_LABELS)) {
        expect(STATUS_COLORS_SIMPLE[status]).toBeDefined()
        expect(STATUS_COLORS_SIMPLE[status]).toContain('bg-')
        expect(STATUS_COLORS_SIMPLE[status]).toContain('text-')
      }
    })
  })

  describe('getStatusLabel()', () => {
    it('returns correct label for known status', () => {
      expect(getStatusLabel('pendente')).toBe(STATUS_LABELS['pendente'])
      expect(getStatusLabel('entregue')).toBe(STATUS_LABELS['entregue'])
    })

    it('returns the raw status for unknown status', () => {
      expect(getStatusLabel('unknown_status')).toBe('unknown_status')
    })
  })

  describe('getStatusColor()', () => {
    it('returns color for known status', () => {
      expect(getStatusColor('producao')).toBe(STATUS_COLORS['producao'])
    })

    it('returns fallback for unknown status', () => {
      expect(getStatusColor('xyz')).toBe('bg-gray-100 text-gray-800')
    })
  })

  describe('getStatusColorSimple()', () => {
    it('returns simple color for known status', () => {
      expect(getStatusColorSimple('entrega')).toBe(STATUS_COLORS_SIMPLE['entrega'])
    })

    it('returns fallback for unknown status', () => {
      expect(getStatusColorSimple('xyz')).toBe('bg-gray-100 text-gray-800')
    })
  })

  describe('getStatusBgColor()', () => {
    it('returns bg color for known status', () => {
      expect(getStatusBgColor('pendente')).toContain('bg-')
    })

    it('returns fallback for unknown status', () => {
      expect(getStatusBgColor('xyz')).toBe('bg-gray-50 border-gray-200')
    })
  })

  describe('getStatusEmoji()', () => {
    it('returns emoji for all known statuses', () => {
      expect(getStatusEmoji('pendente')).toBe('⏳')
      expect(getStatusEmoji('producao')).toBe('👩‍🍳')
      expect(getStatusEmoji('produzido')).toBe('✅')
      expect(getStatusEmoji('entrega')).toBe('🚚')
      expect(getStatusEmoji('entregue')).toBe('🎉')
      expect(getStatusEmoji('pausado')).toBe('⏸️')
      expect(getStatusEmoji('cancelado')).toBe('❌')
    })

    it('returns default for unknown status', () => {
      expect(getStatusEmoji('xyz')).toBe('📌')
    })
  })

  describe('getStatusStepLabel()', () => {
    it('returns description for flow statuses', () => {
      for (const status of STATUS_FLOW) {
        const label = getStatusStepLabel(status)
        expect(label.length).toBeGreaterThan(0)
      }
    })

    it('returns empty for non-flow status', () => {
      expect(getStatusStepLabel('cancelado')).toBe('')
    })
  })

  describe('getStatusGradient()', () => {
    it('returns gradient for flow statuses', () => {
      expect(getStatusGradient('pendente')).toContain('from-')
      expect(getStatusGradient('producao')).toContain('from-')
      expect(getStatusGradient('produzido')).toContain('from-')
      expect(getStatusGradient('entrega')).toContain('from-')
      expect(getStatusGradient('entregue')).toContain('from-')
    })

    it('has gradients for pause and cancel', () => {
      expect(getStatusGradient('pausado')).toContain('from-')
      expect(getStatusGradient('cancelado')).toContain('from-')
    })

    it('returns fallback gradient for unknown', () => {
      expect(getStatusGradient('xyz')).toBe('from-gray-500 to-gray-600')
    })
  })

  describe('getAgingInfo()', () => {
    it('returns fresh for <30 min', () => {
      const info = getAgingInfo(15)
      expect(info.level).toBe('fresh')
      expect(info.label).toBe('')
      expect(info.cardClass).toBe('')
    })

    it('returns warning for 30-60 min', () => {
      const info = getAgingInfo(35)
      expect(info.level).toBe('warning')
      expect(info.label).toContain('30min')
      expect(info.cardClass).toContain('amber')
    })

    it('returns alert for 60-120 min', () => {
      const info = getAgingInfo(90)
      expect(info.level).toBe('alert')
      expect(info.label).toContain('1h')
      expect(info.cardClass).toContain('amber')
    })

    it('returns critical for 120+ min', () => {
      const info = getAgingInfo(150)
      expect(info.level).toBe('critical')
      expect(info.label).toContain('2h')
      expect(info.cardClass).toContain('red')
    })
  })

  describe('calcMinutesSince()', () => {
    it('returns positive number for past date', () => {
      const mins = calcMinutesSince(new Date(Date.now() - 3600000).toISOString())
      expect(mins).toBeGreaterThan(50)
      expect(mins).toBeLessThan(70)
    })

    it('returns near 0 for current date', () => {
      const mins = calcMinutesSince(new Date().toISOString())
      expect(mins).toBeLessThan(1)
    })
  })
})
