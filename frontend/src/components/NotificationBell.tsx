import { useEffect, useRef, useState, useCallback } from 'react'
import { Bell, BellRing, X, CheckCheck, Loader2 } from 'lucide-react'
import { notificacoesApi, type Notificacao } from '../api/client'

const POLL_INTERVAL = 15_000 // 15s

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [total, setTotal] = useState(0)
  const [lendo, setLendo] = useState<Set<number>>(new Set())
  const dropdownRef = useRef<HTMLDivElement>(null)

  const carregar = useCallback(async () => {
    try {
      const res = await notificacoesApi.listar(true)
      setNotificacoes(res.notificacoes)
      setTotal(res.total)
    } catch {
      // silencioso — falha de polling não deve incomodar
    }
  }, [])

  // Polling automático
  useEffect(() => {
    carregar()
    const id = setInterval(carregar, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [carregar])

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const marcarLida = async (id: number) => {
    try {
      setLendo(prev => new Set(prev).add(id))
      await notificacoesApi.marcarLida(id)
      setNotificacoes(prev => prev.filter(n => n.id !== id))
      setTotal(prev => Math.max(0, prev - 1))
    } catch {
      // silencioso
    } finally {
      setLendo(prev => { const next = new Set(prev); next.delete(id); return next })
    }
  }

  const marcarTodas = async () => {
    try {
      await notificacoesApi.marcarTodasLidas()
      setNotificacoes([])
      setTotal(0)
    } catch {
      // silencioso
    }
  }

  const tipoIcone = (tipo: string) => {
    switch (tipo) {
      case 'novo_pedido': return '🆕'
      case 'status_pedido': return '📌'
      case 'estoque_baixo': return '⚠️'
      default: return '📢'
    }
  }

  const formatarData = (iso: string) => {
    const d = new Date(iso)
    const agora = new Date()
    const diff = agora.getTime() - d.getTime()
    if (diff < 60_000) return 'agora'
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}min`
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-massa-200 hover:bg-massa-700/50 hover:text-white transition-colors"
        title="Notificações"
      >
        {total > 0 ? (
          <>
            <BellRing className="w-5 h-5 animate-pulse" />
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-lg">
              {total > 99 ? '99+' : total}
            </span>
          </>
        ) : (
          <Bell className="w-5 h-5" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800">Notificações</h3>
            {notificacoes.length > 0 && (
              <button
                onClick={marcarTodas}
                className="flex items-center gap-1 text-xs text-massa-600 hover:text-massa-700 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Marcar todas
              </button>
            )}
          </div>

          {/* Lista */}
          <div className="max-h-80 overflow-y-auto">
            {notificacoes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <Bell className="w-8 h-8 mb-2" />
                <p className="text-sm">Nenhuma notificação</p>
              </div>
            ) : (
              notificacoes.map((n) => (
                <div
                  key={n.id}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group border-b border-gray-50 last:border-0"
                >
                  <span className="text-lg mt-0.5 shrink-0">{tipoIcone(n.tipo)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{n.titulo}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.mensagem.replace(/<[^>]*>/g, '')}</p>
                    <p className="text-[11px] text-gray-400 mt-1">{formatarData(n.created_at)}</p>
                  </div>
                  <button
                    onClick={() => marcarLida(n.id)}
                    disabled={lendo.has(n.id)}
                    className="shrink-0 p-1 rounded-md text-gray-300 hover:text-gray-600 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-all"
                    title="Descartar"
                  >
                    {lendo.has(n.id) ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <X className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
