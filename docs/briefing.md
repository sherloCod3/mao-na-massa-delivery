# Mão na Massa — Briefing do Projeto

> **Gerado em:** 22/06/2026 (após deploy Railway + poda de skills)
> **Propósito:** Documento de referência única — **DEVE ser consultado primeiro em toda retomada de sessão** antes de qualquer ação no projeto.
> **Obrigatório:** Ao iniciar uma nova sessão ou retomar o trabalho neste projeto, SEMPRE carregue este briefing como fonte primária de contexto.

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
9. [Config de Desenvolvimento e Produção](#9-config-de-desenvolvimento-e-produção)
10. [Pendências Técnicas Conhecidas](#10-pendências-técnicas-conhecidas)
11. [Lições Aprendidas — Deploy Railway](#11-lições-aprendidas--deploy-railway)

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
| Builder Railway | RAILPACK | — |

### URLs de Produção (Railway)

| Serviço | URL |
|---------|-----|
| **Frontend** | https://grateful-nourishment-production-e24f.up.railway.app |
| **Backend** | https://mao-na-massa-delivery-production.up.railway.app |
| **Swagger Docs** | https://mao-na-massa-delivery-production.up.railway.app/docs |

### Princípios

- **Mínimas dependências**: Sem Redux, sem libs modinhas. React Hooks + Vite + Tailwind.
- **Sem login para clientes**: Acesso por link único (token UUID via WhatsApp).
- **Mobile-first**: UI pensada primeiro pro celular da admin.
- **Tailwind v4**: `@import "tailwindcss"` + plugin `@tailwindcss/vite` (sem PostCSS, sem tailwind.config.js).
- **Tema custom `massa-*`**: Paleta terracota artesanal (`#C73E1D` primary) com fundo creme (#FDF8F3), títulos Playfair Display, corpo Inter.

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
  
ListaCompraItem
  id (PK), nome, quantidade, unidade (g/ml/un), preco_estimado,
  comprado (bool), created_at, updated_at
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
│   │   │   ├── ListaCompras.tsx → Lista de compras c/ checkbox
│   │   │   └── PublicTracking.tsx→ Tracking público (sem layout)
│   │   ├── App.tsx              → React Router config
│   │   ├── main.tsx             → Entry point
│   │   └── index.css            → @import "tailwindcss" + tema massa-*
│   ├── public/
│   │   ├── icon-192.png         → PWA icon (pode não existir ainda)
│   │   ├── icon-512.png         → PWA icon (pode não existir ainda)
│   │   └── panela.svg           → Favicon temático
│   ├── package.json
│   ├── vite.config.ts           → Proxy /api → :8000, PWA, Tailwind
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   ├── tsconfig.node.json
│   ├── railway.json             → RAILPACK + npm install + publishPath:dist
│   └── .node-version            → 22.14.0
├── docs/
│   ├── architecture.md          → Documento de arquitetura
│   ├── briefing.md              ← Este documento
│   └── plans/
│       └── 2026-06-21-fase1-backend-setup.md
├── .agents/
│   └── skills/                  → Skills locais (não versionadas no git)
├── README.md                    → Documentação principal
└── .gitignore
```

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

### ✅ Fase 2 — Frontend Admin

- [x] Setup Vite 8 + React 19 + TypeScript 6 + Tailwind 4
- [x] Tema `massa-*` (paleta terracota artesanal)
- [x] Layout com sidebar (Dashboard, Pedidos, Produtos, Ingredientes, Lista de Compras)
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

### ✅ Fase Core — Custos & Dashboard

- [x] Cálculo de custo real no backend (`custo_total_estimado`, `lucro_estimado`)
- [x] Dashboard frontend com cards de custo, lucro, margem
- [x] `dashboard/periodo` com custos e lucro reais

### ✅ Lista de Compras

- [x] Model `ListaCompraItem` + schemas + CRUD completo
- [x] Frontend com formulário, soma automática, checkbox de comprado
- [x] Limpar comprados, editar valor inline, resumo com totais
- [x] Link na sidebar (`/lista-compras`)

### ✅ UI/UX Personalizado — Opção 3 "Misto"

- [x] **Tipografia:** Playfair Display (títulos) + Inter (corpo)
- [x] **Paleta terracota:** massa-* refinada do vermelho Tailwind para terracota artesanal
- [x] **Fundo creme texturizado:** `#FDF8F3` com overlay noise
- [x] **Cards, botões, inputs customizados**
- [x] **Sidebar refinada, favicon temático**

### ✅ Deploy Railway (22/06/2026)

- [x] Frontend estático servido via RAILPACK com `publishPath: "dist"`
- [x] Backend FastAPI com SQLite via Volume `/data`
- [x] CORS configurado com URL pública do frontend
- [x] Node 22 forçado via `.node-version` + env var
- [x] Build usa `npm install` em vez de `npm ci` (evita EBUSY)

### ✅ Infra & Config

- [x] PWA configurado (vite-plugin-pwa, autoUpdate, manifest, icons)
- [x] README.md completo
- [x] docs/architecture.md
- [x] docs/briefing.md
- [x] `.env` com defaults funcionais
- [x] `.env.example` (backend + frontend)
- [x] Testes de API: 17 testes, pytest + httpx AsyncClient
- [x] SecurityHeadersMiddleware aplicado (HSTS, XFO, CSP)

---

## 5. O Que Está Sendo Feito Agora

### 🔄 PWA & Offline (Fase 3 — próxima)

A fase de deploy Railway está concluída. A próxima grande frente é:

- Service Worker funcional com Workbox (já configurado no vite-plugin-pwa)
- IndexedDB via Dexie.js para cache offline
- Sincronização quando online
- Testar Add to Home Screen
- Ícones PWA reais (192x192, 512x512)

### 🔄 Manutenção de Skills

Skills locais em `.agents/skills/` foram auditadas e podadas (22/06/2026):
- **7 skills removidas** (outros ecossistemas: Copilot, Claude Code, Azure, Rails)
- **9 skills mantidas** (audit, check, improver, issue, optimizer, router, scanner, suggester, writer)
- **`skill-writer` adaptada** com suporte a Hermes Agent

---

## 6. O Que Falta Fazer (Roadmap)

### ✅ Fase 4 — Deploy (Concluído)

- [x] Railway: frontend (RAILPACK + dist) e backend (FastAPI + SQLite Volume)
- [x] Env vars configuradas (CORS, DATABASE_URL, VITE_API_URL)
- [x] Node version fixada (22.14.0 via .node-version)
- [x] BuildCommand: `npm install --no-audit --no-fund && npm run build`

### 👨‍🎨 Fase 3 — PWA & Offline

- [ ] Service Worker funcional com Workbox
- [ ] IndexedDB via Dexie.js para cache offline
- [ ] Sincronização quando online
- [ ] Testar Add to Home Screen
- [ ] Ícones PWA reais (192x192, 512x512)
- [ ] manifest.json completo

### Fase 5 — Relatórios

- [ ] Gráficos de faturamento mensal
- [ ] Relatório de custos por período
- [ ] Cálculo de lucro real (dashboard/periodo)
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
- [ ] Soft delete padronizado em todas as entidades
- [ ] Paginação nas listas (pedidos, ingredientes)
- [ ] Filtro de pedidos por data no frontend
- [ ] Loading states e tratamento de erros mais robusto no frontend
- [ ] Notificações toast (sucesso/erro nas ações CRUD)
- [ ] Validação de customizacoes JSON (ItemPedido salva como string)

---

## 7. Caminhos Importantes / Arquivos-Chave

### Para leitura obrigatória em retomada:

| Prioridade | Arquivo | Motivo |
|-----------|---------|--------|
| 🔴 | `docs/briefing.md` | Este documento — contexto completo do projeto |
| 🔴 | `backend/app/main.py` | Entry point — lifespan, CORS, routers |
| 🔴 | `backend/app/database.py` | Engine + session — init_db, get_session |
| 🔴 | `backend/app/models/variacao.py` | Contém `custo_unitario` e `preco_sugerido` |
| 🔴 | `backend/app/models/pedido.py` | StatusPedido enum — core business logic |
| 🔴 | `backend/app/routers/pedidos.py` | CRUD + cálculo de subtotal + customizacoes |
| 🔴 | `backend/app/routers/variacoes.py` | Rotas de receita + custo |
| 🔴 | `frontend/railway.json` | Config deploy Railway |
| 🟡 | `backend/app/routers/dashboard.py` | Queries de agregação |
| 🟡 | `backend/app/schemas/pedido.py` | Schemas — trackingResponse |
| 🟡 | `frontend/src/api/client.ts` | Tipos + chamadas API |

---

## 8. Skills Hermes Disponíveis

### Skills do Hermes Agent (globais em ~/.hermes/skills/)

Skills instaladas no Hermes que se aplicam a este projeto:

| Skill | Foco | Como usar |
|-------|------|-----------|
| `paas-deployment` | Deploy Railway/PaaS Python full-stack | `skill_view(name='paas-deployment')` |
| `react-vite-frontend` | React 19 + Vite 8 + Tailwind 4 | Tem o padrão Misto theme |
| `fastapi-async-backend` | Backend async FastAPI | Referência de padrões |
| `plan` | Plano de implementação markdown | Usar para planejar fases |
| `project-briefing` | Criar/manter briefing | Absorveu a skill `briefing` |
| `requesting-code-review` | Code review pré-commit | Usar antes de commits grandes |

### Skills locais em `.agents/skills/` (não versionadas)

Skills mantidas após auditoria de 22/06/2026:

| Skill | Tipo | Uso |
|-------|------|-----|
| `skill-check` | Validação | Validar SKILL.md contra agentskills spec |
| `skill-audit` | Segurança | Auditar skills de terceiros antes de instalar |
| `skill-scanner` | Segurança | Scanner com script Python |
| `skill-issue` | Diagnóstico | Diagnosticar por que skill não ativa |
| `skill-optimizer` | Otimização | Otimizar skills com dados de sessão |
| `skill-router` | Navegação | Ajudar a escolher skill correta |
| `skill-writer` | Criação ✨ | Workflow canônico (adaptada p/ Hermes) |
| `skill-improver` | Melhoria | Melhoria iterativa de skills |
| `skill-suggester` | Sugestão | Sugerir skills baseado em histórico |

---

## 9. Config de Desenvolvimento e Produção

### Ambiente Local

```bash
# Host
OS: Linux, Arch Linux (7.0.12-arch1-1)
Python: 3.14.5 (sem pip, usa uv)
Node: via npm (22.x)

# Backend
cd /home/sherlocod3/Documents/projects/mao-na-massa/backend
source .venv/bin/activate    # ou: uv sync
uv run uvicorn app.main:app --reload  # :8000

# Frontend
cd /home/sherlocod3/Documents/projects/mao-na-massa/frontend
npm install                   # Deps instaladas
npm run dev                   # :5173 (com proxy /api)

# Build
cd frontend && npm run build  # ✅ Gera dist/ com assets compilados
```

### Env vars — Produção (Railway)

**Backend:**
| Variável | Valor |
|----------|-------|
| `DATABASE_URL` | `sqlite+aiosqlite:////data/mao-na-massa.db` |
| `CORS_ORIGINS` | `https://grateful-nourishment-production-e24f.up.railway.app,http://localhost:5173` |

**Frontend:**
| Variável | Valor |
|----------|-------|
| `VITE_API_URL` | `https://mao-na-massa-delivery-production.up.railway.app/api/v1` |

### railway.json (frontend)

```json
{
  "build": {
    "builder": "RAILPACK",
    "buildCommand": "npm install --no-audit --no-fund && npm run build"
  },
  "deploy": {
    "static": true,
    "publishPath": "dist"
  }
}
```

### railway.json (backend)

Build automático (Python/FastAPI detectado). Volume `/data` montado para SQLite.

---

## 10. Pendências Técnicas Conhecidas

### 🐛 Potenciais Problemas

1. **Customizações salvas como string JSON** — `ItemPedido.customizacoes` é `str | None`
2. **DashboardPeriodoResponse.total_custos = 0.0** — Placeholder
3. **Sem paginação** — Listas podem ficar pesadas
4. **Sem testes automatizados** — Nenhum teste no projeto
5. **Soft delete inconsistente** — Ingrediente/Produto/Variacao usam `ativo=False`
6. **PedidoDetalhe.tsx** — Atualização de status não recarrega dados
7. **PWA icons** — `icon-192.png` e `icon-512.png` podem não existir em `public/`
8. **Sem auth** — Admin acessa por saber a URL (aceito para MVP)

### 📌 Decisões de Arquitetura

- **Sem autenticação no MVP**: Admin acessa por saber a URL. Tracking público usa token UUID.
- **SQLite no lugar de PostgreSQL**: Zero setup. Migra depois se precisar.
- **Tailwind v4 sem PostCSS**: Usa `@tailwindcss/vite` plugin direto.
- **`custo_unitario` é `@property` no model**: Calculado em tempo real, não armazenado.
- **RAILPACK + npm install**: Escolhido porque NIXPACKS ignora `publishPath`.

---

## 11. Lições Aprendidas — Deploy Railway

### Problema: EBUSY no build frontend

`npm ci` tenta remover `node_modules/` inteiro. No Railway, `.vite` e `.cache` são mounts especiais que não podem ser removidos.

**Solução:** Usar `npm install --no-audit --no-fund` em vez de `npm ci`. `npm install` só adiciona/atualiza pacotes, não tenta apagar `node_modules`.

### Problema: publishPath ignorado pelo NIXPACKS

O builder NIXPACKS não respeita `publishPath: "dist"` do `railway.json`. O frontend servia o `index.html` fonte em vez do build.

**Solução:** Usar **RAILPACK** como builder. RAILPACK respeita `publishPath` e serve o diretório correto.

### Problema: Node 20.18.1 incompatível com Vite 8

Vite 8 e rolldown exigem `^20.19.0 || >=22.12.0`. Sem pinning, o binding nativo do rolldown falha (`Cannot find module '@rolldown/binding-linux-x64-gnu'`).

**Solução:** Criar `.node-version` com `22.14.0` no diretório do frontend. Alternativa: env var `NIXPACKS_NODE_VERSION=22` (só funciona com NIXPACKS).

### Problema: nixpacks.toml com sintaxe inválida

```toml
[phases]
nodeVersion = "22"
```
Causa erro: `invalid type: string "22", expected struct Phase for key 'phases.nodeVersion'`

**Solução:** Não usar `nixpacks.toml` — preferir `.node-version` ou env var no dashboard.

### Problema: CORS com URL .railway.internal

A URL `.railway.internal` é interna do Railway. O navegador não reconhece para CORS.

**Solução:** Usar a URL pública do frontend (`.up.railway.app`) no `CORS_ORIGINS`.

### Configuração Final Recomendada (frontend)

| Item | Valor |
|------|-------|
| Builder | RAILPACK |
| Build command | `npm install --no-audit --no-fund && npm run build` |
| Node version | `.node-version` com `22.14.0` |
| Static | `true` |
| publishPath | `dist` |

---

> **Instrução para retomada de sessão:** Este briefing é a fonte primária de contexto. Sempre que uma nova sessão for iniciada ou o contexto for compactado, carregue este documento primeiro. Se alguma informação aqui estiver desatualizada, atualize-a imediatamente e prossiga. As URLs de produção e arquivos de configuração são a fonte da verdade — quando houver dúvida, consulte os arquivos diretamente com `read_file`/`terminal`.
