import DOMPurify from 'dompurify'
import { useEffect, useState } from 'react'
import {
  CookingPot, Star, ChevronDown, ShoppingBag, MessageCircle,
  Camera, Clock, Truck, MapPin, Send, CheckCircle,
  ArrowRight, Quote,
} from 'lucide-react'
import { publicoApi, produtosApi, type Produto, type SiteConfigItem, type TestimonialPublic } from '../api/client'

// ─── Helpers ──────────────────────────────────────────────────

function getConfig(configs: SiteConfigItem[], chave: string, fallback = ''): string {
  return configs.find(c => c.chave === chave)?.valor || fallback
}

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

// ─── Componente principal ─────────────────────────────────────

export default function Landing() {
  const [configs, setConfigs] = useState<SiteConfigItem[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [testimonials, setTestimonials] = useState<TestimonialPublic[]>([])
  const [loading, setLoading] = useState(true)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    // Cada chamada é isolada — uma falha não derruba as outras
    Promise.all([
      publicoApi.siteConfig().catch(() => [] as SiteConfigItem[]),
      produtosApi.listar().catch(() => [] as Produto[]),
      publicoApi.testimonials().catch(() => [] as TestimonialPublic[]),
    ]).then(([c, p, t]) => {
      setConfigs(c)
      setProdutos(p)
      setTestimonials(t)
    }).finally(() => setLoading(false))
  }, [])

  // Navbar scroll effect
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const whatsapp = getConfig(configs, 'contato_whatsapp')
  const telefone = getConfig(configs, 'contato_telefone', whatsapp)
  const endereco = getConfig(configs, 'contato_endereco')
  const horario = getConfig(configs, 'contato_horario', 'Seg-Sex: 8h-18h | Sáb: 8h-12h')
  const instagram = getConfig(configs, 'redes_instagram')
  const taxaEntrega = getConfig(configs, 'delivery_taxa')
  const raioEntrega = getConfig(configs, 'delivery_raio')

  const heroTitle = getConfig(configs, 'hero_title', 'Salgados & Doces Artesanais')
  const heroSubtitle = getConfig(configs, 'hero_subtitle', 'Feitos com ingredientes selecionados e muito carinho para tornar seu dia mais saboroso')
  const heroCta = getConfig(configs, 'hero_cta_text', 'Faça seu Pedido')
  const aboutTitle = getConfig(configs, 'about_title', 'Nossa História')
  const aboutContent = getConfig(configs, 'about_content', 'Tudo começou na cozinha de casa, com a vontade de transformar receitas de família em momentos especiais. Hoje, levo todo esse carinho até você.')

  return (
    <div className="min-h-screen bg-[var(--bg-body)]">
      {/* ─── Navbar ─── */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 dark:bg-[#1a1412]/90 backdrop-blur-md shadow-sm'
          : 'bg-transparent'
      }`}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => scrollTo('hero')} className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-massa-500 flex items-center justify-center group-hover:bg-massa-600 transition-colors">
              <CookingPot className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg" style={{ fontFamily: 'var(--font-serif)' }}>
              Mão na <span className="text-massa-500">Massa</span>
            </span>
          </button>

          <div className="hidden md:flex items-center gap-6">
            {[
              { label: 'Produtos', target: 'produtos' },
              { label: 'Depoimentos', target: 'testimonials' },
              { label: 'Contato', target: 'contato' },
            ].map(item => (
              <button
                key={item.target}
                onClick={() => scrollTo(item.target)}
                className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-massa-600 dark:hover:text-massa-400 transition-colors"
              >
                {item.label}
              </button>
            ))}
            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-massa-500 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-massa-600 transition-all hover:shadow-lg hover:shadow-massa-500/20"
              >
                <MessageCircle className="w-4 h-4" />
                Pedir pelo WhatsApp
              </a>
            )}
          </div>

          {/* Mobile menu button */}
          <a
            href={`https://wa.me/${whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="md:hidden flex items-center gap-2 bg-massa-500 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-massa-600 transition-colors shadow-lg shadow-massa-500/20"
          >
            <MessageCircle className="w-4 h-4" />
            Pedir
          </a>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section id="hero" className="relative min-h-dvh flex items-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-massa-50 via-white to-creme-100 dark:from-[#1a1210] dark:via-[#0f0b09] dark:to-[#1a1412]" />

        {/* Decorative circles */}
        <div className="absolute top-1/4 -right-24 w-96 h-96 rounded-full bg-massa-200/20 dark:bg-massa-800/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-[30rem] h-[30rem] rounded-full bg-massa-300/15 dark:bg-massa-700/10 blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 py-32 md:py-40">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-massa-100 dark:bg-massa-800/50 text-massa-700 dark:text-massa-300 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <CookingPot className="w-4 h-4" />
              <span>Artesanal • Fresco • Feito com Amor</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] mb-6"
              style={{ fontFamily: 'var(--font-serif)' }}>
              {heroTitle}
            </h1>

            <p className="text-lg sm:text-xl text-secondary mb-8 max-w-xl leading-relaxed">
              {heroSubtitle}
            </p>

            <div className="flex flex-wrap items-center gap-4">
              {whatsapp && (
                <a
                  href={`https://wa.me/${whatsapp}?text=Olá! Gostaria de fazer um pedido.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 bg-massa-500 text-white px-6 py-3 rounded-full text-base font-medium hover:bg-massa-600 transition-all hover:shadow-xl hover:shadow-massa-500/25 active:scale-[0.98]"
                >
                  {heroCta}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </a>
              )}
              <button
                onClick={() => scrollTo('produtos')}
                className="flex items-center gap-2 px-6 py-3 rounded-full text-base font-medium text-gray-600 dark:text-gray-400 hover:text-massa-600 dark:hover:text-massa-400 border border-gray-200 dark:border-gray-700 hover:border-massa-300 dark:hover:border-massa-600 transition-all"
              >
                Ver Produtos
              </button>
            </div>

            {/* Stats */}
            {produtos.length > 0 && (
              <div className="flex items-center gap-8 mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
                <div>
                  <p className="text-2xl font-bold text-primary">{produtos.length}</p>
                  <p className="text-sm text-muted">Produtos</p>
                </div>
                {testimonials.length > 0 && (
                  <>
                    <div className="w-px h-10 bg-gray-200 dark:bg-gray-800" />
                    <div>
                      <p className="text-2xl font-bold text-primary">{testimonials.length}</p>
                      <p className="text-sm text-muted">Depoimentos</p>
                    </div>
                  </>
                )}
                {raioEntrega && (
                  <>
                    <div className="w-px h-10 bg-gray-200 dark:bg-gray-800" />
                    <div className="flex items-center gap-2">
                      <Truck className="w-5 h-5 text-massa-500" />
                      <div>
                        <p className="text-sm font-medium text-primary">{raioEntrega}</p>
                        <p className="text-xs text-muted">{taxaEntrega || 'Delivery'}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Scroll indicator */}
        <button
          onClick={() => scrollTo('produtos')}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-gray-400 hover:text-massa-500 transition-colors animate-bounce"
          aria-label="Rolar para conhecer os produtos"
        >
          <span className="text-xs font-medium">Conheça</span>
          <ChevronDown className="w-5 h-5" />
        </button>
      </section>

      {/* ─── Produtos ─── */}
      <section id="produtos" className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: 'var(--font-serif)' }}>
              Nossos Produtos
            </h2>
            <p className="text-muted max-w-lg mx-auto">
              Cada receita é preparada com ingredientes selecionados e aquele toque especial que só o artesanal tem
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white dark:bg-[#1a1412] rounded-2xl p-6 animate-pulse">
                  <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-2/3 mb-3" />
                  <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-full mb-2" />
                  <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : produtos.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Em breve novos produtos!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {produtos.filter(p => p.ativo).map((produto, idx) => (
                <div
                  key={produto.id}
                  className="group bg-white dark:bg-[#1a1412] rounded-2xl p-6 border border-gray-100 dark:border-gray-800 hover:border-massa-200 dark:hover:border-massa-700 transition-all duration-300 hover:shadow-xl hover:shadow-massa-500/5 hover:-translate-y-1"
                  style={{ animation: `fadeInUp 0.5s ease-out both ${idx * 80}ms` }}
                >
                  <div className="w-12 h-12 rounded-xl bg-massa-50 dark:bg-massa-800/50 flex items-center justify-center mb-4 group-hover:bg-massa-100 dark:group-hover:bg-massa-800 transition-colors">
                    <CookingPot className="w-6 h-6 text-massa-500" />
                  </div>
                  <h3 className="text-xl font-bold text-primary mb-2" style={{ fontFamily: 'var(--font-serif)' }}>
                    {produto.nome}
                  </h3>
                  {produto.descricao && (
                    <p className="text-sm text-muted mb-4 line-clamp-2">
                      {produto.descricao}
                    </p>
                  )}
                  {produto.variacoes && produto.variacoes.length > 0 && (
                    <div className="space-y-2">
                      {produto.variacoes.filter(v => v.ativo).slice(0, 3).map(v => (
                        <div key={v.id} className="flex items-center justify-between py-1.5">
                          <span className="text-sm text-secondary">{v.nome}</span>
                          <span className="text-sm font-bold text-massa-600 dark:text-massa-400">
                            {v.preco_venda
                              ? `R$ ${v.preco_venda.toFixed(2)}`
                              : `R$ ${v.preco_sugerido.toFixed(2)}`
                            }
                          </span>
                        </div>
                      ))}
                      {produto.variacoes.length > 3 && (
                        <p className="text-xs text-massa-500 font-medium pt-1">
                          +{produto.variacoes.length - 3} variações
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* CTA after products */}
          {whatsapp && (
            <div className="text-center mt-10">
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-massa-500 text-white px-8 py-3.5 rounded-full text-base font-medium hover:bg-massa-600 transition-all hover:shadow-xl hover:shadow-massa-500/25"
              >
                <MessageCircle className="w-5 h-5" />
                Faça seu pedido pelo WhatsApp
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>
      </section>

      {/* ─── About ─── */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-transparent via-massa-50/50 to-transparent dark:via-[#1a1412]/30">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-massa-100 dark:bg-massa-800/50 flex items-center justify-center mx-auto mb-6">
            <Quote className="w-8 h-8 text-massa-500" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6" style={{ fontFamily: 'var(--font-serif)' }}>
            {aboutTitle}
          </h2>
          <p className="text-lg text-secondary leading-relaxed max-w-2xl mx-auto">
            {aboutContent}
          </p>
        </div>
      </section>

      {/* ─── Depoimentos ─── */}
      <section id="testimonials" className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: 'var(--font-serif)' }}>
              O que nossos clientes dizem
            </h2>
            <p className="text-muted">
              A satisfação de quem já experimentou é o nosso melhor ingrediente
            </p>
          </div>

          {testimonials.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p>Seja o primeiro a deixar um depoimento!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((t, idx) => (
                <div
                  key={t.id}
                  className="bg-white dark:bg-[#1a1412] rounded-2xl p-6 border border-gray-100 dark:border-gray-800 hover:border-massa-200 dark:hover:border-massa-700 transition-all duration-300"
                  style={{ animation: `fadeInUp 0.5s ease-out both ${idx * 100}ms` }}
                >
                  {/* Stars */}
                  {t.nota && (
                    <div className="flex items-center gap-0.5 mb-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < t.nota! ? 'text-amber-400 fill-amber-400' : 'text-gray-200 dark:text-gray-700'}`}
                        />
                      ))}
                    </div>
                  )}
                  {/* HTML sanitizado com DOMPurify contra XSS */}
                  <p
                    className="text-secondary text-sm leading-relaxed mb-4 italic"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(
                        `\u201c${t.texto}\u201d`,
                        { ALLOWED_TAGS: ['em', 'strong', 'br'], ALLOWED_ATTR: [] }
                      ),
                    }}
                  />
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-massa-100 dark:bg-massa-800 flex items-center justify-center text-sm font-bold text-massa-600 dark:text-massa-400">
                      {t.cliente_nome.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {DOMPurify.sanitize(t.cliente_nome, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Envie seu depoimento */}
          <TestimonialForm onSuccess={(t) => setTestimonials(prev => [...prev, t])} />
        </div>
      </section>

      {/* ─── Delivery Info ─── */}
      {(raioEntrega || taxaEntrega || horario) && (
        <section className="py-16 bg-gradient-to-b from-transparent via-massa-50/50 to-transparent dark:via-[#1a1412]/30">
          <div className="max-w-4xl mx-auto px-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {horario && (
                <div className="bg-white dark:bg-[#1a1412] rounded-2xl p-6 border border-gray-100 dark:border-gray-800 text-center">
                  <div className="w-12 h-12 rounded-xl bg-massa-50 dark:bg-massa-800/50 flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-6 h-6 text-massa-500" />
                  </div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Horário</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 whitespace-pre-line">{horario}</p>
                </div>
              )}
              {raioEntrega && (
                <div className="bg-white dark:bg-[#1a1412] rounded-2xl p-6 border border-gray-100 dark:border-gray-800 text-center">
                  <div className="w-12 h-12 rounded-xl bg-massa-50 dark:bg-massa-800/50 flex items-center justify-center mx-auto mb-4">
                    <Truck className="w-6 h-6 text-massa-500" />
                  </div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Área de Entrega</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{raioEntrega}</p>
                  {taxaEntrega && (
                    <p className="text-xs text-massa-500 mt-1 font-medium">{taxaEntrega}</p>
                  )}
                </div>
              )}
              {endereco && (
                <div className="bg-white dark:bg-[#1a1412] rounded-2xl p-6 border border-gray-100 dark:border-gray-800 text-center">
                  <div className="w-12 h-12 rounded-xl bg-massa-50 dark:bg-massa-800/50 flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-6 h-6 text-massa-500" />
                  </div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Endereço</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{endereco}</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ─── Contato / Footer ─── */}
      <footer id="contato" className="bg-massa-900 dark:bg-[#0a0705] text-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <CookingPot className="w-6 h-6 text-massa-300" />
                <span className="text-lg font-bold" style={{ fontFamily: 'var(--font-serif)' }}>
                  Mão na <span className="text-massa-400">Massa</span>
                </span>
              </div>
              <p className="text-sm text-massa-300/80 leading-relaxed">
                Salgados e doces artesanais feitos com ingredientes selecionados e muito carinho.
              </p>
            </div>

            {/* Contato */}
            <div>
              <h4 className="font-semibold mb-4 text-massa-200">Contato</h4>
              <div className="space-y-3">
                {telefone && (
                  <a href={`tel:${telefone}`} className="flex items-center gap-2 text-sm text-massa-300/80 hover:text-massa-200 transition-colors">
                    <MessageCircle className="w-4 h-4" />
                    {telefone}
                  </a>
                )}
                {instagram && (
                  <a href={`https://instagram.com/${instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-massa-300/80 hover:text-massa-200 transition-colors">
                    <Camera className="w-4 h-4" />
                    @{instagram.replace('@', '')}
                  </a>
                )}
                {endereco && (
                  <div className="flex items-start gap-2 text-sm text-massa-300/80">
                    <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{endereco}</span>
                  </div>
                )}
              </div>
            </div>

            {/* WhatsApp CTA */}
            <div>
              <h4 className="font-semibold mb-4 text-massa-200">Peça agora</h4>
              {whatsapp && (
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-massa-500 text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-massa-600 transition-all hover:shadow-lg hover:shadow-massa-500/25"
                >
                  <MessageCircle className="w-5 h-5" />
                  Fale conosco
                </a>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-massa-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-massa-500">
              © {new Date().getFullYear()} Mão na Massa. Todos os direitos reservados.
            </p>
            <a
              href="/admin"
              className="text-xs text-massa-600 hover:text-massa-400 transition-colors"
            >
              Área do administrador
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ─── Formulário de Depoimento ─────────────────────────────────

function TestimonialForm({ onSuccess }: { onSuccess: (t: TestimonialPublic) => void }) {
  const [nome, setNome] = useState('')
  const [texto, setTexto] = useState('')
  const [nota, setNota] = useState(0)
  const [hoverNota, setHoverNota] = useState(0)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim() || !texto.trim() || nota === 0) return
    setSending(true)
    setError('')
    try {
      const result = await publicoApi.enviarTestimonial({ cliente_nome: nome.trim(), texto: texto.trim(), nota })
      onSuccess(result)
      setSent(true)
      setNome('')
      setTexto('')
      setNota(0)
    } catch {
      setError('Erro ao enviar. Tente novamente.')
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="text-center mt-12 p-8 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-100 dark:border-green-800">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <p className="text-lg font-medium text-green-800 dark:text-green-300 mb-1">Depoimento enviado!</p>
        <p className="text-sm text-green-600 dark:text-green-400">Ele será analisado e em breve aparecerá aqui. Obrigado! 💛</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto mt-12 bg-white dark:bg-[#1a1412] rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-1" style={{ fontFamily: 'var(--font-serif)' }}>
        Deixe seu depoimento
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
        Sua opinião é muito importante para nós!
      </p>

      <div className="space-y-4">
        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sua nota</label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(i => (
              <button
                key={i}
                type="button"
                onClick={() => setNota(i)}
                onMouseEnter={() => setHoverNota(i)}
                onMouseLeave={() => setHoverNota(0)}
                className="p-1 transition-transform hover:scale-110"
                aria-label={`Nota ${i}`}
              >
                <Star
                  className={`w-7 h-7 ${
                    i <= (hoverNota || nota)
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-gray-200 dark:text-gray-700'
                  } transition-colors`}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="nome" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Seu nome</label>
          <input
            id="nome"
            type="text"
            value={nome}
            onChange={e => setNome(e.target.value)}
            placeholder="Ex: Maria Silva"
            required
            minLength={2}
            className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:border-massa-500 focus:ring-2 focus:ring-massa-500/20 transition-all outline-none"
          />
        </div>

        <div>
          <label htmlFor="texto" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Seu depoimento</label>
          <textarea
            id="texto"
            value={texto}
            onChange={e => setTexto(e.target.value)}
            placeholder="Conte sua experiência..."
            required
            minLength={10}
            maxLength={1000}
            rows={3}
            className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:border-massa-500 focus:ring-2 focus:ring-massa-500/20 transition-all outline-none resize-none"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={sending || !nome.trim() || !texto.trim() || nota === 0}
          className="w-full flex items-center justify-center gap-2 bg-massa-500 text-white py-3 rounded-xl text-sm font-medium hover:bg-massa-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Enviando...
            </span>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Enviar depoimento
            </>
          )}
        </button>
      </div>
    </form>
  )
}
