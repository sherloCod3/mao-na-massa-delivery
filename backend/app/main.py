import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware

from app.auth import limiter
from app.config import settings
from app.database import init_db
from app.errors import ErrorHandlerMiddleware, RequestIDMiddleware
from app.models import *  # noqa: F401, F403 — register models with Base.metadata
from app.routers import (
    admin_auth_router,
    admin_site_config_router,
    admin_testimonials_router,
    dashboard_router,
    ingredientes_router,
    lista_compras_router,
    notificacoes_router,
    pedidos_router,
    produtos_router,
    publico_router,
    publico_site_config_router,
    publico_testimonials_router,
    variacoes_router,
)

logger = logging.getLogger(__name__)


_DEV_CSP = (
    "default-src 'self'; "
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
    "style-src 'self' 'unsafe-inline'; "
    "img-src 'self' data: blob:; "
    "font-src 'self' data:; "
    "connect-src 'self' ws: wss:; "
    "frame-ancestors 'none'"
)

_PROD_CSP = (
    "default-src 'self'; "
    "script-src 'self'; "
    "style-src 'self' 'unsafe-inline'; "
    "img-src 'self' data: blob:; "
    "font-src 'self' data:; "
    "connect-src 'self'; "
    "frame-ancestors 'none'; "
    "base-uri 'self'; "
    "form-action 'self'"
)


def _get_csp() -> str:
    """Retorna a CSP configurada.

    Prioridade:
    1. CSP_POLICY customizada via env var
    2. _DEV_CSP (default) se environment = "development"
    3. _PROD_CSP se environment = "production"
    """
    csp_custom = settings.csp_policy.strip()
    if csp_custom:
        return csp_custom
    if settings.environment.lower() == "production":
        return _PROD_CSP
    return _DEV_CSP


async def security_headers_middleware(request, call_next):
    """Add security headers to every response."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Content-Security-Policy"] = _get_csp()
    return response


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Iniciando banco de dados...")
    await init_db()
    logger.info("Banco de dados pronto.")
    yield


app = FastAPI(
    title="Mão na Massa API",
    description="API de gestão de produção e vendas de salgados e doces",
    version="0.1.0",
    lifespan=lifespan,
    docs_url=None if settings.environment.lower() == "production" else "/docs",
    redoc_url=None if settings.environment.lower() == "production" else "/redoc",
    openapi_url=None if settings.environment.lower() == "production" else "/openapi.json",
)

# TrustedHost — valida o header Host (FIND-005)
if settings.allowed_hosts != "*":
    hosts = [h.strip() for h in settings.allowed_hosts.split(",")]
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=hosts)

# CORS — allow frontend dev server
origins = [o.strip() for o in settings.cors_origins.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security headers
app.add_middleware(BaseHTTPMiddleware, dispatch=security_headers_middleware)

# Rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Error handling — deve vir DEPOIS dos middlewares de segurança mas ANTES dos routers
app.add_middleware(ErrorHandlerMiddleware)
app.add_middleware(RequestIDMiddleware)

# Routers
app.include_router(ingredientes_router, prefix="/api/v1")
app.include_router(produtos_router, prefix="/api/v1")
app.include_router(variacoes_router, prefix="/api/v1")
app.include_router(pedidos_router, prefix="/api/v1")
app.include_router(publico_router, prefix="/api/v1")
app.include_router(dashboard_router, prefix="/api/v1")
app.include_router(lista_compras_router, prefix="/api/v1")
app.include_router(notificacoes_router, prefix="/api/v1")
app.include_router(admin_site_config_router, prefix="/api/v1")
app.include_router(admin_testimonials_router, prefix="/api/v1")
app.include_router(publico_site_config_router, prefix="/api/v1")
app.include_router(admin_auth_router, prefix="/api/v1")
app.include_router(publico_testimonials_router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"message": "Mão na Massa API", "version": "0.1.0", "docs": "/docs"}
