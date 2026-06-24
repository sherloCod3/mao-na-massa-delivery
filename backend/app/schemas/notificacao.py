from datetime import datetime

from pydantic import BaseModel, ConfigDict


class NotificacaoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tipo: str
    titulo: str
    mensagem: str
    referencia_tipo: str | None = None
    referencia_id: int | None = None
    lida: bool
    created_at: datetime


class NotificacaoNaoLidasResponse(BaseModel):
    total: int
    notificacoes: list[NotificacaoResponse]
