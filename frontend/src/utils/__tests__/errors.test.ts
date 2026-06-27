import { describe, it, expect } from 'vitest'
import {
  ApiError,
  parseApiError,
  friendlyMessage,
  tryCatch,
} from '../../utils/errors'

describe('utils/errors', () => {
  describe('ApiError', () => {
    it('creates an instance with all properties', () => {
      const err = new ApiError('Erro de teste', 'TEST_ERROR', 400, 'req-123', { field: 'nome' })

      expect(err).toBeInstanceOf(Error)
      expect(err).toBeInstanceOf(ApiError)
      expect(err.name).toBe('ApiError')
      expect(err.message).toBe('Erro de teste')
      expect(err.code).toBe('TEST_ERROR')
      expect(err.statusCode).toBe(400)
      expect(err.requestId).toBe('req-123')
      expect(err.details).toEqual({ field: 'nome' })
    })

    it('uses default statusCode when not provided', () => {
      const err = new ApiError('msg', 'CODE')
      expect(err.statusCode).toBe(400)
    })

    it('uses null for optional fields when not provided', () => {
      const err = new ApiError('msg', 'CODE')
      expect(err.requestId).toBeNull()
      expect(err.details).toBeNull()
    })

    it('userMessage getter returns the message', () => {
      const err = new ApiError('User-friendly message', 'CODE')
      expect(err.userMessage).toBe('User-friendly message')
    })
  })

  describe('parseApiError', () => {
    it('parses ApiError instance', () => {
      const apiErr = new ApiError('Ingrediente não encontrado', 'NOT_FOUND', 404, 'req-1')
      const parsed = parseApiError(apiErr)

      expect(parsed.message).toBe('Ingrediente não encontrado')
      expect(parsed.code).toBe('NOT_FOUND')
      expect(parsed.requestId).toBe('req-1')
      expect(parsed.raw).toBe(apiErr)
    })

    it('parses standard Error', () => {
      const err = new Error('Algo deu errado')
      const parsed = parseApiError(err)

      expect(parsed.message).toBe('Algo deu errado')
      expect(parsed.code).toBe('JS_ERROR')
      expect(parsed.requestId).toBeNull()
    })

    it('handles Error with empty message', () => {
      const err = new Error()
      const parsed = parseApiError(err)

      expect(parsed.message).toBe('Erro desconhecido')
      expect(parsed.code).toBe('JS_ERROR')
    })

    it('parses string error', () => {
      const parsed = parseApiError('Falha na conexão')

      expect(parsed.message).toBe('Falha na conexão')
      expect(parsed.code).toBe('STRING_ERROR')
      expect(parsed.requestId).toBeNull()
    })

    it('handles unknown error shape', () => {
      const parsed = parseApiError({ some: 'object' })

      expect(parsed.message).toBe('Erro inesperado')
      expect(parsed.code).toBe('UNKNOWN')
      expect(parsed.requestId).toBeNull()
    })

    it('handles null', () => {
      const parsed = parseApiError(null)

      expect(parsed.message).toBe('Erro inesperado')
      expect(parsed.code).toBe('UNKNOWN')
    })

    it('handles undefined', () => {
      const parsed = parseApiError(undefined)

      expect(parsed.message).toBe('Erro inesperado')
      expect(parsed.code).toBe('UNKNOWN')
    })
  })

  describe('friendlyMessage', () => {
    it('returns ApiError message for known errors', () => {
      const err = new ApiError('Estoque insuficiente', 'INSUFFICIENT_STOCK')
      expect(friendlyMessage(err)).toBe('Estoque insuficiente')
    })

    it('returns fallback for INTERNAL_ERROR code', () => {
      const err = new ApiError('Internal error', 'INTERNAL_ERROR')
      expect(friendlyMessage(err)).toBe('Erro ao executar operação')
    })

    it('returns parsed message for non-internal error codes', () => {
      // String errors (code STRING_ERROR) are not INTERNAL_ERROR, so message passes through
      expect(friendlyMessage('um erro qualquer')).toBe('um erro qualquer')
    })

    it('returns fallback when parsed message is empty', () => {
      const err = new ApiError('', 'INTERNAL_ERROR')
      expect(friendlyMessage(err)).toBe('Erro ao executar operação')
    })

    it('uses custom fallback message', () => {
      const err = new ApiError('INTERNAL_ERROR', 'INTERNAL_ERROR')
      expect(friendlyMessage(err, 'Falha ao salvar')).toBe('Falha ao salvar')
    })

    it('returns parsed message from standard Error', () => {
      const err = new Error('Network timeout')
      expect(friendlyMessage(err)).toBe('Network timeout')
    })
  })

  describe('tryCatch', () => {
    it('returns [data, null] on success', async () => {
      const fn = () => Promise.resolve(42)
      const [data, error] = await tryCatch(fn)

      expect(data).toBe(42)
      expect(error).toBeNull()
    })

    it('returns [null, ParsedError] on ApiError', async () => {
      const fn = () => Promise.reject(new ApiError('Not found', 'NOT_FOUND', 404))
      const [data, error] = await tryCatch(fn)

      expect(data).toBeNull()
      expect(error).not.toBeNull()
      expect(error!.message).toBe('Not found')
      expect(error!.code).toBe('NOT_FOUND')
    })

    it('returns [null, ParsedError] on standard Error', async () => {
      const fn = () => Promise.reject(new Error('Boom!'))
      const [data, error] = await tryCatch(fn)

      expect(data).toBeNull()
      expect(error!.message).toBe('Boom!')
      expect(error!.code).toBe('JS_ERROR')
    })

    it('returns [null, ParsedError] on string throw', async () => {
      const fn = () => Promise.reject('string error')
      const [data, error] = await tryCatch(fn)

      expect(data).toBeNull()
      expect(error!.message).toBe('string error')
      expect(error!.code).toBe('STRING_ERROR')
    })

    it('works with synchronous throw', async () => {
      const fn = () => { throw new Error('sync fail') }
      const [data, error] = await tryCatch(fn)

      expect(data).toBeNull()
      expect(error!.message).toBe('sync fail')
    })
  })
})
