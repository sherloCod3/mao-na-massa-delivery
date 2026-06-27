# 🍳 Mão na Massa

**Gestão de produção e vendas artesanais**

Sistema completo para gerenciar produção, custos, preços e pedidos de salgados, doces e outros produtos artesanais. Multi-produto com variações (tradicional, cheddar, vegano) e customizações opcionais.

---

## ✨ Funcionalidades

| Funcionalidade | Descrição |
|---|---|
| **📦 Ingredientes** | Cadastro com preço por embalagem + controle de estoque com alerta de mínimo |
| **🍪 Produtos & Variações** | Coxinha (tradicional, cheddar), pudim, etc. Cada variação com sua própria receita e margem |
| **💰 Cálculo de Custo** | Custo unitário automático com base nos ingredientes da receita. Preço sugerido = custo × (1 + margem%) |
| **📋 Pedidos** | Cadastro com múltiplos itens, customizações, formas de pagamento |
| **🔄 Status Tracking** | Fluxo: recebido → produção → entrega → entregue |
| **🔗 Tracking Público** | Link único por pedido (sem login). Cliente acompanha em tempo real |
| **📊 Dashboard** | Faturamento, custos, lucro, top produtos, nível de estoque, gráfico mensal |
| **📱 PWA** | Progressive Web App com cache offline e Add to Home Screen |
| **🔐 Autenticação** | JWT (24h exp), rate limiting por IP, CSP, TrustedHostMiddleware |
| **💬 Notificações** | WhatsApp (formatado) e Telegram integrados |
| **🛒 Lista de Compras** | Sugestões automáticas baseadas em receitas, listas salvas |
| **📤 Exportação CSV** | Relatórios do dashboard exportáveis |

---

## 🏗 Stack

```
Frontend:  React 19 + TypeScript + Vite 8 + Tailwind CSS 4 + Recharts
Backend:   Python 3.12+ + FastAPI + SQLAlchemy 2.0 (async) + SQLite
QA:        Ruff + Bandit + Pylint + SonarCloud + Vitest + Pytest
Infra:     Railway (RAILPACK) | PWA offline-ready | JWT auth
```

---

## 📊 Qualidade & Testes

| Suite | Qtd | Ferramenta |
|-------|-----|------------|
| Backend (API) | **48 testes** | pytest + httpx + SQLite in-memory |
| Frontend (unit) | **189 testes** | vitest + @testing-library/react |
| Coverage frontend | **~79% stmts** (components) | @vitest/coverage-v8 |
| Linting | 0 erros | Ruff (lint + format) |
| Security | 0 issues | Bandit |
| Análise estática | Advisory | Pylint + SonarCloud |

### QA local

```bash
# Backend QA completo
cd backend && bash scripts/qa.sh

# Frontend testes + coverage
cd frontend && npm test && npm run coverage

# CI (GitHub Actions)
# .github/workflows/qa.yml — executa automaticamente em push/PR
```

---

## 🚀 Começando

### Pré-requisitos

- Python 3.12+ com `uv`
- Node.js 22+

### Backend

```bash
cd backend
uv sync                              # Instalar dependências
cp .env.example .env                 # Configurar
uv run python -m pytest tests/ -v    # Rodar testes
uv run uvicorn app.main:app --reload # Servidor dev :8000
```

📖 Docs da API em `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
npm run dev          # Servidor dev :5173 (proxy /api → :8000)
npm test             # Rodar testes
npm run coverage     # Coverage report
```

### Build produção

```bash
cd frontend
npm run build        # Gera em frontend/dist/
```

---

## 📁 Estrutura

```
mao-na-massa/
├── backend/
│   ├── app/
│   │   ├── base.py              # SQLAlchemy Base
│   │   ├── config.py            # Settings (Pydantic)
│   │   ├── database.py          # Engine async + WAL mode
│   │   ├── main.py              # FastAPI + CORS + CSP
│   │   ├── auth.py              # JWT auth
│   │   ├── models/              # ORM: +Notificacao, MovimentacaoEstoque
│   │   ├── schemas/             # Pydantic request/response
│   │   ├── routers/             # API: +dashboard, lista-compras, admin
│   │   └── services/            # Notificador (WhatsApp + Telegram)
│   ├── alembic/                 # Migrations
│   ├── scripts/
│   │   ├── qa.sh                # QA unificado (Ruff + Bandit + Pylint + Tests)
│   │   ├── backup_db.py         # Backup SQLite
│   │   └── seed_site_config.py  # Seed inicial
│   ├── sonar-project.properties
│   ├── pyproject.toml
│   └── railway.json
├── frontend/
│   ├── src/
│   │   ├── api/client.ts        # API client tipado com retry
│   │   ├── components/          # ~20 componentes reutilizáveis
│   │   ├── pages/               # 10 páginas (admin + tracking)
│   │   ├── services/            # db.ts (Dexie), mutationQueue, offlineClient
│   │   ├── utils/               # csv, errors, pedido, whatsapp
│   │   └── sw.ts                # Service Worker (Workbox)
│   └── package.json
├── docs/
│   ├── architecture.md
│   ├── briefing.md
│   ├── postgresql-migration.md  # Plano de migração SQLite → PostgreSQL
│   └── plans/
├── .github/workflows/qa.yml     # CI: lint + testes + SonarCloud
└── README.md
```

---

## 🔌 API Endpoints

Todas as rotas prefixadas com `/api/v1`.

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| **Auth** | | | |
| `POST` | `/admin/login` | Login com ADMIN_TOKEN → JWT (24h) | — |
| **Ingredientes** | | | |
| `GET` | `/ingredientes` | Listar (suporta `?search=&limite=`) | 🔒 |
| `POST` | `/ingredientes` | Criar | 🔒 |
| `PUT` | `/ingredientes/{id}` | Atualizar | 🔒 |
| `DELETE` | `/ingredientes/{id}` | Desativar | 🔒 |
| `POST` | `/ingredientes/{id}/movimentar` | Entrada/saída estoque | 🔒 |
| `GET` | `/ingredientes/{id}/movimentacoes` | Histórico | 🔒 |
| **Produtos** | | | |
| `GET` | `/produtos` | Listar (suporta `?search=`) | 🔒 |
| `POST` | `/produtos` | Criar | 🔒 |
| `GET` | `/produtos/{id}` | Detalhe | 🔒 |
| **Variações** | | | |
| `POST` | `/produtos/{id}/variacoes` | Criar | 🔒 |
| `GET` | `/variacoes/{id}/receita` | Itens da receita | 🔒 |
| `GET` | `/variacoes/{id}/custo` | Custo + preço sugerido | 🔒 |
| **Pedidos** | | | |
| `GET` | `/pedidos` | Listar (filtros) | 🔒 |
| `POST` | `/pedidos` | Criar | ⚡ rate limit |
| `PUT` | `/pedidos/{id}/status` | Atualizar status | 🔒 |
| **Tracking** | | | |
| `GET` | `/publico/pedidos/{token}` | Tracking (sem auth) | — |
| **Dashboard** | | | |
| `GET` | `/dashboard/hoje` | Resumo do dia | 🔒 |
| `GET` | `/dashboard/periodo` | Relatório período | 🔒 |
| `GET` | `/dashboard/mensal` | Faturamento mensal | 🔒 |
| `GET` | `/dashboard/top-produtos` | Mais vendidos | 🔒 |
| **Notificações** | | | |
| `GET` | `/notificacoes` | Listar | 🔒 |
| `POST` | `/notificacoes/{id}/ler` | Marcar lida | 🔒 |
| **Lista de Compras** | | | |
| `GET` | `/lista-compras` | Listar itens | 🔒 |
| `POST` | `/lista-compras` | Criar item | 🔒 |
| `POST` | `/lista-compras/salvar` | Salvar lista | 🔒 |
| `GET` | `/lista-compras/sugestoes` | Sugestões automáticas | 🔒 |

🔒 = Requer `Authorization: Bearer <JWT>`

---

## 🧮 Cálculo de Preço

```
custo_por_unidade = preco_ingrediente / embalagem
  Ex: Frango R$15,90 / 1000g = R$0,0159/g

custo_item = quantidade × custo_por_unidade
custo_unitario (variação) = Σ custo_item de todos ingredientes
preco_sugerido = custo_unitario × (1 + margem_percentual/100)
```

---

## 📐 Modelo de Dados

```
Produto (coxinha)
  └─ Variação (tradicional)
       ├─ preco_venda, margem_percentual
       └─ ReceitaItem (ingredientes)
            ├─ Farinha 30g, Frango 50g, Óleo 15ml
            └─ Cada ingrediente tem: nome, unidade, preço_atual

Pedido
  ├─ cliente_nome, whatsapp
  ├─ token_acesso (UUID → link tracking)
  ├─ status: recebido → producao → entrega → entregue
  └─ itens [variação + quantidade + preço + customizações]
```

---

## 🗺 Roadmap

- [x] **Fase 0/1 — Backend**: API REST completa com SQLite + Alembic
- [x] **Fase 2 — Frontend Admin**: React + Tailwind (Dashboard, CRUDs, Pedidos)
- [x] **Fase 2.5 — Tracking Público**: Link único por pedido + timeline
- [x] **Fase 2.6 — Notificações**: WhatsApp formatado + Telegram + in-app
- [x] **Fase 3 — PWA**: Service Worker, IndexedDB, fila offline, auto-sync
- [x] **Fase 3.5 — Estoque**: Movimentações, gráfico de nível, alertas
- [x] **Fase 4 — Qualidade**: Ruff, Bandit, Pylint, SonarCloud, 237 testes
- [ ] **Fase 5 — Deploy**: Railway (backend + frontend estático + PostgreSQL)
- [ ] **Fase 6 — Relatórios Avançados**: Sazonalidade, previsão, PDF

---

## 📝 Licença

Projeto de portfólio — uso livre.
