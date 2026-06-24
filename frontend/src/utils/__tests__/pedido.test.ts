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
} from '../../utils/pedido'

describe('utils/pedido', () => {
  describe('STATUS_FLOW', () => {
    it('defines the correct order', () => {
      expect(STATUS_FLOW).toEqual(['recebido', 'producao', 'entrega', 'entregue'])
    })
  })

  describe('STATUS_LABELS', () => {
    it('has labels for all flow statuses', () => {
      for (const status of STATUS_FLOW) {
        expect(STATUS_LABELS[status]).toBeDefined()
        expect(STATUS_LABELS[status].length).toBeGreaterThan(0)
      }
    })

    it('includes cancelado', () => {
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

    it('includes cancelado', () => {
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
      expect(getStatusLabel('recebido')).toBe(STATUS_LABELS['recebido'])
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

  describe('getStatusEmoji()', () => {
    it('returns emoji for all known statuses', () => {
      expect(getStatusEmoji('recebido')).toBe('📥')
      expect(getStatusEmoji('producao')).toBe('👩‍🍳')
      expect(getStatusEmoji('entrega')).toBe('🚚')
      expect(getStatusEmoji('entregue')).toBe('✅')
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
      expect(getStatusGradient('recebido')).toContain('from-')
      expect(getStatusGradient('producao')).toContain('from-')
      expect(getStatusGradient('entrega')).toContain('from-')
      expect(getStatusGradient('entregue')).toContain('from-')
    })

    it('returns fallback gradient for unknown', () => {
      expect(getStatusGradient('cancelado')).toBe('from-gray-500 to-gray-600')
    })
  })
})
