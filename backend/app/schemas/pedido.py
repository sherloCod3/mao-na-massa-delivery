import json
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class CustomizacaoItem(BaseModel):
    nome: str
    preco: float = 0.0


class ItemPedidoCreate(BaseModel):
    variacao_id: int
    quantidade: int = Field(default=1, ge=1)
    preco_unitario: float
    customizacoes: list[CustomizacaoItem] = []


class ItemPedidoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    variacao_id: int
    quantidade: int
    preco_unitario: float
    customizacoes: list[dict] | None = None
    subtotal: float
    variacao_nome: str | None = None
    produto_nome: str | None = None

    @field_validator("customizacoes", mode="before")
    @classmethod
    def parse_customizacoes(cls, v: str | list | None) -> list | None:
        if v is None or v == "":
            return None
        if isinstance(v, list):
            return v
        try:
            return json.loads(v)
        except (json.JSONDecodeError, TypeError):
            return None


class PedidoCreate(BaseModel):
    cliente_nome: str
    cliente_whatsapp: str | None = None
    forma_pagamento: str | None = None
    observacoes: str | None = None
    data_entrega: datetime | None = None
    itens: list[ItemPedidoCreate]


class PedidoUpdateStatus(BaseModel):
    status: str  # pendente, producao, produzido, entrega, entregue, pausado, cancelado


class PedidoPausar(BaseModel):
    motivo: str = Field(min_length=3, description="Motivo obrigatório para pausar")


class PedidoCancelar(BaseModel):
    motivo: str = Field(min_length=3, description="Motivo obrigatório para cancelar")


class StatusHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status_anterior: str | None
    status_novo: str
    alterado_por: str
    motivo: str | None
    created_at: datetime


class PedidoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    cliente_nome: str
    cliente_whatsapp: str | None = None
    token_acesso: str
    status: str
    status_anterior: str | None = None
    forma_pagamento: str | None = None
    observacoes: str | None = None
    total: float
    data_entrega: datetime | None = None
    created_at: datetime
    updated_at: datetime
    itens: list[ItemPedidoResponse] = []
    status_history: list[StatusHistoryResponse] = []


class PedidoTrackingResponse(BaseModel):
    """Public-facing tracking info — no sensitive data."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    cliente_nome: str
    status: str
    total: float
    forma_pagamento: str | None = None
    observacoes: str | None = None
    data_entrega: datetime | None = None
    created_at: datetime
    itens: list[ItemPedidoResponse] = []
