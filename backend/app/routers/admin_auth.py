from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel

from app.auth import criar_token_admin, limiter
from app.config import settings

router = APIRouter(prefix="/admin", tags=["Admin — Autenticação"])


class LoginRequest(BaseModel):
    password: str


class LoginResponse(BaseModel):
    token: str
    ok: bool


@router.post("/login", response_model=LoginResponse)
@limiter.limit("10/minute")
async def login(request: Request, data: LoginRequest):
    """Admin faz login com a senha configurada em ADMIN_TOKEN.

    Retorna o token que deve ser enviado no header
    ``Authorization: Bearer <token>`` nas demais requisições admin.
    """
    if not settings.admin_token:
        # Sem token configurado — login sempre falha
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Autenticação não configurada no servidor",
        )

    if data.password != settings.admin_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Senha inválida",
        )

    # Gera JWT com expiração de 24h
    token = criar_token_admin()
    return LoginResponse(token=token, ok=True)
