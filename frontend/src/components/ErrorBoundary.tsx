import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, info: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * ErrorBoundary — catches render errors and shows a friendly fallback UI.
 *
 * Keeps the rest of the app functional even when one section crashes.
 * Logs errors to console (in production, would send to monitoring service).
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary] Captured:', error, info)
    this.props.onError?.(error, info)
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex items-center justify-center p-12">
          <div className="text-center max-w-sm">
            <div className="mx-auto w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
            <h2 className="text-lg font-semibold text-primary mb-1">
              Erro inesperado
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Algo deu errado ao carregar esta seção. Tente recarregar.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={this.handleRetry}
                className="flex items-center gap-2 bg-massa-600 text-white px-5 py-2.5 rounded-lg hover:bg-massa-700 transition-colors text-sm font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                Tentar novamente
              </button>
              <button
                onClick={() => window.location.reload()}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Recarregar página
              </button>
            </div>
            {/* Dev details — only shown in dev mode via import.meta.env */}
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
                  Detalhes técnicos
                </summary>
                <pre className="mt-2 text-xs bg-gray-50 p-3 rounded-lg overflow-auto max-h-40 text-red-700">
                  {this.state.error.message}
                  {'\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
