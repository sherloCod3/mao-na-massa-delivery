import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'default'
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

const variants = {
  danger: {
    icon: AlertTriangle,
    iconColor: 'text-red-500',
    iconBg: 'bg-red-50',
    confirmBg: 'bg-red-600 hover:bg-red-700',
    border: 'border-red-200',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-amber-500',
    iconBg: 'bg-amber-50',
    confirmBg: 'bg-amber-600 hover:bg-amber-700',
    border: 'border-amber-200',
  },
  default: {
    icon: AlertTriangle,
    iconColor: 'text-massa-500',
    iconBg: 'bg-massa-50',
    confirmBg: 'bg-massa-600 hover:bg-massa-700',
    border: 'border-massa-200',
  },
}

/**
 * ConfirmDialog — reusable confirmation modal that replaces native confirm().
 *
 * Usage:
 * ```tsx
 * const [showConfirm, setShowConfirm] = useState(false)
 *
 * <ConfirmDialog
 *   open={showConfirm}
 *   title="Desativar ingrediente?"
 *   message="Tem certeza que deseja desativar este ingrediente?"
 *   variant="danger"
 *   onConfirm={() => { doAction(); setShowConfirm(false) }}
 *   onCancel={() => setShowConfirm(false)}
 * />
 * ```
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'default',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  // Fechar com Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onCancel])

  if (!open) return null

  const v = variants[variant]
  const Icon = v.icon

  return (
    <div
      className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4"
      data-testid="confirm-overlay"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
        onClick={e => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
      >
        {/* Icon header */}
        <div className={`flex items-center gap-3 px-6 pt-6 pb-4 border-b ${v.border}`}>
          <div className={`w-10 h-10 rounded-xl ${v.iconBg} flex items-center justify-center shrink-0`}>
            <Icon className={`w-5 h-5 ${v.iconColor}`} />
          </div>
          <div>
            <h2 id="confirm-title" className="text-lg font-semibold text-primary">
              {title}
            </h2>
          </div>
        </div>

        {/* Message */}
        <div className="px-6 py-4">
          <p className="text-sm text-secondary leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 rounded-lg text-white font-medium text-sm transition-colors disabled:opacity-50 ${v.confirmBg}`}
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
            className="flex-1 py-2.5 rounded-lg text-secondary font-medium text-sm bg-gray-100 dark:bg-massa-100 hover:bg-gray-200 dark:hover:bg-massa-200 transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
