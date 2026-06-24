"""Módulo centralizado de erro e tratamento de exceções.

Baseado nos princípios de Error Handling Patterns:
- Exceções tipadas para categorias de erro conhecidas
- Respostas padronizadas com código, mensagem e metadados
- Contexto preservado (stack traces em desenvolvimento)
- Diferenciação entre erros do usuário (4xx) e do servidor (5xx)
"""

import logging
import traceback
import uuid
from typing import Any

from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

logger = logging.getLogger(__name__)


# ─── Exceções Tipadas ────────────────────────────────────────────


class AppError(Exception):
    """Erro base da aplicação — todos os erros conhecidos herdam daqui."""

    def __init__(
        self,
        message: str,
        status_code: int = 400,
        code: str = "BAD_REQUEST",
        details: dict[str, Any] | None = None,
    ):
        self.message = message
        self.status_code = status_code
        self.code = code
        self.details = details or {}
        super().__init__(self.message)


class NotFoundError(AppError):
    """Recurso não encontrado (404)."""

    def __init__(self, resource: str, resource_id: str | int | None = None):
        msg = f"{resource} não encontrado"
        if resource_id is not None:
            msg += f" (id: {resource_id})"
        super().__init__(
            message=msg,
            status_code=404,
            code="NOT_FOUND",
            details={"resource": resource, "resource_id": resource_id},
        )


class ValidationError(AppError):
    """Erro de validação dos dados de entrada (400)."""

    def __init__(self, message: str, details: dict[str, Any] | None = None):
        super().__init__(
            message=message,
            status_code=400,
            code="VALIDATION_ERROR",
            details=details,
        )


class ConflictError(AppError):
    """Conflito com estado atual do recurso (409)."""

    def __init__(self, message: str, details: dict[str, Any] | None = None):
        super().__init__(
            message=message,
            status_code=409,
            code="CONFLICT",
            details=details,
        )


class ExternalServiceError(AppError):
    """Erro ao chamar serviço externo (502)."""

    def __init__(
        self,
        message: str,
        service: str = "unknown",
        details: dict[str, Any] | None = None,
    ):
        super().__init__(
            message=message,
            status_code=502,
            code="EXTERNAL_SERVICE_ERROR",
            details={"service": service, **(details or {})},
        )


# ─── Schema de Resposta de Erro ──────────────────────────────────


def error_response(
    request: Request,
    status_code: int,
    code: str,
    message: str,
    details: dict[str, Any] | None = None,
) -> JSONResponse:
    """Gera uma resposta JSON padronizada para erros."""
    body: dict[str, Any] = {
        "error": {
            "code": code,
            "message": message,
            "request_id": getattr(request.state, "request_id", None),
        }
    }
    if details:
        body["error"]["details"] = details
    return JSONResponse(status_code=status_code, content=body)


# ─── Middleware de Request ID ────────────────────────────────────


class RequestIDMiddleware(BaseHTTPMiddleware):
    """Adiciona um ID único a cada request para rastreabilidade."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint):
        request.state.request_id = str(uuid.uuid4())[:8]
        response = await call_next(request)
        response.headers["X-Request-ID"] = request.state.request_id
        return response


# ─── Middleware de Tratamento Global de Erros ─────────────────────


class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    """Captura exceções não tratadas e retorna respostas padronizadas.

    Ordem de tratamento:
    1. AppError → erro conhecido com código específico
    2. RequestValidationError → erro de validação Pydantic
    3. Exception → erro inesperado (500)
    """

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint):
        try:
            response = await call_next(request)
            return response
        except AppError as exc:
            logger.warning(
                "AppError [%s]: %s | details=%s",
                exc.code, exc.message, exc.details,
            )
            return error_response(
                request=request,
                status_code=exc.status_code,
                code=exc.code,
                message=exc.message,
                details=exc.details,
            )
        except RequestValidationError as exc:
            logger.warning("ValidationError: %s", exc.errors())
            return error_response(
                request=request,
                status_code=422,
                code="VALIDATION_ERROR",
                message="Dados inválidos",
                details={"fields": exc.errors()},
            )
        except Exception as exc:
            logger.exception("Erro interno não tratado: %s", exc)
            # Em produção, não expomos detalhes do erro
            return error_response(
                request=request,
                status_code=500,
                code="INTERNAL_ERROR",
                message="Erro interno do servidor",
                details=(
                    {"type": type(exc).__name__, "traceback": traceback.format_exc()}
                    if __debug__
                    else None
                ),
            )
