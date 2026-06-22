from datetime import datetime

from pydantic import BaseModel, ConfigDict


class IngredienteBase(BaseModel):
    nome: str
    unidade_medida: str  # g, ml, un
    preco_atual: float = 0.0
    embalagem: float = 1.0  # ex: 1000 se preco for por kg e unidade for g


class IngredienteCreate(IngredienteBase):
    pass


class IngredienteUpdate(BaseModel):
    nome: str | None = None
    unidade_medida: str | None = None
    preco_atual: float | None = None
    embalagem: float | None = None
    ativo: bool | None = None


class IngredienteResponse(IngredienteBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    ativo: bool
    created_at: datetime
    updated_at: datetime
