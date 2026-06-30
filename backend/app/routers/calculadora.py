"""Calculadora de formação de preço — calcula custo e preço sugerido para pedidos personalizados."""

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import verify_admin
from app.database import get_session
from app.errors import NotFoundError
from app.models.ingrediente import Ingrediente

router = APIRouter(
    prefix="/calculadora",
    tags=["Calculadora"],
    dependencies=[Depends(verify_admin)],
)


class IngredienteCalculo(BaseModel):
    ingrediente_id: int
    quantidade: float = Field(gt=0, description="Quantidade em gramas/ml/unidades")


class CalculoRequest(BaseModel):
    ingredientes: list[IngredienteCalculo] = Field(min_length=1)
    margem_percentual: float = Field(default=50.0, ge=0, le=1000)
    quantidade_unidades: int = Field(default=1, ge=1)


class DetalheIngrediente(BaseModel):
    ingrediente_id: int
    nome: str
    unidade_medida: str
    quantidade: float
    preco_por_unidade_medida: float
    custo: float


class CalculoResponse(BaseModel):
    custo_unitario: float
    preco_sugerido_unitario: float
    preco_sugerido_total: float
    margem_percentual: float
    quantidade_unidades: int
    detalhes: list[DetalheIngrediente]


@router.post("/preco", response_model=CalculoResponse)
async def calcular_preco(
    data: CalculoRequest,
    session: AsyncSession = Depends(get_session),
):
    """Calcula custo e preço sugerido para uma lista de ingredientes.

    Útil para:
    - Precificar pedidos personalizados que fogem do cardápio
    - Simular "e se eu mudar a receita?"
    - Calcular preço rápido para o cliente sem criar produto no sistema
    """
    detalhes: list[DetalheIngrediente] = []
    custo_total = 0.0

    for item in data.ingredientes:
        result = await session.execute(
            select(Ingrediente).where(Ingrediente.id == item.ingrediente_id)
        )
        ing = result.scalar_one_or_none()
        if not ing:
            raise NotFoundError("Ingrediente", item.ingrediente_id)

        preco_unit = ing.preco_atual / ing.embalagem if ing.embalagem > 0 else 0
        custo_item = round(item.quantidade * preco_unit, 4)
        custo_total += custo_item

        detalhes.append(
            DetalheIngrediente(
                ingrediente_id=ing.id,
                nome=ing.nome,
                unidade_medida=ing.unidade_medida,
                quantidade=item.quantidade,
                preco_por_unidade_medida=round(preco_unit, 6),
                custo=round(custo_item, 4),
            )
        )

    custo_unitario = round(custo_total, 2)
    preco_sugerido_unitario = round(
        custo_unitario * (1 + data.margem_percentual / 100), 2
    )
    preco_sugerido_total = round(preco_sugerido_unitario * data.quantidade_unidades, 2)

    return CalculoResponse(
        custo_unitario=custo_unitario,
        preco_sugerido_unitario=preco_sugerido_unitario,
        preco_sugerido_total=preco_sugerido_total,
        margem_percentual=data.margem_percentual,
        quantidade_unidades=data.quantidade_unidades,
        detalhes=detalhes,
    )
