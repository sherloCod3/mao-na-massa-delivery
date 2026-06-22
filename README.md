# 🍳 Mão na Massa

**Gestão de produção e vendas artesanais**

Sistema completo para gerenciar produção, custos, preços e pedidos de salgados, doces e outros produtos artesanais. Multi-produto com variações (tradicional, cheddar, vegano) e customizações opcionais.

---

## ✨ Funcionalidades

| Funcionalidade | Descrição |
|---|---|
| **📦 Ingredientes** | Cadastro com preço por embalagem (ex: R$15,90/kg). Conversão automática para custo por grama/ml |
| **🍪 Produtos & Variações** | Coxinha (tradicional, cheddar), pudim, etc. Cada variação com sua própria receita e margem |
| **💰 Cálculo de Custo** | Custo unitário automático com base nos ingredientes da receita. Preço sugerido = custo × (1 + margem%) |
| **📋 Pedidos** | Cadastro com múltiplos itens, customizações, formas de pagamento. Total calculado automaticamente |
| **🔄 Status Tracking** | Fluxo: recebido → produção → entrega → entregue. Atualização com 1 clique |
| **🔗 Tracking Público** | Link único por pedido (sem login). Cliente acompanha em tempo real via WhatsApp |
| **📊 Dashboard** | Visão geral do dia: pedidos ativos, faturamento, entregas, distribuição por status |
| **📱 PWA** | Progressive Web App — funciona offline (em desenvolvimento) |

---

## 🏗 Stack

```
Frontend:  React 19 + TypeScript + Vite 8 + Tailwind CSS 4 + React Router 7
Backend:   Python 3.14 + FastAPI + SQLAlchemy 2.0 (async) + SQLite (aiosqlite)
Infra:     Monorepo | PWA offline-ready | Zero login para clientes
```

---

## 🚀 Começando

### Pré-requisitos

- Python 3.12+ com `uv`
- Node.js 22+

### Backend

```bash
cd backend
uv sync                    # Instalar dependências
cp .env.example .env       # Configurar (padrão SQLite local)
uv run uvicorn app.main:app --reload
```

Servidor em `http://localhost:8000` — Docs da API em `/docs`

### Frontend

```bash
cd frontend
npm install                 # Instalar dependências
npm run dev                 # Servidor dev em :5173
```

O frontend faz proxy de `/api/*` para o backend.

### Build produção

```bash
cd frontend
npm run build              # Gera em frontend/dist/
```

---

## 📁 Estrutura

```
mao-na-massa/
├── backend/
│   ├── app/
│   │   ├── base.py              # SQLAlchemy Base
│   │   ├── config.py            # Config (Pydantic Settings)
│   │   ├── database.py          # Engine & session async
│   │   ├── main.py              # FastAPI app + CORS + lifespan
│   │   ├── models/              # ORM: Ingrediente, Produto, Variacao,
│   │   │                        #        ReceitaItem, Pedido, ItemPedido
│   │   ├── schemas/             # Pydantic: request/response
│   │   ├── routers/             # API: ingredientes, produtos, variacoes,
│   │   │                        #       pedidos, publico, dashboard
│   │   └── services/            # (reservado)
│   ├── pyproject.toml
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── api/client.ts        # API client tipado
│   │   ├── components/          # Layout, Sidebar
│   │   ├── pages/               # Dashboard, Ingredientes, Produtos,
│   │   │                        #   Pedidos, PedidoNovo, PedidoDetalhe,
│   │   │                        #   PublicTracking
│   │   ├── App.tsx              # React Router
│   │   └── main.tsx             # Entry point
│   └── package.json
└── docs/
    ├── architecture.md          # Arquitetura completa
    └── plans/                   # Planos de implementação
```

---

## 🔌 API Endpoints

| Método | Rota | Descrição |
|---|---|---|
| **Ingredientes** | | |
| `GET` | `/api/v1/ingredientes` | Listar todos |
| `POST` | `/api/v1/ingredientes` | Criar |
| `PUT` | `/api/v1/ingredientes/{id}` | Atualizar |
| `DELETE` | `/api/v1/ingredientes/{id}` | Desativar |
| **Produtos** | | |
| `GET` | `/api/v1/produtos` | Listar (com variações) |
| `POST` | `/api/v1/produtos` | Criar |
| `GET` | `/api/v1/produtos/{id}` | Detalhe |
| **Variações** | | |
| `GET` | `/api/v1/produtos/{id}/variacoes` | Listar por produto |
| `POST` | `/api/v1/produtos/{id}/variacoes` | Criar |
| `PUT` | `/api/v1/variacoes/{id}` | Atualizar |
| `GET` | `/api/v1/variacoes/{id}/receita` | Itens da receita |
| `POST` | `/api/v1/variacoes/{id}/receita` | Adicionar ingrediente |
| `DELETE` | `/api/v1/receita/{id}` | Remover ingrediente |
| `GET` | `/api/v1/variacoes/{id}/custo` | Cálculo de custo + preço sugerido |
| **Pedidos** | | |
| `GET` | `/api/v1/pedidos` | Listar |
| `POST` | `/api/v1/pedidos` | Criar |
| `GET` | `/api/v1/pedidos/{id}` | Detalhe |
| `PUT` | `/api/v1/pedidos/{id}/status` | Atualizar status |
| `DELETE` | `/api/v1/pedidos/{id}` | Cancelar |
| **Público** | | |
| `GET` | `/api/v1/publico/pedidos/{token}` | Tracking (sem auth) |
| **Dashboard** | | |
| `GET` | `/api/v1/dashboard/hoje` | Resumo do dia |

---

## 🧮 Cálculo de Preço

```
custo_por_unidade = preco_ingrediente / embalagem
  Ex: Frango R$15,90 / 1000g = R$0,0159/g

custo_item = quantidade × custo_por_unidade
  Ex: 50g × R$0,0159 = R$0,80

custo_unitario (variação) = Σ custo_item de todos ingredientes
preco_sugerido = custo_unitario × (1 + margem_percentual/100)
```

---

## 📐 Modelo de Dados

```
Produto (coxinha)
  └─ Variação (tradicional)
       ├─ preco_venda: R$ 5,00
       ├─ margem_percentual: 60%
       └─ ReceitaItem (ingredientes)
            ├─ Farinha 30g
            ├─ Frango 50g
            └─ Óleo 15ml

Pedido
  ├─ cliente_nome, whatsapp
  ├─ status: recebido → producao → entrega → entregue
  ├─ token_acesso (UUID, tracking público)
  └─ itens
       ├─ variação + quantidade + preço
       └─ customizações (cheddar +R$1,00)
```

---

## 🗺 Roadmap

- [x] **Fase 0/1 — Backend**: API REST completa com banco SQLite
- [x] **Fase 2 — Frontend Admin**: React + Tailwind (Dashboard, CRUDs, Pedidos)
- [x] **Fase 2.5 — Tracking Público**: Página de acompanhamento para cliente
- [ ] **Fase 3 — PWA**: Service Worker, IndexedDB, modo offline
- [ ] **Fase 4 — Deploy**: Docker, deploy em servidor VPS
- [ ] **Fase 5 — Relatórios**: Gráficos de faturamento, custos, sazonalidade
- [ ] **Fase 6 — Notificações**: Alertas de pedidos por WhatsApp/Telegram

---

## 📝 Licença

Projeto de portfólio — uso livre.
