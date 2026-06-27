# Migração SQLite → PostgreSQL

> **Status:** 📋 Planejado (não urgente)
> **Quando migrar:** Quando houver necessidade de múltiplos workers, concorrência real, ou backup point-in-time gerenciado.
> **Estimativa:** ~2 horas

---

## 1. Por que migrar?

| Motivo | SQLite (atual) | PostgreSQL |
|--------|---------------|------------|
| Concorrência | Apenas 1 escritor por vez | Leituras/escritas simultâneas |
| Escalabilidade | Teto ~100 conexões concorrentes | Milhares de conexões |
| Backup point-in-time | Script manual (`pg_dump`) | Gerenciado pelo Railway |
| Integridade em crash | WAL mode já configurado | WAL nativo + crash recovery |
| Railway integração | Volume efêmero `/data/` | Plugin gerenciado (1 clique) |

> ⚠️ **Para o estágio atual do projeto, SQLite + Volume Railway é suficiente.**  
> PostgreSQL só é recomendado quando o volume de pedidos crescer significativamente.

---

## 2. Impacto no Railway

| Aspecto | Antes (SQLite) | Depois (PostgreSQL) |
|---------|---------------|---------------------|
| Serviço de banco | Volume `/data/` no mesmo container | Plugin PostgreSQL separado |
| Custo adicional | Nenhum | **+$5/mês** (Starter) |
| `railway.json` | `volumeMounts` obrigatório | Remover `volumeMounts` |
| Variáveis de ambiente | `SQLITE_PATH` | `DATABASE_URL` fornecida pelo Railway |
| Backup | Script `backup_db.py` | Nativo do Railway |

---

## 3. Mudanças no Código

### 3.1 Dependências (`pyproject.toml`)

```diff
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.34.0",
    "sqlalchemy[asyncio]>=2.0.36",
-   "aiosqlite>=0.20.0",
+   "asyncpg>=0.30.0",
    "alembic>=1.14.0",
    "pydantic-settings>=2.7.0",
    "pydantic>=2.10.0",
    "httpx>=0.28.1",
    "slowapi>=0.1.10",
]
```

### 3.2 Config (`config.py`)

```diff
-class Settings(BaseSettings):
-    database_url: str = "sqlite+aiosqlite:///./mao-na-massa.db"
+class Settings(BaseSettings):
+    database_url: str = "postgresql+asyncpg://localhost:5432/mao-na-massa"
```

No Railway, a variável `DATABASE_URL` será fornecida automaticamente pelo plugin PostgreSQL.

### 3.3 Database (`database.py`)

Remover código específico do SQLite:

```diff
-def _ensure_db_dir(db_url: str) -> str:
-    """Extract the file path from a SQLite URL and ensure its parent directory exists."""
-    prefix = "sqlite+aiosqlite:///"
-    if not db_url.startswith(prefix):
-        return db_url
-    path_str = db_url[len(prefix):]
-    db_path = Path(path_str)
-    db_path.parent.mkdir(parents=True, exist_ok=True)
-    return db_url

-engine = create_async_engine(_ensure_db_dir(settings.database_url), echo=False)

-@event.listens_for(engine.sync_engine, "connect")
-def _set_sqlite_pragma(dbapi_connection, _connection_record):
-    cursor = dbapi_connection.cursor()
-    cursor.execute("PRAGMA journal_mode=WAL")
-    cursor.execute("PRAGMA synchronous=NORMAL")
-    cursor.execute("PRAGMA busy_timeout=5000")
-    cursor.execute("PRAGMA foreign_keys=ON")
-    cursor.close()
+engine = create_async_engine(settings.database_url, echo=False)
```

### 3.4 Backup Script (`scripts/backup_db.py`)

Reescrever de `sqlite3` para `pg_dump`:

```python
import subprocess
from app.config import settings

# Extrair configuração da DATABASE_URL
# Formato: postgresql+asyncpg://user:pass@host:port/db
db_url = settings.database_url.replace("+asyncpg", "")
subprocess.run([
    "pg_dump",
    db_url,
    f"--file=backup_{datetime.now():%Y%m%d_%H%M%S}.sql",
    "--format=custom",
], check=True)
```

### 3.5 Test Config (`tests/conftest.py`)

```diff
-TEST_DATABASE_URL = "sqlite+aiosqlite:///./test-mao-na-massa.db"
+TEST_DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/test-mao-na-massa"
```

---

## 4. Migrações Alembic

### Problema conhecido

As migrações existentes usam sintaxe SQLite em `server_default`:

```python
# Atual (SQLite):
sa.Column('created_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'))

# Necessário (PostgreSQL):
sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'))
# Ou melhor:
sa.Column('created_at', sa.DateTime(), server_default=sa.func.now())
```

### Plano de ação

```bash
# 1. Gerar uma migration de squashing que unifica todas as existentes
#    em formato compatível com PostgreSQL
cd backend
alembic merge -m "squash_for_postgresql" heads

# 2. Gerar uma nova migration inicial limpa (opcional)
#    (útil se quiser um fresh start na base)
alembic revision --autogenerate -m "initial_postgresql"

# 3. Aplicar
alembic upgrade head
```

---

## 5. Seed Data

Preparar um script `scripts/seed_postgresql.py` para popular a base após a migração:

| Tabela | Dados | Origem |
|--------|-------|--------|
| `ingredientes` | Farinha, Óleo, Frango, etc. | Script atual |
| `produtos` | Salgados, Doces, etc. | Script atual |
| `variacoes` | Coxinha (Frango, Queijo), etc. | Script atual |
| `site_config` | Horário, WhatsApp, Textos | Export JSON |

---

## 6. Passo a Passo no Railway

```mermaid
graph TD
    A[1. Criar PostgreSQL plugin no Railway] --> B[2. Copiar DATABASE_URL]
    B --> C[3. Atualizar DATABASE_URL no backend.service]
    C --> D[4. Deploy: remover volumeMounts do railway.json]
    D --> E[5. Rodar alembic upgrade head]
    E --> F[6. Rodar seed data]
    F --> G[7. Testar: login, pedidos, tracking]
```

### Comandos Railway

```bash
# Via Railway CLI
railway plugin add postgresql
railway connect postgresql
# Copiar a connection string fornecida
railway variables set DATABASE_URL="postgresql+asyncpg://..."

# Ajustar railway.json (remover volumeMounts)
```

---

## 7. Rollback

Caso precise voltar:

```bash
# 1. Reverter railway.json para usar volume
# 2. Restaurar último backup SQLite:
./scripts/backup_db.sh --restore backup_latest.sqlite
# 3. Redeploy
railway up
```

---

## 8. Checklist Final

- [ ] `asyncpg` adicionado ao `pyproject.toml`, `aiosqlite` removido
- [ ] `database.py` sem PRAGMAs SQLite
- [ ] `config.py` com default PostgreSQL
- [ ] `tests/conftest.py` usando PostgreSQL de teste
- [ ] `scripts/backup_db.py` usando `pg_dump`
- [ ] `railway.json` sem `volumeMounts`
- [ ] Migrações Alembic compatíveis com PostgreSQL
- [ ] Seed data populada
- [ ] Deploy testado (login, pedidos, tracking, estoque)
- [ ] Backup testado (pg_dump + restore)
