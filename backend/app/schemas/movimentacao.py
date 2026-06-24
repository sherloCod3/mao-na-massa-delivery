from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class MovimentacaoCreate(BaseModel):
    tipo: str = Field(pattern=r"^(entrada|saida)$")
    quantidade: float = Field(gt=0)
    motivo: str | None = None


class MovimentacaoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    ingrediente_id: int
    tipo: str
    quantidade: float
    saldo_anterior: float
    saldo_posterior: float
    motivo: str | None = None
    created_at: datetime
