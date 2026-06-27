from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )

    database_url: str = "sqlite+aiosqlite:///./mao-na-massa.db"
    cors_origins: str = "http://localhost:5173"

    # ─── Telegram ────────────────────────────────────────────
    telegram_bot_token: str = ""
    telegram_chat_id: str = ""

    # ─── Estoque ─────────────────────────────────────────────
    estoque_minimo: float = 100.0
    estoque_minimo_preco: float = 30.0

    # ─── WhatsApp (Evolution API — self-hosted) ────────────
    evolution_api_url: str = ""  # ex: http://localhost:8080
    evolution_api_key: str = ""  # ex: mao-na-massa-key

    # ─── Ambiente ──────────────────────────────────────────
    environment: str = "development"  # "development" | "production"

    # ─── Hosts permitidos (TrustedHostMiddleware) ────────────
    # Separados por vírgula. Use "*" para aceitar qualquer host (dev).
    allowed_hosts: str = "*"

    # ─── CSP (Content Security Policy) ───────────────────────
    # Custom CSP string. Se vazio, usa o padrão seguro.
    csp_policy: str = ""

    # ─── Autenticação Admin ────────────────────────────────
    admin_token: str = ""  # Se vazio, auth fica desabilitada (útil em dev)

    # ─── App (para links nas notificações) ───────────────────
    app_url: str = "http://localhost:5173"


settings = Settings()
