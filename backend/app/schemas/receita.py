from datetime import datetime

from pydantic import BaseModel, ConfigDict


class IngredienteBasico(BaseModel):
    """Minimal ingrediente info for recipe display."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    unidade_medida: str
    preco_atual: float
    embalagem: float


class ReceitaItemCreate(BaseModel):
    ingrediente_id: int
    quantidade: float


class ReceitaItemUpdate(BaseModel):
    quantidade: float | None = None


class ReceitaItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    variacao_id: int
    ingrediente_id: int
    ingrediente: IngredienteBasico | None = None
    quantidade: float
    created_at: datetime


class CustoResponse(BaseModel):
    variacao_id: int
    variacao_nome: str
    custo_unitario: float
    margem_percentual: float
    preco_sugerido: float
    preco_minimo_atual: float | None = None
