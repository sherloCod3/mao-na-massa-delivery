# Kanban de Pedidos — Gestão Visual com Transições Automáticas

> **Status:** 📋 Planejado
> **Branch:** `feat/kanban-pedidos`
> **Impacto:** 🔥 Alto — experiência central do admin
> **Estimativa total:** ~8h (reduzido de 10h após revisão FFCI)
> **FFCI:** 7/15 (Acceptable — após simplificações)

---

## 🎯 Problema

A admin gerencia pedidos em uma lista linear (tabela) e precisa avançar o status manualmente um a um. Não há visão consolidada do fluxo de produção — quantos pedidos estão em cada etapa, quais estão parados, quais precisam de atenção.

**Dores identificadas:**
1. Dificuldade de visualizar gargalos na produção
2. Status limitado — não há "pendente", "produzido" ou "pausado"
3. Transições de status puramente manuais
4. Sem histórico de mudanças de status (quem/pq mudou)

---

## ✅ Status Propostos (Padronizados em Português)

### 7 Status — Fluxo Canônico

```
┌─────────┐    ┌──────────┐    ┌───────────┐    ┌────────┐    ┌──────────┐
│ ⏳      │    │ 👩‍🍳     │    │ ✅       │    │ 🚚    │    │ 🎉      │
│ Pendente│───▶│ Produção │───▶│ Produzido │───▶│ Entrega│───▶│ Entregue │
└─────────┘    └──────────┘    └───────────┘    └────────┘    └──────────┘
      │              │              │              │
      │              │              │              │
      ▼              ▼              ▼              ▼
   ┌─────────────────────────────────────────────────────┐
   │                  ⏸️ Pausado / ❌ Cancelado            │
   │      (pode ser reativado para qualquer status)       │
   └─────────────────────────────────────────────────────┘
```

| Status | Descrição | Ícone | Gatilho |
|--------|-----------|-------|---------|
| `pendente` | Pedido recebido, aguardando início da produção | ⏳ | Automático ao criar pedido (substitui "recebido") |
| `producao` | Sendo produzido agora | 👩‍🍳 | Admin clica "Iniciar Produção" |
| `produzido` | Produção concluída, aguardando retirada/entrega | ✅ | Admin clica "Concluir Produção" |
| `entrega` | Saiu para entrega | 🚚 | Admin clica "Saiu para Entrega" |
| `entregue` | Entregue ao cliente | 🎉 | Admin confirma entrega |
| `pausado` | Produção pausada (falta insumo, cliente pediu, etc.) | ⏸️ | Admin clica "Pausar" + motivo |
| `cancelado` | Pedido cancelado | ❌ | Admin clica "Cancelar" + motivo |

### Regras de Transição

| De → Para | Automático | Manual |
|-----------|-----------|--------|
| pendente → producao | ❌ (decisão da admin) | ✅ Botão "Iniciar" ou arrastar |
| producao → produzido | ❌ (decisão da admin) | ✅ Botão "Concluir" ou arrastar |
| produzido → entrega | ❌ (decisão da admin) | ✅ Botão "Sair Entrega" ou arrastar |
| entrega → entregue | ❌ (decisão da admin) | ✅ Botão "Confirmar" ou arrastar |
| qualquer → pausado | ❌ | ✅ Botão "Pausar" + motivo obrigatório |
| pausado → qualquer | ❌ | ✅ Botão "Retomar" → volta ao status anterior |
| qualquer → cancelado | ❌ (decisão da admin) | ✅ Botão "Cancelar" + motivo obrigatório |

> 📐 **Decisão arquitetural:** Todas as transições são manuais. Sem automações agendadas — evita overengineering e surpresas para a admin. O ganho real está na **visibilidade** (kanban) e **agilidade** (um clique em vez de abrir pedido).

---

## 🗺 Roadmap de Implementação (3 Sprints)

### Sprint 1 (3h) — Backend: Modelo + API

**1.1. Atualizar Enum `StatusPedido`** (`backend/app/models/pedido.py`)

```python
class StatusPedido(StrEnum):
    pendente = "pendente"       # NOVO (substitui "recebido")
    producao = "producao"
    produzido = "produzido"     # NOVO
    entrega = "entrega"
    entregue = "entregue"
    pausado = "pausado"         # NOVO
    cancelado = "cancelado"
```

**1.2. Adicionar `status_anterior` ao Pedido** (`backend/app/models/pedido.py`)

```python
class Pedido(Base):
    # ... colunas existentes ...
    status_anterior: Mapped[str | None] = mapped_column(String(20), nullable=True)
    # ^ Guarda o status anterior quando pausado, para saber para onde retomar
```

**🔑 Por que `status_anterior` no modelo e não só no histórico?**
- O histórico registra *o que aconteceu*, mas `status_anterior` diz ao sistema *para onde voltar* quando retomar
- Evita consultas complexas no histórico para descobrir o status anterior

**1.3. Histórico de Status (NOVA tabela)** (`backend/app/models/status_history.py`)

```python
class StatusHistory(Base):
    __tablename__ = "status_history"

    id: Mapped[int] = mapped_column(primary_key=True)
    pedido_id: Mapped[int] = mapped_column(ForeignKey("pedidos.id"))
    status_anterior: Mapped[str | None]
    status_novo: Mapped[str]
    alterado_por: Mapped[str]   # "admin" | "sistema"
    motivo: Mapped[str | None]
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    pedido: Mapped["Pedido"] = relationship(back_populates="status_history")
```

**1.4. Schema de Histórico** (`backend/app/schemas/pedido.py`)

```python
class StatusHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    status_anterior: str | None
    status_novo: str
    alterado_por: str
    motivo: str | None
    created_at: datetime
```

**1.5. Atualizar `PedidoResponse`** — incluir `status_history: list[StatusHistoryResponse]`

**1.6. Novo Schema `PedidoPausar` / `PedidoRetomar`** (`backend/app/schemas/pedido.py`)

```python
class PedidoPausar(BaseModel):
    motivo: str = Field(min_length=3, description="Motivo obrigatório para pausar")

class PedidoCancelar(BaseModel):
    motivo: str = Field(min_length=3, description="Motivo obrigatório para cancelar")
```

**1.7. Novas Rotas** (`backend/app/routers/pedidos.py`)

```
PUT    /api/v1/pedidos/{id}/pausar       → Pausar pedido com motivo
PUT    /api/v1/pedidos/{id}/retomar      → Retomar para status_anterior
PUT    /api/v1/pedidos/{id}/cancelar     → Cancelar pedido com motivo
POST   /api/v1/pedidos/{id}/avancar      → Avançar 1 step (pendente→producao→produzido→entrega→entregue)
GET    /api/v1/pedidos/{id}/historico    → Histórico de status do pedido
```

**1.8. Atualizar Dashboard** (`backend/app/routers/dashboard.py`)
- Incluir `pendente` e `produzido` nos contadores de `pedidos_ativos`
- `pausado` não conta como ativo

**1.9. Atualizar Notificador** (`backend/app/services/notificador.py`)
- Adicionar emojis/mensagens para `pendente`, `produzido`, `pausado`

**1.10. Atualizar Router Público** (`backend/app/routers/publico.py`)
- O tracking público (cliente) deve continuar mostrando apenas os 4 status do fluxo linear (pendente→producao→entrega→entregue)
- `pausado` e `cancelado` devem aparecer como estados terminais no tracking

---

### Sprint 2 (3h) — Frontend: Visual Kanban (Button-First)

#### Princípios de Design (aplicando frontend-dev-guidelines adaptado)

| Princípio | Aplicação no Projeto |
|-----------|---------------------|
| Suspense-first | ❌ **Não aplicável** — projeto usa `useEffect` + state. Manter padrão existente. |
| Lazy loading | ✅ KanbanBoard deve ser lazy-loaded (`React.lazy`) |
| Feature boundaries | ✅ Komponentes novos em `components/`, lógica em `utils/` |
| Strict TypeScript | ✅ Sem `any`, `import type`, retornos explícitos |
| Performance | ✅ `useMemo` para listas filtradas, `useCallback` para handlers |
| Loading/Error | ✅ Usar `PageTransition` existente, `Toast` para feedback |
| Anti-patterns | ❌ Sem `isLoading` manual — manter padrão do projeto (loading state) |

**2.1. Botões de Ação Rápida nos Cards** (`frontend/src/pages/Pedidos.tsx`)

> **Decisão:** Botões first, drag-and-drop depois. A admin usa o sistema no celular — botões são mais confiáveis que drag-and-drop mobile.

Adicionar em cada linha da tabela (e card mobile) botões de ação contextual:

```
Status: Pendente → [▶ Iniciar Produção] [⏸️ Pausar] [❌ Cancelar]
Status: Produção → [✅ Concluir] [⏸️ Pausar] [❌ Cancelar]
Status: Produzido → [🚚 Sair p/ Entrega] [⏸️ Pausar] [❌ Cancelar]
Status: Entrega → [🎉 Confirmar Entrega] [⏸️ Pausar] [❌ Cancelar]
Status: Pausado → [▶ Retomar] [❌ Cancelar]
Status: Entregue → (sem ações)
Status: Cancelado → (sem ações)
```

**2.2. Indicador de Envelhecimento ("Aging")**

Destaque visual para pedidos parados no mesmo status por muito tempo:

| Tempo na coluna | Efeito |
|----------------|--------|
| < 30min | Normal |
| 30min – 1h | ⚠️ Fundo amarelo claro |
| 1h – 2h | 🟡 Badge "1h parado" |
| > 2h | 🔴 Badge "2h+ parado" + borda vermelha |

Isso substitui o cancelamento automático — a admin vê o problema e decide, em vez do sistema agir sem aviso.

**2.3. KanbanBoard Component** (NOVO: `frontend/src/components/KanbanBoard.tsx`)

```tsx
interface ColumnConfig {
  status: string
  label: string
  icon: string
  gradient: string  // Tailwind gradient class
}

interface KanbanBoardProps {
  pedidos: Pedido[]
  onStatusChange: (pedidoId: number, novoStatus: string) => Promise<void>
  onPausar: (pedidoId: number) => void
  onCancelar: (pedidoId: number) => void
}
```

**Layout:**
- **Desktop:** Colunas horizontais roláveis (overflow-x)
- **Mobile (padrão):** Seções verticais colapsáveis com accordion
  - Cada seção = um status
  - Header da seção mostra: ícone + label + contagem + aging alert
  - Cards em lista vertical dentro de cada seção
  - Botões de ação em cada card

**Estado vazio por coluna:** "Nenhum pedido pendente ✅" com tom otimista

**2.4. KanbanCard Component** (NOVO: `frontend/src/components/KanbanCard.tsx`)

```
┌──────────────────────────────┐
│ #42   Maria Silva    R$ 85,00│
│ ⏳ 3 itens • Pix • há 30min  │
│ [▶] [⏸️] [❌] [💬] [🔍]      │
└──────────────────────────────┘
```

- Botões de ação compactos no rodapé
- Badge de aging se aplicável
- Link para detalhe (navega para `/admin/pedidos/{id}`)

**2.5. Modal de Transição** (NOVO ou estender `ConfirmDialog`)

| Ação | Modal |
|------|-------|
| Avançar status | Toast de confirmação: "Pedido #42 movido para Produção" |
| Pausar | Modal com campo "Motivo da pausa" (obrigatório, min 3 caracteres) + Confirmar/Cancelar |
| Cancelar | Modal com campo "Motivo do cancelamento" (obrigatório) + Confirmar/Cancelar |
| Retomar | Toast de confirmação: "Pedido #42 retomado para Produção" |

**2.6. Integrar na Página Pedidos** (`frontend/src/pages/Pedidos.tsx`)

- Alternador de visualização: `[📋 Lista] [📊 Kanban]`
- Estado no URL: `/admin/pedidos?view=kanban`
- Filtros de data e busca funcionam nos dois modos
- Lazy load do KanbanBoard: `const KanbanBoard = React.lazy(() => import('../components/KanbanBoard'))`

**2.7. Atualizar PageHeader**
- Adicionar contagens: "📊 12 pendentes · 5 produção · 3 prontos · 2 entrega"

---

### Sprint 3 (2h) — Histórico + Offline + Polimento

**3.1. Timeline no Detalhe do Pedido** (`frontend/src/pages/PedidoDetalhe.tsx`)

Após o bloco de progresso de status, adicionar:

```
📋 Histórico de Status
─────────────────────
⏳ Pendente — há 2h
👩‍🍳 Produção — há 1h30min
⏸️ Pausado — há 45min (motivo: "Falta queijo")
👩‍🍳 Retomado — há 30min
✅ Produzido — há 5min
```

- Cada entrada com timestamp relativo e motivo (se houver)
- Scroll reverso (mais recente primeiro)

**3.2. Offline Support** (`frontend/src/services/offlineClient.ts`)

- `atualizarStatusOffline(id, novoStatus)` — usar mutation queue para transições offline
- Cache do kanban (status agrupados) para exibição offline
- Sincronizar fila ao ficar online (reutilizar `SyncStatus` existente)

**3.3. Error Recovery**

- Se uma transição falhar (rede), mostrar toast de erro e manter o card na coluna original
- Botão "Tentar novamente" ao lado do card que falhou
- Usar `mutationQueue` existente para retry automático quando online

**3.4. Drag-and-Drop como Enhancement (PÓS-MVP)**

> ⚠️ **Decisão FFCI:** Adiar @dnd-kit para versão 2.0 do kanban.
> - Botões resolvem 90% do caso de uso
> - Admin usa celular — DnD mobile é frustrante
> - Economiza 15KB+ no bundle
> - Reduz complexidade de estado significativamente

Se implementado no futuro:
```json
{
  "@dnd-kit/core": "^6.3.0",
  "@dnd-kit/sortable": "^10.0.0"
}
```

---

## 🧱 Arquitetura de Componentes (Final)

```
Pedidos.tsx
├── ViewToggle (Lista/Kanban)
├── Filtros de data e busca (reutilizado)
├── Contagens rápidas por status
│
├── [view=lista]
│   └── Tabela de pedidos (existente atualizada)
│       └── Botões de ação contextual por linha
│
├── [view=kanban] → lazy loaded
│   └── KanbanBoard
│       ├── Coluna/Secao Pendente (accordion mobile)
│       │   └── KanbanCard × N
│       ├── Coluna/Secao Produção
│       │   └── KanbanCard × N
│       ├── Coluna/Secao Produzido
│       │   └── KanbanCard × N
│       ├── Coluna/Secao Entrega
│       │   └── KanbanCard × N
│       ├── Coluna/Secao Entregue
│       │   └── KanbanCard × N
│       ├── Coluna/Secao Pausado
│       │   └── KanbanCard × N
│       └── Coluna/Secao Cancelado
│           └── KanbanCard × N
│
├── ModalPausar (ConfirmDialog estendido)
├── ModalCancelar (ConfirmDialog estendido)
└── Toast para feedback (reutilizado)

PedidoDetalhe.tsx
└── StatusHistoryTimeline (novo componente)
```

---

## 🗄️ Migração de Dados (Alembic)

### Migration 1: Adicionar colunas + alterar ENUM

SQLite não suporta ALTER ENUM. Estratégia:

1. Criar tabela `pedidos_v2` com:
   - Todas as colunas existentes + `status_anterior TEXT`
   - CHECK constraint para novos status
2. `INSERT INTO pedidos_v2 SELECT *, NULL FROM pedidos` (mapeando `recebido→pendente`)
3. `DROP TABLE pedidos`
4. `ALTER TABLE pedidos_v2 RENAME TO pedidos`

### Migration 2: Criar status_history

```sql
CREATE TABLE status_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    status_anterior TEXT,
    status_novo TEXT NOT NULL,
    alterado_por TEXT NOT NULL DEFAULT 'sistema',
    motivo TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_status_history_pedido ON status_history(pedido_id);
```

### Migration 3: Seed de histórico

```sql
INSERT INTO status_history (pedido_id, status_anterior, status_novo, alterado_por, created_at)
SELECT id, NULL, CASE WHEN status = 'recebido' THEN 'pendente' ELSE status END, 'sistema', created_at
FROM pedidos;
```

---

## 🔄 Fluxos de Transição (Detalhados)

### Fluxo 1: Avanço Padrão (botão "Avançar" ou ação rápida)

```
Status atual → Próximo status
pendente     → producao
producao     → produzido
produzido    → entrega
entrega      → entregue
```

🔧 Backend:
1. Valida se status atual está no fluxo canônico
2. Determina próximo status
3. Salva histórico com `alterado_por = "admin"`
4. Retorna pedido atualizado

### Fluxo 2: Pausar/Retomar

```
qualquer status → pausado
├── Salva status atual em `status_anterior` do Pedido
├── Cria registro no histórico com motivo
└── Notifica admin

pausado → status_anterior (ou especificado)
├── Lê `status_anterior` do Pedido
├── Cria registro no histórico
└── Limpa `status_anterior`
```

🔧 Backend:
```python
@pausar
pedido.status_anterior = pedido.status  # salva antes de mudar
pedido.status = "pausado"
# cria StatusHistory(status_anterior=antigo, status_novo="pausado", motivo=...)

@retomar
destino = pedido.status_anterior or "pendente"
pedido.status = destino
pedido.status_anterior = None
# cria StatusHistory(status_anterior="pausado", status_novo=destino)
```

### Fluxo 3: Cancelar

```
qualquer status → cancelado
├── Cria registro no histórico com motivo
└── Notifica admin
```

---

## 🎨 Design da Interface

### Colunas (Desktop)

| Coluna | Fundo | Header | Largura |
|--------|-------|--------|---------|
| ⏳ Pendente | `bg-amber-50` | `■ bg-amber-500` | 280px |
| 👩‍🍳 Produção | `bg-blue-50` | `■ bg-blue-500` | 280px |
| ✅ Produzido | `bg-emerald-50` | `■ bg-emerald-500` | 280px |
| 🚚 Entrega | `bg-purple-50` | `■ bg-purple-500` | 280px |
| 🎉 Entregue | `bg-green-50` | `■ bg-green-500` | 280px |
| ⏸️ Pausado | `bg-orange-50` | `■ bg-orange-500` | 280px |
| ❌ Cancelado | `bg-red-50` | `■ bg-red-500` | 280px |

### Mobile (Acordeão)

```
▼ ⏳ Pendente (12)  ⚠️ 1 há mais de 1h
  ┌─ Card ─────────────────────┐
  │ #42  Maria     R$ 85,00    │
  │ 3 itens • Pix • há 30min   │
  │ [▶Iniciar] [⏸️] [❌] [💬]  │
  └────────────────────────────┘
  ┌─ Card ─────────────────────┐
  │ #38  João      R$ 120,00   │
  │ ...                        │
  └────────────────────────────┘

▶ 👩‍🍳 Produção (5)
▶ ✅ Produzido (3)
▶ 🚚 Entrega (2)
▶ 🎉 Entregue (15)
▶ ⏸️ Pausado (1)
▶ ❌ Cancelado (2)
```

### Card (Kanban)

```
┌─────────────────────────┐
│ #42  ───  ⏰ há 30min   │  ← aging indicator
│ Maria Silva              │
│ R$ 85,00                │
│ 3 itens • Pix           │
│ [▶] [⏸️] [❌] [💬] [🔍]  │  ← action buttons
└─────────────────────────┘
```

---

## 📦 Dependências

### Frontend (novas)
Nenhuma — o MVP usa apenas botões. @dnd-kit fica para enhancement futuro.

### Backend (novas)
Nenhuma — apenas migration Alembic.

---

## 🚫 Não Escopo (nesta fase)

- Drag-and-drop (@dnd-kit fica para enhancement futuro)
- Agendador/automações temporais
- Priorização por score
- WIP limits configuráveis
- Integração com iFood/WhatsApp para criação automática
- Geolocalização de entregadores
- Múltiplos usuários admin
- Impressão de comandas

---

## 📊 Métricas de Sucesso

1. **Tempo para transicionar pedido (pendente→producao)** — deve reduzir com visibilidade
2. **Quantidade de pedidos pausados por >1h** — deve reduzir pois admin vê aging
3. **Adoção do kanban vs lista** — medir por view mode escolhido

---

## Exemplo de Uso

```
🧑‍🍳 Admin cria pedido → status "pendente"

Admin vê no kanban:
  ⏳ Pendente (3)
  👩‍🍳 Produção (2)
  ✅ Produzido (1) ← precisa despachar!
  🚚 Entrega (0)
  🎉 Entregue (15)

Admin clica [▶ Iniciar] no pedido #42 → vai para Produção
  Toast: "Pedido #42 em produção"
  Coluna Produção agora mostra (3)

Admin percebe pedido #38 pendente há 2h → destaque vermelho
  Decide pausar: clica [⏸️] → modal "Motivo: Aguardando cliente confirmar"
  Card vai para Pausado

Mais tarde admin retoma: clica [▶ Retomar] → volta para Pendente
```

---

## Arquivos Alterados (Resumo)

| Arquivo | Tipo | Mudança |
|---------|------|---------|
| `backend/app/models/pedido.py` | Model | Atualizar StatusPedido + add status_anterior |
| `backend/app/models/__init__.py` | Model | Adicionar import |
| `backend/app/models/status_history.py` | Model | NOVO |
| `backend/alembic/versions/...` | Migration | 3 migrations |
| `backend/app/schemas/pedido.py` | Schema | Adicionar StatusHistoryResponse, PedidoPausar, PedidoCancelar |
| `backend/app/routers/pedidos.py` | Router | +5 rotas, atualizar fluxo |
| `backend/app/routers/publico.py` | Router | Atualizar tracking p/ novos status |
| `backend/app/routers/dashboard.py` | Router | Atualizar contadores |
| `backend/app/services/notificador.py` | Service | Novos status |
| `frontend/src/components/KanbanBoard.tsx` | Component | NOVO (lazy loaded) |
| `frontend/src/components/KanbanCard.tsx` | Component | NOVO |
| `frontend/src/components/StatusHistoryTimeline.tsx` | Component | NOVO |
| `frontend/src/pages/Pedidos.tsx` | Page | +Kanban view + botões de ação |
| `frontend/src/pages/PedidoDetalhe.tsx` | Page | +Timeline |
| `frontend/src/utils/pedido.ts` | Util | Atualizar constantes (STATUS_FLOW, cores) |
| `frontend/src/api/client.ts` | API | +5 novos endpoints |
| `frontend/src/services/offlineClient.ts` | Service | +transições offline |
| `frontend/src/utils/pedido.ts` | Util | +funções aging, +constant status_anterior |

---

## Histórico de Revisões

| Data | Versão | Mudanças |
|------|--------|----------|
| 2026-07-01 | v1 | Versão inicial (10h, 4 sprints, FFCI 4) |
| 2026-07-01 | v2 | **Revisão FFCI:** Removido WIP limits, scheduler, auto-cancel, priority scoring. @dnd-kit movido para enhancement. Adicionado status_anterior, aging indicator, offline suporte. Reduzido para 8h (3 sprints). FFCI agora 7. |
