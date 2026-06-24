import { type ReactNode } from 'react'
import { Clock, Inbox, AlertTriangle, RefreshCw } from 'lucide-react'

// ─── Loading Spinner ─────────────────────────────────────────────

interface LoadingProps {
  height?: string
  message?: string
}

export function Loading({ height = 'h-64', message = 'Carregando...' }: LoadingProps) {
  return (
    <div className={`flex items-center justify-center ${height}`}>
      <div className="text-center">
        <Clock className="w-8 h-8 text-massa-300 animate-spin mx-auto mb-2" />
        <p className="text-sm text-gray-400 animate-pulse">{message}</p>
      </div>
    </div>
  )
}

// ─── Empty State ─────────────────────────────────────────────────

interface EmptyProps {
  icon?: ReactNode
  title?: string
  message?: string
  action?: ReactNode
}

export function Empty({
  icon,
  title = 'Nenhum registro encontrado',
  message = '',
  action,
}: EmptyProps) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="text-center max-w-sm">
        <div className="mx-auto mb-4 text-gray-300">
          {icon || <Inbox className="w-12 h-12 mx-auto opacity-50" />}
        </div>
        <p className="text-base font-medium text-gray-500">{title}</p>
        {message && <p className="text-sm text-gray-400 mt-1">{message}</p>}
        {action && <div className="mt-4">{action}</div>}
      </div>
    </div>
  )
}

// ─── Error State ─────────────────────────────────────────────────

interface ErrorStateProps {
  message?: string
  detail?: string
  onRetry?: () => void
}

export function ErrorState({
  message = 'Erro ao carregar dados',
  detail,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="text-center max-w-sm">
        <div className="mx-auto w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <AlertTriangle className="w-7 h-7 text-red-500" />
        </div>
        <p className="text-base font-medium text-red-700">{message}</p>
        {detail && <p className="text-sm text-red-500 mt-1">{detail}</p>}
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-4 inline-flex items-center gap-2 bg-massa-600 text-white px-5 py-2.5 rounded-lg hover:bg-massa-700 transition-colors text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Tentar novamente
          </button>
        )}
      </div>
    </div>
  )
}
