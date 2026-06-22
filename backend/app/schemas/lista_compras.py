from datetime import datetime

from pydantic import BaseModel


class ListaCompraItemCreate(BaseModel):
    nome: str
    quantidade: float | None = 1.0
    unidade_medida: str | None = None
    valor_estimado: float | None = None


class ListaCompraItemUpdate(BaseModel):
    nome: str | None = None
    quantidade: float | None = None
    unidade_medida: str | None = None
    valor_estimado: float | None = None
    comprado: bool | None = None


class ListaCompraItemResponse(BaseModel):
    id: int
    nome: str
    quantidade: float | None
    unidade_medida: str | None
    valor_estimado: float | None
    comprado: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ListaCompraResumo(BaseModel):
    total_estimado: float
    total_comprado: float
    itens_pendentes: int
    itens_comprados: int


class ListaSalvaCreate(BaseModel):
    nome: str


class ListaSalvaResumo(BaseModel):
    id: int
    nome: str
    total_itens: int
    created_at: datetime


class SugestaoIngrediente(BaseModel):
    nome: str
    unidade_medida: str | None
    valor_sugerido: float | None
