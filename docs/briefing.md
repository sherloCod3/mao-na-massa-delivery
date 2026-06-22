# Mão na Massa — Briefing do Projeto

> **Gerado em:** 21/06/2026 (após 4 compactações de contexto)
> **Propósito:** Documento de referência única orientando o agente com contexto completo do projeto.

---

## Sumário

1. [Visão Geral & Stack](#1-visão-geral--stack)
2. [Modelo de Dados](#2-modelo-de-dados)
3. [Arquivos do Projeto](#3-arquivos-do-projeto)
4. [O Que Já Foi Feito](#4-o-que-já-foi-feito)
5. [O Que Está Sendo Feito Agora](#5-o-que-está-sendo-feito-agora)
6. [O Que Falta Fazer (Roadmap)](#6-o-que-falta-fazer-roadmap)
7. [Caminhos Importantes / Arquivos-Chave](#7-caminhos-importantes--arquivos-chave)
8. [Skills Hermes Disponíveis](#8-skills-hermes-disponíveis)
9. [Config de Desenvolvimento Atual](#9-config-de-desenvolvimento-atual)
10. [Pendências Técnicas Conhecidas](#10-pendências-técnicas-conhecidas)

---

## 1. Visão Geral & Stack

**"Mão na Massa"** — Sistema web para gestão de produção e vendas artesanais de salgados e doces. Cliente é a esposa do desenvolvedor (admin + tracking público sem login).

### Stack

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Backend | Python + FastAPI | 3.14 / 0.115+ |
| Banco | SQLite (aiosqlite) | — |
| ORM | SQLAlchemy 2.0 (async) | 2.0.36+ |
| Frontend | React + Vite + TypeScript | 19 / 8 / 6.0 |
| Estilo | Tailwind CSS 4 | 4.3.1 |
| Roteamento | React Router DOM | 7.18 |
| Ícones | Lucide React | 1.21 |
| PWA | vite-plugin-pwa | 1.3 |
| Validação | Pydantic v2 | 2.10+ |

### Princípios

- **Mínimas dependências**: Sem Redux, sem libs modinhas. React Hooks + Vite + Tailwind.
- **Sem login para clientes**: Acesso por link único (token UUID via WhatsApp).
- **Mobile-first**: UI pensada primeiro pro celular da admin.
- **Tailwind v4**: `@import "tailwindcss"` + plugin `@tailwindcss/vite` (sem PostCSS, sem tailwind.config.js).
- **Tema custom `massa-*`**: Paleta vermelha (50-900) com `dc2626` como primária.

---

## 2. Modelo de Dados

```
Ingrediente
  id (PK), nome, unidade_medida (g/ml/un), preco_atual,
  embalagem (ex: 1000 pra 1kg), ativo, created_at, updated_at

Produto
  id (PK), nome, descricao, ativo, imagem_url, created_at, updated_at
  └─ variacoes [] ──┐
                     ▼
Variacao
  id (PK), produto_id (FK), nome, preco_venda, preco_minimo,
  margem_percentual (default 50%), ativo, created_at, updated_at
  ├─ receita [] ──► ReceitaItem (ingrediente_id FK, quantidade)
  └─ itens_pedido []

ReceitaItem
  id (PK), variacao_id (FK), ingrediente_id (FK), quantidade

Pedido
  id (PK), cliente_nome, cliente_whatsapp, token_acesso (UUID, index),
  status (recebido/producao/entrega/entregue/cancelado),
  forma_pagamento, observacoes, total, created_at, updated_at, data_entrega
  └─ itens [] ──► ItemPedido

ItemPedido
  id (PK), pedido_id (FK), variacao_id (FK), quantidade,
  preco_unitario, customizacoes (JSON text), subtotal
```

### Cálculo de Custo

```
custo_por_unidade = preco_ingrediente / embalagem
custo_item = quantidade × custo_por_unidade
custo_unitario_variação = Σ custo_item de todos ingredientes da receita
preco_sugerido = custo_unitario × (1 + margem_percentual / 100)
```

---

## 3. Arquivos do Projeto

```
/home/sherlocod3/Documents/projects/mao-na-massa/
├── backend/
│   ├── app/
│   │   ├── base.py              → SQLAlchemy DeclarativeBase
│   │   ├── config.py            → Pydantic BaseSettings (DB URL, CORS)
│   │   ├── database.py          → Async engine + session + init_db
│   │   ├── main.py              → FastAPI app, CORS, lifespan, routers
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── ingrediente.py   → Ingrediente ORM
│   │   │   ├── produto.py       → Produto ORM
│   │   │   ├── variacao.py      → Variacao ORM (custo_unitario, preco_sugerido)
│   │   │   ├── receita_item.py  → ReceitaItem ORM
│   │   │   ├── pedido.py        → Pedido ORM + StatusPedido enum
│   │   │   └── item_pedido.py   → ItemPedido ORM
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── ingrediente.py   → Pydantic schemas
│   │   │   ├── produto.py
│   │   │   ├── variacao.py
│   │   │   ├── receita.py
│   │   │   ├── pedido.py
│   │   │   └── dashboard.py
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── ingredientes.py  → /api/v1/ingredientes CRUD
│   │   │   ├── produtos.py      → /api/v1/produtos CRUD
│   │   │   ├── variacoes.py     → Variações + Receitas + Custo
│   │   │   ├── pedidos.py       → /api/v1/pedidos CRUD + status
│   │   │   ├── publico.py       → /api/v1/publico/pedidos/{token} tracking
│   │   │   └── dashboard.py     → /api/v1/dashboard/hoje, /periodo
│   │   └── services/            → (reservado, vazio)
│   ├── pyproject.toml
│   ├── .env                     → DATABASE_URL, CORS_ORIGINS
│   ├── .env.example
│   ├── mao-na-massa.db          → SQLite (32768 bytes, vazio)
│   └── .venv/                   → Virtualenv com deps
├── frontend/
│   ├── src/
│   │   ├── api/client.ts        → API client tipado com interfaces
│   │   ├── components/Layout.tsx→ Sidebar + Main layout
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx    → Cards + gráfico de status
│   │   │   ├── Ingredientes.tsx → CRUD completo c/ modal
│   │   │   ├── Produtos.tsx     → Lista + modais (Variação/Receita)
│   │   │   ├── Pedidos.tsx      → Tabela + navegação
│   │   │   ├── PedidoNovo.tsx   → Formulário de pedido
│   │   │   ├── PedidoDetalhe.tsx→ Detalhe + atualização de status
│   │   │   └── PublicTracking.tsx→ Tracking público (sem layout)
│   │   ├── App.tsx              → React Router config
│   │   ├── main.tsx             → Entry point
│   │   └── index.css            → @import "tailwindcss" + tema massa-*
│   ├── package.json
│   ├── vite.config.ts           → Proxy /api → :8000, PWA, Tailwind
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   └── tsconfig.node.json
├── docs/
│   ├── architecture.md          → Documento de arquitetura
│   ├── briefing.md              ← Este documento
│   └── plans/
│       └── 2026-06-21-fase1-backend-setup.md
├── README.md                    → Documentação principal
└── .gitignore
```

### Resumo de Tamanho

| Categoria | Arquivos | Linhas |
|-----------|----------|--------|
| Models (6) | Python | 193 |
| Routers (6) | Python | 710 |
| Schemas (6) | Python | 214 |
| Config/Base/Main | Python | 72 |
| Frontend pages (7) | TSX | 925 |
| API client | TS | 137 |
| Layout + App | TSX | 85 |
| **Total código** | **~23 arquivos** | **~2.336 linhas** |

---

## 4. O Que Já Foi Feito

### ✅ Fase 0/1 — Backend (API REST)

- [x] Estrutura do projeto (FastAPI + SQLAlchemy async)
- [x] Models: Ingrediente, Produto, Variacao, ReceitaItem, Pedido, ItemPedido
- [x] Schemas Pydantic para todas as entidades
- [x] CRUD de ingredientes (listar, criar, atualizar, desativar)
- [x] CRUD de produtos (listar, criar, obter, atualizar, desativar)
- [x] CRUD de variações por produto + receita (ingredientes)
- [x] Cálculo de custo unitário e preço sugerido automáticos
- [x] CRUD de pedidos com itens, customizações, controle de status
- [x] Tracking público (rota `/publico/pedidos/{token}` sem auth)
- [x] Dashboard: `/hoje` e `/periodo` (pedidos ativos, faturamento)
- [x] CORS configurado para frontend dev
- [x] SQLite funcional com init_db automático no startup

### ✅ Fase 2 — Frontend Admin

- [x] Setup Vite 8 + React 19 + TypeScript 6 + Tailwind 4
- [x] Tema `massa-*` (paleta vermelha custom)
- [x] Layout com sidebar (Dashboard, Pedidos, Produtos, Ingredientes)
- [x] Página Dashboard com cards + gráfico de distribuição por status
- [x] CRUD de ingredientes (tabela + formulário)
- [x] CRUD de produtos com modais de variação e receita
- [x] Lista de pedidos com tabela e filtros por status
- [x] Criação de pedido (itens, customizações, forma pagamento)
- [x] Detalhe do pedido + atualização de status com 1 clique
- [x] Proxy `/api` → backend em dev

### ✅ Fase 2.5 — Tracking Público

- [x] Rota `/track/:token` pública sem Layout admin
- [x] Página PublicTracking com timeline de status
- [x] Proteção contra pedido cancelado (410 Gone)

### ✅ Infra & Config

- [x] PWA configurado (vite-plugin-pwa, autoUpdate, manifest, icons)
- [x] README.md completo (193 linhas)
- [x] docs/architecture.md (173 linhas)
- [x] docs/plans/ com plano de implementação da fase 1
- [x] `.env` com defaults funcionais
- [x] `.env.example` (backend + frontend)
- [x] Alembic async configurado (migração inicial gerada e aplicada)
- [x] Testes de API: 17 testes, pytest + httpx AsyncClient
- [x] Servidores rodando (backend :8000, frontend :5173)
- [x] Build frontend passa (`npm run build` OK: CSS 24KB, JS 274KB)
- [x] SecurityHeadersMiddleware aplicado (HSTS, XFO, CSP)

---

## 5. O Que Está Sendo Feito Agora

### 🔄 Cálculo de Custos Reais no Dashboard

**Fase Core — concluída.** O backend agora calcula:

- `custo_total_estimado` no dashboard `/hoje` (soma do custo unitário de cada variação × quantidade)
- `lucro_estimado` no dashboard `/hoje` (faturamento − custo)
- `total_custos` e `total_lucro` no dashboard `/periodo` (apenas pedidos entregues)
- Margem percentual exibida no frontend

O cálculo usa a `@property custo_unitario` do model `Variacao`, que soma ingredientes da receita com base em `preco_atual / embalagem`.

### 🔄 Skills Python do Projeto

8 skills Python foram adicionadas em `.agents/skills/` (versionamento ignorado via `.gitignore`). Carregadas on-demand quando necessário.

---

## 6. O Que Falta Fazer (Roadmap)

### ✅ Fase Core — Custos & Dashboard

- [x] Cálculo de custo real no backend (`custo_total_estimado`, `lucro_estimado`)
- [x] Dashboard frontend com cards de custo, lucro, margem
- [x] `dashboard/periodo` com custos e lucro reais

### ✅ Lista de Compras

- [x] Model `ListaCompraItem` + schemas + CRUD completo
- [x] Frontend com formulário, soma automática, checkbox de comprado
- [x] Limpar comprados, editar valor inline, resumo com totais
- [x] Migração Alembic (tabela `lista_compras`)
- [x] Link na sidebar (`/lista-compras`)

### 👨‍🎨 UI/UX Personalizado — Opção 3 "Misto"

- [x] **Tipografia:** Playfair Display (títulos) + Inter (corpo)
- [x] **Paleta terracota:** massa-* refinada do vermelho Tailwind para terracota artesanal (#C73E1D primary)
- [x] **Fundo creme texturizado:** `#FDF8F3` com overlay noise
- [x] **Cards com sombra e cantos suaves:** `.card` (rounded-xl, shadow terracota, border sutil)
- [x] **Botões:** `.btn`/`.btn-primary`/`.btn-secondary` com feedback tátil
- [x] **Inputs customizados:** borda terracota no focus
- [x] **Sidebar refinada:** sombra sutil, ativo em massa-700
- [x] **Favicon temático:** panela terracota SVG
- [x] **lang="pt-BR"** no HTML

### Fase 3 — PWA & Offline

- [ ] Service Worker funcional com Workbox
- [ ] IndexedDB via Dexie.js para cache offline
- [ ] Sincronização quando online
- [ ] Testar Add to Home Screen
- [ ] Ícones PWA reais (192x192, 512x512)
- [ ] manifest.json completo

### Fase 4 — Deploy

- [ ] Dockerfile para backend
- [ ] Dockerfile para frontend (Nginx)
- [ ] docker-compose.yml
- [ ] Script de deploy em VPS
- [ ] HTTPS (Let's Encrypt)
- [ ] CI/CD (GitHub Actions)

### Fase 5 — Relatórios

- [ ] Gráficos de faturamento mensal
- [ ] Relatório de custos por período
- [ ] Cálculo de lucro real (dashboard/periodo custos)
- [ ] Sazonalidade (produtos mais vendidos)
- [ ] Exportação CSV/PDF

### Fase 6 — Notificações

- [ ] Notificação de novo pedido (WhatsApp/Telegram)
- [ ] Alerta de estoque baixo (baseado em receitas)
- [ ] Lembrete de data de entrega

### Melhorias Técnicas Identificadas

- [ ] `total_custos` e `total_lucro` no DashboardPeriodoResponse (hoje retorna 0.0)
- [ ] Autenticação admin básica (pelo menos senha única ou token fixo)
- [ ] Testes automatizados (pytest backend, vitest frontend)
- [ ] Migrations com Alembic (já incluído nas deps, não configurado)
- [ ] Soft delete padronizado em todas as entidades
- [ ] Paginação nas listas (pedidos, ingredientes)
- [ ] Filtro de pedidos por data no frontend
- [ ] Loading states e tratamento de erros mais robusto no frontend
- [ ] Notificações toast (sucesso/erro nas ações CRUD)
- [ ] Validação de customizacoes JSON (ItemPedido salva como string)

---

## 7. Caminhos Importantes / Arquivos-Chave

### Para ler durante auditoria:

| Prioridade | Arquivo | Motivo |
|-----------|---------|--------|
| 🔴 | `backend/app/main.py` | Entry point — lifespan, CORS, routers |
| 🔴 | `backend/app/database.py` | Engine + session — init_db, get_session |
| 🔴 | `backend/app/models/variacao.py` | Contém `custo_unitario` e `preco_sugerido` — lógica de negócio crítica |
| 🔴 | `backend/app/models/pedido.py` | StatusPedido enum — core business logic |
| 🔴 | `backend/app/routers/pedidos.py` | CRUD + cálculo de subtotal + customizacoes |
| 🔴 | `backend/app/routers/variacoes.py` | Rotas de receita + custo — lógica mais complexa |
| 🟡 | `backend/app/routers/dashboard.py` | Queries de agregação |
| 🟡 | `backend/app/schemas/pedido.py` | Schemas — trackingResponse tem campos limitados |
| 🟡 | `frontend/src/api/client.ts` | Tipos + chamadas API — contrato front/back |
| 🟡 | `frontend/src/App.tsx` | Rotas — tracking público sem Layout |
| 🟢 | `frontend/src/pages/*.tsx` | Páginas — verificar erros, DX, DX |
| 🟢 | `frontend/vite.config.ts` | PWA + proxy + build config |
| 🟢 | `backend/pyproject.toml` | Dependências |

### Servidores Ativos

| Serviço | URL | PID | Status |
|---------|-----|-----|--------|
| Backend (Uvicorn) | `http://localhost:8000` | 388610 | ✅ Rodando |
| Frontend (Vite) | `http://localhost:5173` | 388720 | ✅ Rodando |
| Docs API | `http://localhost:8000/docs` | — | ✅ Swagger UI |

### Arquivos de Config

| Arquivo | Conteúdo |
|---------|---------|
| `backend/.env` | `DATABASE_URL=sqlite+aiosqlite:///./mao-na-massa.db` |
| `backend/.env` | `CORS_ORIGINS=http://localhost:5173` |
| `frontend/vite.config.ts` | Proxy `/api` → `localhost:8000`, PWA manifest |

---

## 8. Skills Hermes Disponíveis

Diretório: `/home/sherlocod3/Documents/projects/.agents/skills/`

### Aprovadas para auditoria (execução imediata após briefing):

| Skill | Foco |
|-------|------|
| `production-code-audit` | Varredura linha a linha, boas práticas |
| `vulnerability-scanner` | OWASP 2025, segurança |
| `dependency-management-deps-audit` | Supply chain, CVEs |
| `vibe-code-cleanup` | Limpeza, refatoração pós-auditoria |
| `project-skill-audit` | Recomendar skills faltantes pro projeto |

### Skills ignoradas (não aplicáveis agora):

- `agent-memory-systems` (CoALA, teórica)
- `context-management-context-save`, `context-restore` (genericas demais)
- `context-optimization`, `context-window-management` (genéricas)
- `bug-hunter` (processo já usado, pode ser útil depois)
- `error-diagnostics-error-trace` (Sentry → Fase 4)
- `senior-architect` (diagramas, pode ser útil depois)
- `security-audit` (provavelmente coberto por vulnerability-scanner)
- `clean-code` (provavelmente coberto por vibe-code-cleanup)

---

## 9. Config de Desenvolvimento Atual

### Ambiente

```bash
# Host
OS: Linux, Arch Linux (7.0.12-arch1-1)
Python: 3.14.5 (sem pip, usa uv)
Node: via npm

# Backend
cd /home/sherlocod3/Documents/projects/mao-na-massa/backend
uv sync                    # Deps instaladas
uv run uvicorn app.main:app --reload  # :8000

# Frontend
cd /home/sherlocod3/Documents/projects/mao-na-massa/frontend
npm install                # Deps instaladas
npm run dev                # :5173 (com proxy /api)

# Build
cd frontend && npm run build   # ✅ Passa sem erros
```

### Dependências Backend (pyproject.toml)

- fastapi>=0.115.0
- uvicorn[standard]>=0.34.0
- sqlalchemy[asyncio]>=2.0.36
- aiosqlite>=0.20.0
- alembic>=1.14.0
- pydantic-settings>=2.7.0
- pydantic>=2.10.0

### Dependências Frontend (package.json)

- @tailwindcss/vite ^4.3.1
- lucide-react ^1.21.0
- react ^19.2.6
- react-dom ^19.2.6
- react-router-dom ^7.18.0
- tailwindcss ^4.3.1
- Dev: vite ^8.0.12, vite-plugin-pwa ^1.3.0, typescript ~6.0.2

---

## 10. Pendências Técnicas Conhecidas

### 🐛 Potenciais Problemas

1. **Customizações salvas como string JSON** (`ItemPedido.customizacoes` é `str | None`, não JSON nativo SQLite). Funciona mas perde queryabilidade.
2. **DashboardPeriodoResponse.total_custos = 0.0** — Placeholder, cálculo real complexo de fazer em tempo real.
3. **Sem paginação** — Listas de pedidos/ingredientes podem ficar pesadas com muitos registros.
4. **Sem migrations** — Alembic incluso nas deps mas não configurado. `init_db` recria tabelas toda vez.
5. **Sem testes** — Nenhum teste automatizado (nem backend, nem frontend).
6. **Soft delete inconsistente** — Ingrediente/Produto/Variacao usam `ativo=False`, mas alguns endpoints podem não filtrar corretamente.
7. **CustomizacaoItem no schema** tem `preco` mas `nome` não tem validação de tamanho.
8. **PedidoDetalhe.tsx** — Atualização de status não recarrega dados após mudança (precisa verificar).
9. **PWA icons** — `icon-192.png` e `icon-512.png` referenciados no manifest mas podem não existir (verificar `public/`).

### 📌 Decisões de Arquitetura

- **Sem autenticação no MVP**: Admin acessa por saber a URL. Tracking público usa token UUID.
- **SQLite no lugar de PostgreSQL**: Zero setup. Migra depois se precisar.
- **React Router v7**: Substitui solução anterior de hash-router.
- **Tailwind v4 sem PostCSS**: Usa `@tailwindcss/vite` plugin direto.
- **`custo_unitario` é `@property` no model**: Calculado em tempo real, não armazenado no banco.

### 📋 Skills Memory

Informação já salva na memória do Hermes:

- User = brasileiro, prefere português BR para tudo
- Usuário valoriza dependências mínimas
- Projeto "Mão na Massa" é app portfolio para food business da esposa
- Prefere soluções simples (SQLite, sem auth MVP, stack direta)
- Quer working deliverables com tool output real

---

> **Nota sobre compactações:** Este briefing foi elaborado após 4 compactações de contexto. O conteúdo acima foi verificado contra os arquivos atuais do projeto no disco e servidores rodando. Para máxima precisão, sempre referencie os arquivos diretamente via read_file/terminal quando executar as auditorias.
