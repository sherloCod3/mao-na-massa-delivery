import { describe, it, expect, vi, beforeEach } from 'vitest'
import { exportCSV } from '../../utils/csv'

describe('utils/csv', () => {
  let capturedAnchor: { href: string; download: string; click: ReturnType<typeof vi.fn> } | null = null

  beforeEach(() => {
    capturedAnchor = null
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') {
        const anchor = { href: '', download: '', click: vi.fn() }
        capturedAnchor = anchor
        return anchor as unknown as HTMLElement
      }
      return document.createElement(tag)
    })
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('creates a download link with correct filename and blob URL', () => {
    exportCSV('relatorio', ['Nome', 'Preço'], [['Coxinha', '5,00']])

    expect(capturedAnchor).not.toBeNull()
    expect(capturedAnchor!.download).toBe('relatorio.csv')
    expect(capturedAnchor!.href).toBe('blob:mock-url')
  })

  it('triggers click on the anchor', () => {
    exportCSV('teste', ['A'], [['1']])
    expect(capturedAnchor!.click).toHaveBeenCalledOnce()
  })

  it('generates CSV content with correct headers and cells', () => {
    exportCSV('f', ['Nome', 'Preço'], [['Coxinha', '5,00']])

    expect(URL.createObjectURL).toHaveBeenCalledOnce()
    const blobArg = (URL.createObjectURL as ReturnType<typeof vi.fn>).mock.calls[0][0] as Blob

    expect(blobArg.type).toBe('text/csv;charset=utf-8;')

    return blobArg.text().then((text) => {
      // BOM (U+FEFF) may be stripped by TextDecoder in jsdom — just verify content
      expect(text).toContain('Nome,Preço')
      expect(text).toContain('"Coxinha","5,00"')
    })
  })

  it('escapes double quotes in cell values', () => {
    exportCSV('f', ['Nome'], [['Coxinha "Frango"']])

    const blobArg = (URL.createObjectURL as ReturnType<typeof vi.fn>).mock.calls[0][0] as Blob
    return blobArg.text().then((text) => {
      expect(text).toContain('"Coxinha ""Frango"""')
    })
  })

  it('handles multiple rows', () => {
    exportCSV('f', ['Item', 'Qtd'], [['Coxinha', '10'], ['Pastel', '5'], ['Kibe', '8']])

    const blobArg = (URL.createObjectURL as ReturnType<typeof vi.fn>).mock.calls[0][0] as Blob
    return blobArg.text().then((text) => {
      const lines = text.split('\n')
      expect(lines).toHaveLength(4) // BOM+header + 3 rows
      expect(lines[1]).toContain('Coxinha')
      expect(lines[2]).toContain('Pastel')
      expect(lines[3]).toContain('Kibe')
    })
  })

  it('revokes the object URL after click', () => {
    exportCSV('f', ['A'], [['1']])
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
  })
})
