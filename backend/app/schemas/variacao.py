from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator


class VariacaoBase(BaseModel):
    nome: str
    preco_venda: float | None = None
    preco_minimo: float | None = None
    margem_percentual: float = 50.0


class VariacaoCreate(VariacaoBase):
    pass


class VariacaoUpdate(BaseModel):
    nome: str | None = None
    preco_venda: float | None = None
    preco_minimo: float | None = None
    margem_percentual: float | None = None
    ativo: bool | None = None


class VariacaoResponse(VariacaoBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    produto_id: int
    ativo: bool
    custo_unitario: float = 0.0
    preco_sugerido: float = 0.0
    created_at: datetime
    updated_at: datetime

    @field_validator("custo_unitario", "preco_sugerido", mode="before")
    @classmethod
    def ensure_float(cls, v):
        return float(v) if v is not None else 0.0
