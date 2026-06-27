"""Autenticação JWT para o painel admin.

O admin faz login com a senha configurada em ``ADMIN_TOKEN``
e recebe um JWT com expiração de 24h.

O token deve ser enviado no header ``Authorization: Bearer <token>``
em todas as requisições a rotas protegidas.
"""

from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import ExpiredSignatureError, InvalidTokenError, decode as jwt_decode, encode as jwt_encode
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.config import settings

# Rate limiter compartilhado (usado no login e disponível globalmente)
limiter = Limiter(key_func=get_remote_address)

JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

security_scheme = HTTPBearer(
    bearerFormat="jwt",
    description="JWT obtido via POST /admin/login — válido por 24h",
    auto_error=False,
)


def criar_token_admin() -> str:
    """Gera um JWT para o admin com expiração de 24h.

    Retorna ValueError se ADMIN_TOKEN não estiver configurado.
    """
    if not settings.admin_token:
        raise ValueError("ADMIN_TOKEN não configurado — não é possível gerar JWT")

    exp = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {
        "sub": "admin",
        "exp": exp,
        "iat": datetime.now(timezone.utc),
    }
    return jwt_encode(payload, settings.admin_token, algorithm=JWT_ALGORITHM)


async def verify_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(security_scheme),
) -> None:
    """Dependency que verifica o JWT de admin.

    Use como ``Depends(verify_admin)`` em rotas protegidas.
    """
    if not settings.admin_token:
        # Sem token configurado = acesso livre (útil em dev)
        return

    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de acesso necessário",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        jwt_decode(
            credentials.credentials,
            settings.admin_token,
            algorithms=[JWT_ALGORITHM],
        )
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expirado — faça login novamente",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido",
            headers={"WWW-Authenticate": "Bearer"},
        )
