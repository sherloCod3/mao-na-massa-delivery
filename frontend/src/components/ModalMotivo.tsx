import { useEffect, useState } from 'react'
import { AlertTriangle, PauseCircle, XCircle } from 'lucide-react'

interface ModalMotivoProps {
  open: boolean
  /** Título do modal, ex: "Pausar Pedido" */
  title: string
  /** Label do campo de texto */
  fieldLabel?: string
  /** Placeholder do textarea */
  placeholder?: string
  /** Texto do botão de confirmação */
  confirmLabel?: string
  /** Texto do botão de cancelar */
  cancelLabel?: string
  /** Ícone/emoji decorativo */
  icon?: 'pause' | 'cancel'
  /** Chamado com o motivo digitado */
  onConfirm: (motivo: string) => void
  /** Chamado ao cancelar */
  onCancel: () => void
  loading?: boolean
}

const iconMap = {
  pause: { Icon: PauseCircle, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200', confirmBg: 'bg-orange-600 hover:bg-orange-700' },
  cancel: { Icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200', confirmBg: 'bg-red-600 hover:bg-red-700' },
}

export default function ModalMotivo({
  open,
  title,
  fieldLabel = 'Motivo',
  placeholder = 'Descreva o motivo...',
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  icon = 'pause',
  onConfirm,
  onCancel,
  loading = false,
}: ModalMotivoProps) {
  const [motivo, setMotivo] = useState('')

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) setMotivo('')
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onCancel])

  if (!open) return null

  const v = iconMap[icon]
  const Icon = v.Icon

  const isValid = motivo.trim().length >= 3

  return (
    <div
      className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="motivo-title"
      >
        {/* Header */}
        <div className={`flex items-center gap-3 px-6 pt-6 pb-4 border-b ${v.border}`}>
          <div className={`w-10 h-10 rounded-xl ${v.bg} flex items-center justify-center shrink-0`}>
            <Icon className={`w-5 h-5 ${v.color}`} />
          </div>
          <h2 id="motivo-title" className="text-lg font-semibold text-primary">
            {title}
          </h2>
        </div>

        {/* Body com textarea */}
        <div className="px-6 py-4 space-y-3">
          <label htmlFor="motivo-textarea" className="block text-sm font-medium text-gray-700">
            {fieldLabel}
          </label>
          <textarea
            id="motivo-textarea"
            value={motivo}
            onChange={e => setMotivo(e.target.value)}
            placeholder={placeholder}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none outline-none focus:ring-2 focus:ring-massa-500/20 focus:border-massa-500 transition-colors"
            autoFocus
          />
          {motivo.length > 0 && motivo.trim().length < 3 && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Mínimo de 3 caracteres
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={() => onConfirm(motivo.trim())}
            disabled={!isValid || loading}
            className={`flex-1 py-2.5 rounded-lg text-white font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${v.confirmBg}`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {confirmLabel}
              </span>
            ) : (
              confirmLabel
            )}
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg text-secondary font-medium text-sm bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
