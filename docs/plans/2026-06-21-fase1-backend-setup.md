# Fase 1: Backend — Setup e Modelos de Dados

> **Para o agente:** Siga este plano task por task, em ordem.
>
> **Objetivo:** Configurar o projeto FastAPI + SQLite com todos os modelos de dados e schemas.
> **Arquitetura:** FastAPI + SQLAlchemy 2.0 assíncrono + SQLite + Pydantic v2
> **Stack:** Python 3.14, FastAPI, SQLAlchemy, Pydantic, Alembic

---

### Task 1.1: Configurar pyproject.toml e dependências

**Arquivos:**
- Criar: `backend/pyproject.toml`

**Passos:**
1. Criar `pyproject.toml` com dependências: fastapi, uvicorn, sqlalchemy, aiosqlite, alembic, pydantic-settings
2. Configurar tool.uv para usar Python 3.14+
3. Rodar `uv sync` pra instalar

---

### Task 1.2: Criar config.py e database.py

**Arquivos:**
- Criar: `backend/app/__init__.py`
- Criar: `backend/app/config.py`
- Criar: `backend/app/database.py`

**config.py:** Configurações via pydantic-settings (.env)
- DATABASE_URL (default sqlite+aiosqlite:///./mao-na-massa.db)
- CORS origins (default http://localhost:5173)

**database.py:** Engine SQLAlchemy assíncrono
- Criar engine com aiosqlite
- Sessão assíncrona
- Base declarativa
- Função init_db() que cria tabelas

---

### Task 1.3: Criar modelos SQLAlchemy (app/models/)

**Arquivos:**
- Criar: `backend/app/models/__init__.py`
- Criar: `backend/app/models/ingrediente.py`
- Criar: `backend/app/models/produto.py`
- Criar: `backend/app/models/variacao.py`
- Criar: `backend/app/models/receita_item.py`
- Criar: `backend/app/models/pedido.py`
- Criar: `backend/app/models/item_pedido.py`

**Modelos:**

**Ingrediente:**
- id, nome, unidade_medida (g, ml, un), preco_atual, ativo, created_at, updated_at
- Relacionamento: ingrediente → receita_item (1:N)

**Produto:**
- id, nome, descricao, ativo, imagem_url, created_at, updated_at
- Relacionamento: produto → variacao (1:N)

**Variacao:**
- id, produto_id (FK), nome (ex: "tradicional", "cheddar"), preco_venda, preco_minimo, margem_percentual, ativo, created_at, updated_at
- Relacionamento: variacao → receita_item (1:N)
- preco_minimo calculado = custo_unitario * (1 + margem/100), mas pode ser sobrescrito

**ReceitaItem:**
- id, variacao_id (FK), ingrediente_id (FK), quantidade (Float)
- Relacionamentos: variacao + ingrediente

**Pedido:**
- id, cliente_nome, cliente_whatsapp, token_acesso (UUID), status (enum: recebido, producao, entrega, entregue, cancelado), forma_pagamento, observacoes, total, created_at, updated_at, data_entrega
- Relacionamento: pedido → item_pedido (1:N)

**ItemPedido:**
- id, pedido_id (FK), variacao_id (FK), quantidade, preco_unitario, customizacoes (JSON), subtotal

---

### Task 1.4: Criar schemas Pydantic (app/schemas/)

**Arquivos:**
- Criar: `backend/app/schemas/__init__.py`
- Criar: `backend/app/schemas/ingrediente.py`
- Criar: `backend/app/schemas/produto.py`
- Criar: `backend/app/schemas/variacao.py`
- Criar: `backend/app/schemas/receita.py`
- Criar: `backend/app/schemas/pedido.py`
- Criar: `backend/app/schemas/dashboard.py`

Cada schema terá: Create, Update, Response (com FromAttributes)

---

### Task 1.5: Criar main.py com FastAPI app

**Arquivos:**
- Criar: `backend/app/main.py`

**Config:**
- Incluir todos os routers
- CORS middleware
- Evento startup: criar tabelas
- Prefixo /api/v1

---

### Task 1.6: Verificar setup — rodar e testar

**Comandos:**
```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload
```

Verificar que a documentação OpenAPI aparece em http://localhost:8000/docs
Verificar que o banco SQLite foi criado com as tabelas
