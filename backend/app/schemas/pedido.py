from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


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
    customizacoes: str | None = None
    subtotal: float
    variacao_nome: str | None = None
    produto_nome: str | None = None


class PedidoCreate(BaseModel):
    cliente_nome: str
    cliente_whatsapp: str | None = None
    forma_pagamento: str | None = None
    observacoes: str | None = None
    data_entrega: datetime | None = None
    itens: list[ItemPedidoCreate]


class PedidoUpdateStatus(BaseModel):
    status: str  # recebido, producao, entrega, entregue, cancelado


class PedidoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    cliente_nome: str
    cliente_whatsapp: str | None = None
    token_acesso: str
    status: str
    forma_pagamento: str | None = None
    observacoes: str | None = None
    total: float
    data_entrega: datetime | None = None
    created_at: datetime
    updated_at: datetime
    itens: list[ItemPedidoResponse] = []


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
