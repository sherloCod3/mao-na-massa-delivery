import { useEffect, useState } from 'react'
import {
  MessageCircle, CheckCircle, XCircle, Star, Trash2, RefreshCw,
} from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import ConfirmDialog from '../../components/ConfirmDialog'
import { adminTestimonialsApi, type TestimonialAdmin } from '../../api/client'
import { useToast } from '../../components/Toast'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pendente: { label: 'Pendente', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  aprovado: { label: 'Aprovado', color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  rejeitado: { label: 'Rejeitado', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
}

type FilterTab = 'pendente' | 'aprovado' | 'rejeitado' | 'todos'

export default function Depoimentos() {
  const [depoimentos, setDepoimentos] = useState<TestimonialAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterTab>('pendente')
  const [actionId, setActionId] = useState<number | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const { toast } = useToast()

  const load = async () => {
    setLoading(true)
    try {
      const status = filter === 'todos' ? undefined : filter
      const data = await adminTestimonialsApi.listar(status)
      setDepoimentos(data)
    } catch {
      toast('error', 'Erro ao carregar depoimentos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [filter])

  const updateStatus = async (id: number, status: string) => {
    setActionId(id)
    try {
      await adminTestimonialsApi.atualizar(id, { status })
      toast('success', `Depoimento ${status === 'aprovado' ? 'aprovado' : status === 'rejeitado' ? 'rejeitado' : 'atualizado'}!`)
      await load()
    } catch {
      toast('error', 'Erro ao atualizar')
    } finally {
      setActionId(null)
    }
  }

  const toggleDestaque = async (id: number, destaque: boolean) => {
    setActionId(id)
    try {
      await adminTestimonialsApi.atualizar(id, { destaque: !destaque })
      toast('success', destaque ? 'Destaque removido' : 'Destacado!')
      await load()
    } catch {
      toast('error', 'Erro ao atualizar')
    } finally {
      setActionId(null)
    }
  }

  const remove = (id: number) => {
    setConfirmDelete(id)
  }

  const executeRemove = async () => {
    if (!confirmDelete) return
    setActionId(confirmDelete)
    try {
      await adminTestimonialsApi.deletar(confirmDelete)
      toast('success', 'Depoimento removido!')
      setConfirmDelete(null)
      await load()
    } catch {
      toast('error', 'Erro ao remover')
    } finally {
      setActionId(null)
    }
  }

  const tabs: { id: FilterTab; label: string }[] = [
    { id: 'pendente', label: 'Pendentes' },
    { id: 'aprovado', label: 'Aprovados' },
    { id: 'rejeitado', label: 'Rejeitados' },
    { id: 'todos', label: 'Todos' },
  ]

  return (
    <div>
      <PageHeader
        title="Depoimentos"
        icon={<MessageCircle className="w-6 h-6" />}
        action={
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 text-sm text-secondary hover:text-primary bg-white border rounded-lg px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-massa-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        }
      />

      {/* Tabs de filtro */}
      <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 border shadow-sm overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === t.id
                ? 'bg-massa-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {t.label}
            {t.id === 'pendente' && depoimentos.length > 0 && (
              <span className="ml-1.5 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                {depoimentos.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-full mb-2" />
              <div className="h-3 bg-gray-100 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : depoimentos.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium">Nenhum depoimento {filter === 'pendente' ? 'pendente' : ''}</p>
          <p className="text-sm">Quando clientes enviarem depoimentos, eles aparecerão aqui.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {depoimentos.map(d => {
            const sc = STATUS_CONFIG[d.status] || STATUS_CONFIG.pendente
            return (
              <div
                key={d.id}
                className={`card p-5 border-l-4 ${
                  d.status === 'aprovado' ? 'border-l-green-500'
                    : d.status === 'rejeitado' ? 'border-l-red-500'
                    : 'border-l-amber-500'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-full bg-massa-100 dark:bg-massa-800 flex items-center justify-center text-sm font-bold text-massa-600 shrink-0">
                        {d.cliente_nome.charAt(0).toUpperCase()}
                      </div>
                      <div>                         <p className="text-sm font-semibold text-primary">{d.cliente_nome}</p>
                        <div className="flex items-center gap-2">
                          {/* Stars */}
                          {d.nota && (
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${i < d.nota! ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`}
                                />
                              ))}
                            </div>
                          )}
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${sc.color} ${sc.bg}`}>
                            {sc.label}
                          </span>
                          {d.destaque && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-200">
                              ★ Destaque
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Texto */}
                    <p className="text-sm text-gray-600 leading-relaxed italic mb-2">
                      "{d.texto}"
                    </p>

                    {/* Data */}
                    <p className="text-[11px] text-gray-400">
                      {new Date(d.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-start gap-1 shrink-0">
                    {d.status === 'pendente' && (
                      <>
                        <button
                          onClick={() => updateStatus(d.id, 'aprovado')}
                          disabled={actionId === d.id}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Aprovar"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => updateStatus(d.id, 'rejeitado')}
                          disabled={actionId === d.id}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Rejeitar"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    {d.status === 'aprovado' && (
                      <>
                        <button
                          onClick={() => toggleDestaque(d.id, d.destaque)}
                          disabled={actionId === d.id}
                          className={`p-2 rounded-lg transition-colors ${
                            d.destaque
                              ? 'text-blue-600 hover:bg-blue-50'
                              : 'text-gray-300 hover:text-blue-600 hover:bg-blue-50'
                          }`}
                          title={d.destaque ? 'Remover destaque' : 'Destacar'}
                        >
                          <Star className={`w-5 h-5 ${d.destaque ? 'fill-blue-500' : ''}`} />
                        </button>
                        <button
                          onClick={() => updateStatus(d.id, 'pendente')}
                          disabled={actionId === d.id}
                          className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Mover para pendente"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => remove(d.id)}
                      disabled={actionId === d.id}
                      className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remover"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmDelete !== null}
        title="Remover depoimento?"
        message="Tem certeza que deseja remover este depoimento? Esta ação não pode ser desfeita."
        variant="danger"
        confirmLabel="Remover"
        onConfirm={executeRemove}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}
