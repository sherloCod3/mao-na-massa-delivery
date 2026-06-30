import { useEffect, useState } from 'react'
import { Settings, Save, Plus, Trash2 } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import ConfirmDialog from '../../components/ConfirmDialog'
import { adminSiteConfigApi, type SiteConfigAdmin } from '../../api/client'
import { useToast } from '../../components/Toast'

const GRUPOS: Record<string, { label: string; desc: string }> = {
  hero: { label: 'Hero', desc: 'Título, subtítulo e CTA da landing page' },
  about: { label: 'Sobre', desc: 'História e conteúdo da seção "Nossa História"' },
  contato: { label: 'Contato', desc: 'WhatsApp, telefone, endereço e horários' },
  delivery: { label: 'Delivery', desc: 'Taxa de entrega e raio de atendimento' },
  redes: { label: 'Redes Sociais', desc: 'Links e perfis sociais' },
  geral: { label: 'Geral', desc: 'Outras configurações' },
}

const GRUPOS_ORDER = ['hero', 'about', 'contato', 'delivery', 'redes', 'geral']

export default function Configuracao() {
  const [configs, setConfigs] = useState<SiteConfigAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Record<number, string>>({})
  const [savingId, setSavingId] = useState<number | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [showNewForm, setShowNewForm] = useState<string | null>(null)
  const [newConfig, setNewConfig] = useState({ chave: '', valor: '', tipo: 'text', grupo: 'geral' })
  const { toast } = useToast()

  const load = async () => {
    setLoading(true)
    try {
      const data = await adminSiteConfigApi.listar()
      setConfigs(data)
    } catch {
      toast('error', 'Erro ao carregar configurações')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const save = async (id: number, chave: string) => {
    const valor = editing[id]
    if (valor === undefined) return
    setSavingId(id)
    try {
      await adminSiteConfigApi.atualizar(chave, { valor })
      toast('success', 'Configuração atualizada!')
      setEditing(prev => { const next = { ...prev }; delete next[id]; return next })
      await load()
    } catch {
      toast('error', 'Erro ao salvar')
    } finally {
      setSavingId(null)
    }
  }

  const create = async () => {
    if (!newConfig.chave.trim()) return
    try {
      await adminSiteConfigApi.criar(newConfig)
      toast('success', 'Configuração criada!')
      setNewConfig({ chave: '', valor: '', tipo: 'text', grupo: 'geral' })
      setShowNewForm(null)
      await load()
    } catch {
      toast('error', 'Erro ao criar configuração')
    }
  }

  const remove = (chave: string) => {
    setConfirmDelete(chave)
  }

  const executeRemove = async () => {
    if (!confirmDelete) return
    try {
      await adminSiteConfigApi.deletar(confirmDelete)
      toast('success', 'Configuração removida!')
      setConfirmDelete(null)
      await load()
    } catch {
      toast('error', 'Erro ao remover')
      setConfirmDelete(null)
    }
  }

  const grouped = GRUPOS_ORDER.map(g => ({
    grupo: g,
    label: GRUPOS[g]?.label || g,
    desc: GRUPOS[g]?.desc || '',
    itens: configs.filter(c => c.grupo === g),
  })).filter(g => g.itens.length > 0 || g.grupo === 'hero' || g.grupo === 'contato')

  return (
    <div>
      <PageHeader
        title="Configuração do Site"
        icon={<Settings className="w-6 h-6" />}
      />

      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4" />
              <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
              <div className="h-10 bg-gray-100 rounded w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(g => (
            <div key={g.grupo} className="card p-6">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-lg font-semibold text-primary" style={{ fontFamily: 'var(--font-serif)' }}>
                  {g.label}
                </h2>
                <button
                  onClick={() => {
                    setNewConfig({ chave: '', valor: '', tipo: 'text', grupo: g.grupo })
                    setShowNewForm(showNewForm === g.grupo ? null : g.grupo)
                  }}
                  className="flex items-center gap-1 text-sm text-massa-600 hover:text-massa-800 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Novo
                </button>
              </div>
              <p className="text-xs text-gray-500 mb-4">{g.desc}</p>

              {/* New config form */}
              {showNewForm === g.grupo && (
                <div className="bg-massa-50 rounded-xl p-4 mb-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Chave</label>
                      <input
                        type="text"
                        value={newConfig.chave}
                        onChange={e => setNewConfig({ ...newConfig, chave: e.target.value, grupo: g.grupo })}
                        placeholder="ex: hero_title"
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-massa-500/20 focus:border-massa-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
                      <select
                        value={newConfig.tipo}
                        onChange={e => setNewConfig({ ...newConfig, tipo: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-massa-500/20 focus:border-massa-500 outline-none"
                      >
                        <option value="text">Texto</option>
                        <option value="url">URL</option>
                        <option value="image">Imagem</option>
                        <option value="json">JSON</option>
                      </select>
                    </div>
                    <div className="flex items-end gap-2">
                      <button
                        onClick={create}
                        disabled={!newConfig.chave.trim()}
                        className="flex-1 bg-massa-600 text-white px-4 py-2 rounded-lg hover:bg-massa-700 text-sm disabled:opacity-50 transition-colors"
                      >
                        Criar
                      </button>
                      <button
                        onClick={() => setShowNewForm(null)}
                        className="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {g.itens.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  Nenhuma configuração neste grupo ainda.
                </p>
              ) : (
                <div className="space-y-3">
                  {g.itens.map(item => (
                    <div key={item.id} className="group">
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        {item.chave}
                        <span className="ml-2 text-[10px] text-gray-400 uppercase">({item.tipo})</span>
                      </label>
                      <div className="flex items-center gap-2">
                        {item.tipo === 'url' || item.tipo === 'image' ? (
                          <input
                            type="text"
                            defaultValue={item.valor}
                            onBlur={e => setEditing(prev => ({ ...prev, [item.id]: e.target.value }))}
                            placeholder={`https://...`}
                            className="flex-1 px-3 py-2 border rounded-lg text-sm font-mono focus:ring-2 focus:ring-massa-500/20 focus:border-massa-500 outline-none"
                          />
                        ) : item.tipo === 'json' ? (
                          <textarea
                            defaultValue={item.valor}
                            onBlur={e => setEditing(prev => ({ ...prev, [item.id]: e.target.value }))}
                            rows={2}
                            className="flex-1 px-3 py-2 border rounded-lg text-sm font-mono focus:ring-2 focus:ring-massa-500/20 focus:border-massa-500 outline-none resize-none"
                          />
                        ) : (
                          <input
                            type="text"
                            defaultValue={item.valor}
                            onBlur={e => setEditing(prev => ({ ...prev, [item.id]: e.target.value }))}
                            placeholder="Valor..."
                            className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-massa-500/20 focus:border-massa-500 outline-none"
                          />
                        )}
                        {editing[item.id] !== undefined && (
                          <button
                            onClick={() => save(item.id, item.chave)}
                            disabled={savingId === item.id}
                            className="flex items-center gap-1 bg-massa-500 text-white px-3 py-2 rounded-lg hover:bg-massa-600 text-sm disabled:opacity-50 transition-colors"
                          >
                            {savingId === item.id ? (
                              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => remove(item.chave)}
                          className="p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          title="Remover"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmDelete !== null}
        title="Remover configuração?"
        message={confirmDelete ? `Tem certeza que deseja remover "${confirmDelete}"? Esta ação não pode ser desfeita.` : ''}
        variant="danger"
        confirmLabel="Remover"
        onConfirm={executeRemove}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}
