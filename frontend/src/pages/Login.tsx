import { useState, type FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { CookingPot, Eye, EyeOff, LogIn } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { ApiError } from '../utils/errors'

const API_BASE = import.meta.env.VITE_API_URL ?? '/api/v1'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Redireciona para a página que o usuário tentou acessar antes do login
  const from = (location.state as { from?: string })?.from ?? '/admin'

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new ApiError(
          body?.error?.message || body?.detail || 'Senha inválida',
          'AUTH_ERROR',
          res.status,
        )
      }

      const data = await res.json()
      login(data.token)
      navigate(from, { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError(err instanceof Error ? err.message : 'Erro ao conectar ao servidor')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-massa-800 via-massa-900 to-orange-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm mb-4">
            <CookingPot className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-serif)' }}>
            Mão na Massa
          </h1>
          <p className="text-massa-300 mt-1 text-sm">Painel administrativo</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-massa-800 rounded-2xl shadow-xl p-6 space-y-5">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 text-center">
            Acessar painel
          </h2>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-lg px-4 py-3" role="alert">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Senha de admin
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Digite a senha"
                autoFocus
                disabled={loading}
                className="w-full px-4 py-2.5 pr-10 rounded-lg border border-gray-300 dark:border-massa-600 bg-white dark:bg-massa-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-massa-500 focus:border-transparent disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="w-full flex items-center justify-center gap-2 bg-massa-600 hover:bg-massa-700 disabled:bg-massa-400 text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {/* Link para landing */}
        <p className="text-center mt-6">
          <a href="/" className="text-massa-300 hover:text-white text-sm underline underline-offset-2 transition-colors">
            ← Voltar ao site
          </a>
        </p>
      </div>
    </div>
  )
}
