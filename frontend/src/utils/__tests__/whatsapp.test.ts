import { describe, it, expect } from 'vitest'
import { gerarLinkWhatsApp, mensagemNovoPedido, mensagemStatusPedido } from '../../utils/whatsapp'

describe('utils/whatsapp', () => {
  describe('gerarLinkWhatsApp()', () => {
    it('generates valid wa.me link with DDI 55', () => {
      const link = gerarLinkWhatsApp('11999999999', 'Olá!')
      expect(link).toContain('wa.me/5511999999999')
      expect(link).toContain('text=' + encodeURIComponent('Olá!'))
    })

    it('adds DDI 55 when not present', () => {
      const link = gerarLinkWhatsApp('11999999999', 'teste')
      expect(link).toContain('wa.me/5511999999999')
    })

    it('does not duplicate DDI 55', () => {
      const link = gerarLinkWhatsApp('5511999999999', 'teste')
      // Should have only one "55" prefix
      const match = link?.match(/wa\.me\/(\d+)/)
      expect(match?.[1]).toBe('5511999999999')
    })

    it('returns null for empty number', () => {
      expect(gerarLinkWhatsApp('', 'msg')).toBeNull()
    })

    it('handles undefined message gracefully', () => {
      const link = gerarLinkWhatsApp('11999999999', undefined as unknown as string)
      expect(link).not.toBeNull()
    })
  })

  describe('mensagemNovoPedido()', () => {
    it('includes order number and name', () => {
      const msg = mensagemNovoPedido('João', 42, 59.90)
      expect(msg).toContain('João')
      expect(msg).toContain('#42')
      expect(msg).toContain('59.90')
    })
  })

  describe('mensagemStatusPedido()', () => {
    it('includes client name, order number, and status', () => {
      const msg = mensagemStatusPedido('Maria', 10, 'entrega', 45.00, 'https://track.example.com/abc')
      expect(msg).toContain('Maria')
      expect(msg).toContain('#10')
      expect(msg).toContain('*Entrega*')
    })

    it('includes tracking URL when provided', () => {
      const url = 'https://track.example.com/abc123'
      const msg = mensagemStatusPedido('Maria', 10, 'producao', 45.00, url)
      expect(msg).toContain(url)
    })

    it('does not include tracking URL when omitted', () => {
      const msg = mensagemStatusPedido('João', 5, 'entregue', 30.00)
      expect(msg).not.toContain('track.example.com')
    })
  })
})
