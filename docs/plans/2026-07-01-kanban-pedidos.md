# Kanban de Pedidos — Gestão Visual com Transições Automáticas

> **Status:** 📋 Planejado
> **Branch:** `feat/kanban-pedidos`
> **Impacto:** 🔥 Alto — experiência central do admin
> **Estimativa total:** ~10h

---

## 🎯 Problema

A admin gerencia pedidos em uma lista linear (tabela) e precisa avançar o status manualmente um a um. Não há visão consolidada do fluxo de produção — quantos pedidos estão em cada etapa, quais estão parados, quais precisam de atenção.

**Dores identificadas:**
1. Dificuldade de visualizar gargalos na produção (ex: muitos pedidos "recebidos" sem entrar em produção)
2. Status limitado — não há "pendente", "produzido" ou "pausado"
3. Sem reordenação visual (drag-and-drop) entre colunas
4. Transições de status só acontecem manualmente, sem automatismos
5. Sem histórico de mudanças de status (quem/pq mudou)

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

| Status | Descrição | Ícone | Ação Automática |
|--------|-----------|-------|-----------------|
| `pendente` | Pedido recebido, aguardando início da produção | ⏳ | Criado automaticamente ao receber pedido |
| `producao` | Sendo produzido agora | 👩‍🍳 | Ao clicar "Iniciar Produção" ou automaticamente no horário agendado |
| `produzido` | Produção concluída, aguardando retirada/entrega | ✅ | Ao marcar produção como concluída |
| `entrega` | Saiu para entrega | 🚚 | Ao gerar rota de entrega |
| `entregue` | Entregue ao cliente | 🎉 | Ao confirmar entrega (ou tracking geográfico) |
| `pausado` | Produção pausada por falta de insumo, cliente pediu pra parar, etc. | ⏸️ | Manual |
| `cancelado` | Pedido cancelado pelo admin ou cliente | ❌ | Manual, ou automaticamente se não entrar em produção em N dias |

### Regras de Transição

| De → Para | Automático | Manual |
|-----------|-----------|--------|
| pendente → producao | ✅ Ao iniciar produção no horário agendado | ✅ Drag p/ coluna "Produção" |
| producao → produzido | ✅ Ao marcar último item como produzido | ✅ Drag p/ coluna "Produzido" |
| produzido → entrega | ✅ Ao gerar rota de entrega | ✅ Drag p/ coluna "Entrega" |
| entrega → entregue | ✅ Ao confirmar entrega | ✅ Drag p/ coluna "Entregue" |
| qualquer → pausado | ❌ | ✅ Botão "Pausar" + motivo |
| pausado → qualquer | ❌ | ✅ Botão "Retomar" → volta ao status anterior |
| qualquer → cancelado | ✅ Se pendente por >48h | ✅ Botão "Cancelar" + motivo |
| produzido → producao | ❌ | ✅ Retroceder manualmente |
| entrega → produzido | ❌ | ✅ Retroceder manualmente |

---

## 🗺 Roadmap de Implementação

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

**Migração necessária:** Criar migration Alembic para:
- `recebido → pendente` nos registros existentes
- Adicionar novos valores ao ENUM

**1.2. Histórico de Status (NOVA tabela)** (`backend/app/models/status_history.py`)

```python
class StatusHistory(Base):
    __tablename__ = "status_history"

    id: Mapped[int] = mapped_column(primary_key=True)
    pedido_id: Mapped[int] = mapped_column(ForeignKey("pedidos.id"))
    status_anterior: Mapped[str | None]
    status_novo: Mapped[str]
    alterado_por: Mapped[str]   # "admin" | "sistema" | "cliente"
    motivo: Mapped[str | None]
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    pedido: Mapped["Pedido"] = relationship(back_populates="status_history")
```

**1.3. Schema de Histórico** (`backend/app/schemas/pedido.py`)

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

**1.4. Atualizar `PedidoResponse`** — incluir `status_history: list[StatusHistoryResponse]`

**1.5. Novo Schema `PedidoPausar` / `PedidoRetomar`**

```python
class PedidoPausar(BaseModel):
    motivo: str = Field(min_length=3)

class PedidoRetomar(BaseModel):
    # Opcional: para qual status retomar (padrão = anterior)
    status_destino: str | None = None
```

**1.6. Novas Rotas**

```
PUT    /api/v1/pedidos/{id}/pausar       → Pausar pedido com motivo
PUT    /api/v1/pedidos/{id}/retomar      → Retomar para status anterior (ou especificado)
GET    /api/v1/pedidos/{id}/historico    → Histórico de status
POST   /api/v1/pedidos/{id}/avancar      → Avançar 1 step no fluxo automático
```

**1.7. Atualizar Dashboard** (`backend/app/routers/dashboard.py`)
- Incluir `pendente` e `produzido` nos contadores de `pedidos_ativos`
- `pausado` não conta como ativo

**1.8. Atualizar Notificador** (`backend/app/services/notificador.py`)
- Adicionar emojis/mensagens para `pendente`, `produzido`, `pausado`

---

### Sprint 2 (4h) — Frontend: Kanban Board

**2.1. Componente KanbanBoard** (NOVO: `frontend/src/components/KanbanBoard.tsx`)

```tsx
// Props:
interface KanbanBoardProps {
  pedidos: Pedido[]
  onStatusChange: (pedidoId: number, novoStatus: string) => Promise<void>
  columns: KanbanColumn[]
}

interface KanbanColumn {
  status: string
  label: string
  icon: string
  color: string  // cor de fundo/borda da coluna
  limit?: number  // WIP limit (opcional)
}
```

Features:
- Layout horizontal rolável com colunas fixas
- Cada coluna mostra: título, contagem, WIP limit (se configurado)
- Cards dentro de cada coluna com info resumida: ID, cliente, total, ícones de ação
- **Drag-and-drop** entre colunas (usando `@dnd-kit/core`)
- Loading state por coluna durante transição
- Estado vazio: "Nenhum pedido nesta coluna" com animação
- Responsivo: em mobile, colunas empilham verticalmente

**2.2. Card de Pedido no Kanban** (NOVO: `frontend/src/components/KanbanCard.tsx`)

- #ID, nome do cliente, total
- Tempo desde que está na coluna (ex: "há 30min")
- Botões de ação rápida: WhatsApp, Detalhe
- Indicador visual de prioridade (se configurado)
- Design compacto, com hover states

**2.3. Integrar Kanban na Página de Pedidos** (`frontend/src/pages/Pedidos.tsx`)

- Alternador: `[📋 Lista] [📊 Kanban]` — manter ambos disponíveis
- Estado `viewMode: 'lista' | 'kanban'` no URL (ex: `/admin/pedidos?view=kanban`)
- Botões de filtro de data e busca funcionam nos dois modos

**2.4. Modal de Transição Manual** (NOVO ou reutilizar `ConfirmDialog`)

Ao arrastar card para nova coluna:
- Se for transição normal → confirmar com toast
- Se for `pausado` → abrir modal com campo "Motivo da pausa"
- Se for `cancelado` → abrir modal com campo "Motivo do cancelamento"
- Se for retorno de `pausado` → mostrar "Retomando pedido"

**2.5. Atualizar PageHeader / Sidebar**
- Adicionar contagens por status ao lado dos filtros
- Badge vermelho na coluna se passar do WIP limit

---

### Sprint 3 (2h) — Automações Inteligentes

**3.1. Agendador de Produção** (Backend)

```python
# Em app/services/producao_scheduler.py
async def avancar_pendentes_para_producao():
    """Todo dia às 8h, avança pedidos pendentes → producao
    se tiverem data_entrega para hoje."""
```

**Tarefa recorrente:** Usar BackgroundTasks ou schedule leve no startup.

**3.2. Cancelamento Automático por Inatividade**

```python
async def cancelar_pendentes_expirados():
    """Cancela pedidos pendentes há mais de 48h
    (configurável via site_config 'pedidos_expiracao_horas')."""
```

**3.3. Sugestão de Priorização**

No backend, endpoint `GET /api/v1/pedidos/sugestoes-prioridade`:
- Pedidos com `data_entrega` mais próxima → maior prioridade
- Pedidos com muitos itens → maior prioridade
- Pedidos parados há muito tempo → maior prioridade
- Retorna score (0-100) para ordenar cards no kanban

**3.4. Notificações Automáticas**

- Ao entrar em `producao`: notificar admin "Pedido #X entrou em produção"
- Ao entrar em `produzido`: notificar admin "Pedido #X está pronto"
- Ao entrar em `entregue`: notificar admin "Pedido #X foi entregue"

---

### Sprint 4 (1h) — Histórico de Status

**4.1. Timeline no Detalhe do Pedido** (`frontend/src/pages/PedidoDetalhe.tsx`)

- Abaixo do progresso de status, adicionar timeline vertical:
```
⏳ Pendente — há 2h (admin)
👩‍🍳 Produção — há 1h30min (sistema: agendador)
⏸️ Pausado — há 45min (admin: "Falta queijo")
👩‍🍳 Retomado — há 30min (admin)
✅ Produzido — há 5min (admin)
```

- Cada entrada mostra: status, timestamp relativo, quem alterou, motivo (se houver)

**4.2. Indicador de Tempo em Cada Status**

- Coluna "Tempo em produção" no kanban e na lista
- Destacar em vermelho se um pedido está em `pendente` há mais tempo que o esperado

---

## 🧱 Arquitetura de Componentes

```
Pedidos.tsx
├── ViewToggle (Lista/Kanban)
├── Filtros de data e busca (reutilizado)
│
├── [view=lista]
│   └── Tabela de pedidos (existente, com colunas de status atualizadas)
│
├── [view=kanban]
│   ├── KanbanBoard
│   │   ├── KanbanColumn (pendente)
│   │   │   └── KanbanCard × N
│   │   ├── KanbanColumn (producao)
│   │   │   └── KanbanCard × N
│   │   ├── KanbanColumn (produzido)
│   │   │   └── KanbanCard × N
│   │   ├── KanbanColumn (entrega)
│   │   │   └── KanbanCard × N
│   │   ├── KanbanColumn (entregue)
│   │   │   └── KanbanCard × N
│   │   ├── KanbanColumn (pausado)
│   │   │   └── KanbanCard × N
│   │   └── KanbanColumn (cancelado)
│   │       └── KanbanCard × N
│   │
│   └── StatusModal (confirmar/cancelar/pausar)
│
└── PedidoDetalhe.tsx (links)
    └── StatusHistoryTimeline
```

---

## 📦 Dependências

### Frontend (novas)
```json
{
  "@dnd-kit/core": "^6.3.0",
  "@dnd-kit/sortable": "^10.0.0"
}
```

**Alternativa:** `react-beautiful-dnd` (mantido? Não — não atualiza mais). Usar `@dnd-kit` que é o padrão da indústria em 2026.

### Backend (novas)
Nenhuma dependência externa. Apenas:
- Migration Alembic para novo ENUM + tabela `status_history`
- `apscheduler` ou similar para tarefas agendadas (opcional)

---

## 🗄️ Migração de Dados (Alembic)

### Migration 1: Alterar ENUM

```sql
-- SQLite não suporta ALTER ENUM diretamente
-- Estratégia: CREATE TABLE novo, INSERT, DROP TABLE antigo, RENAME
```

Passos:
1. Criar tabela temporária com novos status
2. Migrar `recebido → pendente`
3. Copiar dados
4. Renomear

### Migration 2: Criar status_history

```sql
CREATE TABLE status_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pedido_id INTEGER NOT NULL REFERENCES pedidos(id),
    status_anterior TEXT,
    status_novo TEXT NOT NULL,
    alterado_por TEXT NOT NULL DEFAULT 'sistema',
    motivo TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Migration 3: Seed de histórico

Para pedidos existentes, criar entrada inicial no `status_history`:
```sql
INSERT INTO status_history (pedido_id, status_anterior, status_novo, alterado_por, created_at)
SELECT id, NULL, status, 'sistema', created_at FROM pedidos;
```

---

## 🔄 Fluxos de Transição Automática

### Fluxo 1: Avanço Padrão (botão "Avançar" ou drag)

```
Status atual → Próximo status na ordem canônica
pendente     → producao
producao     → produzido
produzido    → entrega
entrega      → entregue
```

**Regras:**
- Só avança se o status atual for um dos 5 do fluxo canônico
- `pausado` e `cancelado` não podem "avançar" — precisam de ação específica
- Ao avançar, registrar `alterado_por = "admin"` (ou `"sistema"` se automático)

### Fluxo 2: Pausar/Retomar

```
qualquer status → pausado
  ├── Exige motivo obrigatório
  ├── Salva qual era o status anterior
  └── Notifica admin

pausado → status anterior (ou especificado)
  ├── Motivo opcional
  └── Notifica admin
```

### Fluxo 3: Cancelar

```
qualquer status → cancelado
  ├── Exige motivo obrigatório
  ├── Se pendente há >48h: automático
  └── Notifica admin
```

---

## 🎨 Design da Interface Kanban

### Colunas

| Coluna | Fundo | Borda | Header |
|--------|-------|-------|--------|
| ⏳ Pendente | `bg-amber-50` | `border-amber-200` | `■ bg-amber-500` |
| 👩‍🍳 Produção | `bg-blue-50` | `border-blue-200` | `■ bg-blue-500` |
| ✅ Produzido | `bg-emerald-50` | `border-emerald-200` | `■ bg-emerald-500` |
| 🚚 Entrega | `bg-purple-50` | `border-purple-200` | `■ bg-purple-500` |
| 🎉 Entregue | `bg-green-50` | `border-green-200` | `■ bg-green-500` |
| ⏸️ Pausado | `bg-orange-50` | `border-orange-200` | `■ bg-orange-500` |
| ❌ Cancelado | `bg-red-50` | `border-red-200` | `■ bg-red-500` |

### Card

```
┌─────────────────────────┐
│ #42  ───  há 30min      │
│ Maria Silva              │
│ R$ 85,00  💬 🔍         │
│─────────────────────────│
│ 3 itens • Pix           │
└─────────────────────────┘
```

### WIP Limits (configuráveis via `site_config`)

| Coluna | Limite Sugerido |
|--------|----------------|
| Pendente | Sem limite |
| Produção | 5 |
| Produzido | 10 |
| Entrega | 3 |
| Entregue | Sem limite |
| Pausado | Sem limite |
| Cancelado | Sem limite |

---

## 🚫 Não Escopo (nesta fase)

- Integração com iFood/WhatsApp para criação automática de pedidos
- Geolocalização de entregadores
- Múltiplos usuários admin (roles/permissões)
- Notificações push para cliente
- Estimativa de tempo por coluna (ex: "tempo médio em produção: 45min")
- Impressão de comandas

---

## 📊 Métricas de Sucesso

1. **Tempo médio entre pedido e entrada em produção** — deve reduzir com automação
2. **Pedidos pausados por mais de 1h** — deve reduzir com visibilidade
3. **Uso do kanban vs lista** — métrica de adoção
4. **Transições automáticas vs manuais** — quanto o sistema está ajudando

---

## Exemplo de Uso

```
🧑‍🍳 Cliente liga: "Quero 20 coxinhas para entregar às 18h"

Admin cria pedido → status "pendente" (automático)
  ⏳ Card aparece na coluna Pendente

Às 14h, admin arrasta card para "Produção"
  👩‍🍳 Card vai para coluna Produção
  📱 WhatsApp automático para cliente: "Seu pedido está sendo preparado!"

Quando todas as coxinhas são produzidas → admin clica "Concluir Produção"
  ✅ Card vai para coluna Produzido

Às 17h30, admin arrasta para "Entrega"
  🚚 Card vai para coluna Entrega
  📱 WhatsApp: "Seu pedido saiu para entrega!"

Cliente recebe → admin arrasta para "Entregue"
  🎉 Card vai para coluna Entregue
  📱 WhatsApp: "Seu pedido foi entregue! 🎉"

Se faltar queijo:
  ⏸️ Admin pausa o pedido com motivo "Falta queijo"
  Card vai para coluna Pausado
  Quando queijo chegar, admin retoma para "Produção"
```

---

## Arquivos Alterados (Resumo)

| Arquivo | Tipo | Mudança |
|---------|------|---------|
| `backend/app/models/pedido.py` | Model | Atualizar StatusPedido enum |
| `backend/app/models/__init__.py` | Model | Adicionar import |
| `backend/app/models/status_history.py` | Model | NOVO |
| `backend/alembic/versions/...` | Migration | 3 migrations |
| `backend/app/schemas/pedido.py` | Schema | Adicionar StatusHistory |
| `backend/app/routers/pedidos.py` | Router | +4 rotas, atualizar fluxo |
| `backend/app/routers/dashboard.py` | Router | Atualizar contadores |
| `backend/app/services/notificador.py` | Service | Novos status |
| `backend/app/services/producao_scheduler.py` | Service | NOVO |
| `frontend/src/components/KanbanBoard.tsx` | Component | NOVO |
| `frontend/src/components/KanbanCard.tsx` | Component | NOVO |
| `frontend/src/components/StatusModal.tsx` | Component | NOVO |
| `frontend/src/components/StatusHistoryTimeline.tsx` | Component | NOVO |
| `frontend/src/pages/Pedidos.tsx` | Page | +Kanban view |
| `frontend/src/pages/PedidoDetalhe.tsx` | Page | +Timeline |
| `frontend/src/utils/pedido.ts` | Util | Atualizar constantes |
| `frontend/src/api/client.ts` | API | +novos endpoints |
| `frontend/src/services/offlineClient.ts` | Service | Atualizar cache |
| `frontend/package.json` | Config | +@dnd-kit |
