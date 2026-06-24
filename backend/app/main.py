from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import settings
from app.database import init_db
from app.models import *  # noqa: F401, F403 — register models with Base.metadata
from app.routers import (
    dashboard_router,
    ingredientes_router,
    lista_compras_router,
    notificacoes_router,
    pedidos_router,
    produtos_router,
    publico_router,
    variacoes_router,
)


async def security_headers_middleware(request, call_next):
    """Add security headers to every response."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="Mão na Massa API",
    description="API de gestão de produção e vendas de salgados e doces",
    version="0.1.0",
    lifespan=lifespan,
)

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

# Routers
app.include_router(ingredientes_router, prefix="/api/v1")
app.include_router(produtos_router, prefix="/api/v1")
app.include_router(variacoes_router, prefix="/api/v1")
app.include_router(pedidos_router, prefix="/api/v1")
app.include_router(publico_router, prefix="/api/v1")
app.include_router(dashboard_router, prefix="/api/v1")
app.include_router(lista_compras_router, prefix="/api/v1")
app.include_router(notificacoes_router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"message": "Mão na Massa API", "docs": "/docs"}
