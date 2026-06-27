# Mão na Massa — Documento de Arquitetura

> **Projeto:** Sistema de gestão de produção e vendas de salgados/doces
> **Cliente:** Esposa do desenvolvedor (admin), clientes finais (tracking)
> **Propósito:** Portfolio profissional + ferramenta real para o dia a dia

---

## 1. Stack Tecnológica

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| **Backend** | Python 3.14 + FastAPI | Python é o ecossistema do dev; FastAPI é moderno, performático, type-safe, gera OpenAPI automaticamente |
| **Banco** | SQLite (via SQLAlchemy + aiosqlite) | Zero setup, sem servidor, ideal para app single-user + tracking. Migra para PostgreSQL depois se necessário |
| **Frontend** | React 19 + Vite + TypeScript | Padrão da indústria, portfólio forte, maduro |
| **Estilo** | Tailwind CSS 4 | Mobile-first, responsivo, rápido de prototipar |
| **Offline** | Service Worker (Workbox) + IndexedDB (Dexie.js) | PWA completo com Add to Home Screen |
| **ORM** | SQLAlchemy 2.0 (assíncrono) | ORM maduro, type-safe, assíncrono |
| **Validação** | Pydantic v2 | Já vem com FastAPI, schemas compartilháveis |
| **Autenticação** | JWT (HS256, pyjwt) | Token com expiração de 24h, substitui token fixo |
| **Rate Limiting** | slowapi | 10/min login, 5/min pedidos, 10/min depoimentos |
| **Segurança** | CSP, TrustedHostMiddleware, DOMPurify | Proteção XSS, Host Header Injection |
| **Banco** | SQLite WAL mode | journal_mode=WAL, synchronous=NORMAL, busy_timeout=5s |

## 2. Modelo de Dados (Conceitual)

```
Produto                          Pedido
  ├── id (PK)                      ├── id (PK)
  ├── nome (coxinha, pudim...)     ├── cliente_nome
  ├── descricao                    ├── cliente_whatsapp
  ├── ativo                        ├── token_acesso (UUID, link tracking)
  ├── imagem_url                    ├── status: [recebido, producao, entrega, entregue]
  └── variacoes []                 ├── data_criacao
      ├── id (PK)                  ├── data_entrega
      ├── nome (tradicional,       ├── forma_pagamento
      │    cheddar, queijo...)      ├── observacoes
      ├── preco_venda              ├── total
      ├── preco_minimo             └── itens []
      ├── ativo                          ├── id (PK)
      └── receita []                     ├── produto_id
          ├── id (PK)                    ├── variacao_id
          ├── ingrediente_id (FK)        ├── quantidade
          ├── quantidade (g/un)          ├── preco_unitario
          └── ingrediente                ├── customizacoes (JSON)
              ├── id (PK)                └── subtotal
              ├── nome
              ├── unidade_medida (g, ml, un)
              ├── preco_atual
              └── preco_historico []
```

### Regras de Negócio

- **Variação** = sabor / versão específica de um produto (ex: coxinha cheddar)
- **Customizações** = adicionais avulsos que podem ser incluídos em qualquer item do pedido (ex: "adicional de catupiry", "sem cebola"). São livremente adicionáveis/removíveis
- **Preço da variação** = calculado com base na receita (custo ingredientes) + margem configurável
- **Preço mínimo** = alerta visual se o preço de venda estiver abaixo do mínimo calculado
- **Pedido** pode conter múltiplos itens de produtos diferentes
- **Token de acesso** = UUID único gerado ao criar pedido, usado no link de tracking

### Estado do Projeto

```
📦 Sessão atual: 29 arquivos alterados, 11.695 inserções
🔐 Auth:     JWT (24h exp) | rate limit 10/min login
🛡️ Security: CSP dev/prod | WAL mode | DOMPurify | TrustedHost
📱 Frontend: Autocomplete | sorting Pedidos | busca server-side
💬 Notify:   WhatsApp formatado (━━━, emojis, linhas separadoras)
📋 Docs:     threat-model.md | security-report.md | ownership-map
```

## 3. Rotas da API

Todas as rotas são prefixadas com `/api/v1`.

### Autenticação Admin
```
POST   /api/v1/admin/login           → Login com ADMIN_TOKEN, retorna JWT (24h)
                                          ⚡ Rate limit: 10/min por IP
```

### Produtos
```
GET    /api/v1/produtos              → Listar (com variações, suporta ?search=&limite=) 🔒
POST   /api/v1/produtos              → Criar produto 🔒
GET    /api/v1/produtos/{id}         → Detalhe do produto 🔒
PUT    /api/v1/produtos/{id}         → Atualizar 🔒
DELETE /api/v1/produtos/{id}         → Desativar (soft delete) 🔒

Rotas aninhadas (variações):
GET    /api/v1/produtos/{id}/variacoes       → Listar variações 🔒
POST   /api/v1/produtos/{id}/variacoes       → Criar variação 🔒
PUT    /api/v1/variacoes/{id}                → Atualizar variação 🔒
DELETE /api/v1/variacoes/{id}                → Desativar variação 🔒
```

### Ingredientes
```
GET    /api/v1/ingredientes           → Listar (suporta ?search=&limite=) 🔒
POST   /api/v1/ingredientes           → Criar 🔒
PUT    /api/v1/ingredientes/{id}      → Atualizar preço 🔒
DELETE /api/v1/ingredientes/{id}      → Desativar 🔒
POST   /api/v1/ingredientes/{id}/movimentar       → Entrada/saída de estoque 🔒
GET    /api/v1/ingredientes/{id}/movimentacoes    → Histórico de movimentações 🔒
```

### Receitas (ingredientes por variação)
```
GET    /api/v1/variacoes/{id}/receita       → Ver receita da variação
POST   /api/v1/variacoes/{id}/receita       → Adicionar ingrediente à receita
PUT    /api/v1/receita/{id}                 → Atualizar quantidade
DELETE /api/v1/receita/{id}                 → Remover ingrediente da receita

GET    /api/v1/variacoes/{id}/custo         → Calcular custo unitário atual
```

### Pedidos
```
GET    /api/v1/pedidos                        → Listar (filtro por status/data) 🔒
POST   /api/v1/pedidos                        → Criar pedido (público)
                                                  ⚡ Rate limit: 5/min por IP
GET    /api/v1/pedidos/{id}                   → Detalhe (admin) 🔒
PUT    /api/v1/pedidos/{id}/status            → Atualizar status 🔒
DELETE /api/v1/pedidos/{id}                   → Cancelar 🔒

GET    /api/v1/publico/pedidos/{token}        → Tracking público (cliente, sem auth)
```

### Dashboard
```
GET    /api/v1/dashboard/hoje         → Resumo do dia 🔒
GET    /api/v1/dashboard/periodo      → Relatório por período 🔒
GET    /api/v1/dashboard/mensal       → Faturamento mensal (6 meses) 🔒
GET    /api/v1/dashboard/top-produtos → Produtos mais vendidos 🔒
```

### Site Config & Depoimentos
```
GET    /api/v1/publico/site-config     → Configs da landing page (público)
GET    /api/v1/publico/testimonials     → Depoimentos aprovados (público)
POST   /api/v1/publico/testimonials     → Enviar depoimento (público)
                                           ⚡ Rate limit: 10/min por IP

GET    /api/v1/admin/site-config        → CRUD de configs 🔒
PUT    /api/v1/admin/site-config/{key}  → Atualizar config 🔒
GET    /api/v1/admin/testimonials       → Listar depoimentos (admin) 🔒
PUT    /api/v1/admin/testimonials/{id}  → Aprovar/rejeitar depoimento 🔒
```

🗝️ **🔒** = Requer `Authorization: Bearer <JWT>` (obtido via `/admin/login`)

### Lista de Compras
```
GET    /api/v1/lista-compras         → Listar itens 🔒
POST   /api/v1/lista-compras         → Criar item 🔒
PUT    /api/v1/lista-compras/{id}    → Atualizar 🔒
DELETE /api/v1/lista-compras/{id}    → Remover 🔒
GET    /api/v1/lista-compras/resumo  → Resumo (totais) 🔒
GET    /api/v1/lista-compras/sugestoes  → Sugestões automáticas 🔒
POST   /api/v1/lista-compras/salvar     → Salvar lista 🔒
POST   /api/v1/lista-compras/carregar/{id} → Carregar lista salva 🔒
```

### Notificações
```
GET    /api/v1/notificacoes          → Listar 🔒
POST   /api/v1/notificacoes/{id}/ler     → Marcar como lida 🔒
POST   /api/v1/notificacoes/ler-todas   → Marcar todas lidas 🔒
```

## 4. Fluxo de Uso (Admin)

```
1. Cadastra ingredientes com preços
2. Cria produto (ex: "Coxinha")
3. Cria variação (ex: "Cheddar")
4. Define receita da variação (ingredientes + quantidades)
5. Sistema calcula custo unitário automático
6. Define margem de lucro → preço sugerido
7. Pode sobrescrever preço manualmente (mas vê alerta se < mínimo)
8. Cria pedido do cliente
9. Sistema gera link de tracking automático
10. Envia o link pro cliente no WhatsApp
11. Atualiza status do pedido ao longo do dia
```

## 5. Estrutura de Diretórios

```
mao-na-massa/
├── backend/
│   ├── app/
│   │   ├── main.py              → Entry point FastAPI
│   │   ├── config.py            → Configurações (pydantic-settings)
│   │   ├── database.py          → Engine SQLAlchemy + sessão
│   │   ├── models/              → SQLAlchemy models
│   │   ├── schemas/             → Pydantic schemas
│   │   ├── routers/             → Rotas FastAPI
│   │   └── services/            → Lógica de negócio
│   ├── pyproject.toml
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/          → Componentes React
│   │   ├── pages/               → Páginas (admin, tracking, login)
│   │   ├── services/            → API client
│   │   ├── hooks/               → Custom hooks
│   │   └── styles/              → CSS extra
│   ├── public/
│   │   ├── manifest.json        → PWA manifest
│   │   └── sw.js                → Service Worker
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── docs/
│   ├── architecture.md          ← Você está aqui
│   └── plans/                   → Planos de implementação
├── .gitignore
└── README.md
```

## 6. Segurança

| Medida | Onde | O que faz |
|--------|------|-----------|
| **JWT (HS256)** | `auth.py` | Login retorna token com expiração de 24h. `verify_admin` decodifica e valida |
| **Rate limit** | `admin_auth.py`, `pedidos.py`, `publico_testimonials.py` | 10/min login, 5/min pedidos, 10/min depoimentos |
| **CSP** | `main.py` | `_DEV_CSP` (com `unsafe-eval` p/ Vite) vs `_PROD_CSP` (restrito, sem WebSocket) |
| **TrustedHost** | `main.py` | Valida header Host — configurável via `ALLOWED_HOSTS` |
| **CORS** | `main.py` | Restrito a origens configuradas via `CORS_ORIGINS` |
| **WAL mode** | `database.py` | `PRAGMA journal_mode=WAL` + `busy_timeout=5000` + `foreign_keys=ON` |
| **DOMPurify** | `Landing.tsx` | Sanitiza depoimentos antes de renderizar (XSS prevention) |
| **Auto-logout** | `client.ts` + `AuthContext.tsx` | Dispara `auth:logout` ao receber 401 — limpa token + cache SW |
| **Backup** | `scripts/backup_db.py` | SQLite online backup API, suporte a gzip, keep-last-N |

🔒 Rotas admin protegidas por `Depends(verify_admin)`. Rotas públicas (pedidos, tracking, depoimentos) não exigem auth.

## 7. Frontend — Novos Componentes

| Componente | Função |
|-----------|--------|
| `AutocompleteInput` | Input com debounce (300ms), keyboard nav (↑↓ Enter Esc), loading/empty states |
| `AutocompleteIngrediente` | Busca ingredientes via API `?search=` com fallback offline |
| `AutocompleteProduto` | Busca produtos via API `?search=` com fallback offline |
| `ErrorBoundary` | Captura erros de render e mostra fallback amigável |
| `NotificationBell` | Polling de notificações in-app com badge |
| `OnlineStatus` | Indicador de conectividade |
| `SyncStatus` | Status da fila de mutações offline |
| `Toast` | Sistema de notificações toast |

### Formatos de Notificação (WhatsApp/Telegram)

```
━━━ 🧾 PEDIDO #42 ━━━

👤 Olá Maria!
💰 Total: R$ 40,00
📥 Status: *Recebido*

── Itens ──
  • 2x Coxinha (Frango) — R$ 16,00

────────────────

Obrigado por comprar no Mão na Massa! 🎉
━━━ 🥟 Mão na Massa ━━━
```

## 8. Testes

| Suite | Qtd | Tech |
|-------|-----|------|
| Backend (API) | 48 testes | pytest + httpx + SQLite in-memory |
| Frontend (unit) | 33 testes | vitest |

## 9. Princípios de Desenvolvimento

1. **YAGNI** — Não adicionar nada antes de ser necessário
2. **DRY** — Sem duplicação de lógica entre backend/frontend
3. **TDD** — Testes antes da implementação (quando aplicável)
4. **Separação de concerns** — Routers só roteiam, services têm lógica
5. **Type safety** — Pydantic + TypeScript em toda parte (zero `any` types)
6. **Mobile-first** — UI pensada primeiro pro celular da admin
7. **Sem dependências fúteis** — React puro, sem Redux/Router pesado
8. **Dados locais primeiro** — PWA cacheia dados pra funcionar offline
9. **Security-first** — JWT, CSP, rate limits, WAL mode, sanitização de inputs
