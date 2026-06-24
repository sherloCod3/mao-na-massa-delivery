from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.models.ingrediente import Ingrediente
from app.models.receita_item import ReceitaItem
from app.schemas.ingrediente import (
    IngredienteCreate,
    IngredienteResponse,
    IngredienteUpdate,
)
from app.services.notificador import notificar_estoque_baixo
from app.config import settings

router = APIRouter(prefix="/ingredientes", tags=["Ingredientes"])


@router.get("", response_model=list[IngredienteResponse])
async def listar_ingredientes(
    apenas_ativos: bool = True,
    session: AsyncSession = Depends(get_session),
):
    query = select(Ingrediente).order_by(Ingrediente.nome)
    if apenas_ativos:
        query = query.where(Ingrediente.ativo.is_(True))
    result = await session.execute(query)
    return result.scalars().all()


@router.post("", response_model=IngredienteResponse, status_code=status.HTTP_201_CREATED)
async def criar_ingrediente(
    data: IngredienteCreate,
    session: AsyncSession = Depends(get_session),
):
    ingrediente = Ingrediente(**data.model_dump())
    session.add(ingrediente)
    await session.commit()
    await session.refresh(ingrediente)
    return ingrediente


@router.get("/{ingrediente_id}", response_model=IngredienteResponse)
async def obter_ingrediente(
    ingrediente_id: int,
    session: AsyncSession = Depends(get_session),
):
    ingrediente = await session.get(Ingrediente, ingrediente_id)
    if not ingrediente:
        raise HTTPException(status_code=404, detail="Ingrediente não encontrado")
    return ingrediente


@router.put("/{ingrediente_id}", response_model=IngredienteResponse)
async def atualizar_ingrediente(
    ingrediente_id: int,
    data: IngredienteUpdate,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_session),
):
    ingrediente = await session.get(Ingrediente, ingrediente_id)
    if not ingrediente:
        raise HTTPException(status_code=404, detail="Ingrediente não encontrado")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(ingrediente, key, value)

    await session.commit()
    await session.refresh(ingrediente)

    # Verificar estoque baixo (fire-and-forget)
    background_tasks.add_task(
        _verificar_estoque_baixo,
        ingrediente.id, ingrediente.nome,
        ingrediente.quantidade_estoque, ingrediente.estoque_minimo,
        ingrediente.ativo,
    )

    return ingrediente


@router.delete("/{ingrediente_id}", status_code=status.HTTP_204_NO_CONTENT)
async def desativar_ingrediente(
    ingrediente_id: int,
    session: AsyncSession = Depends(get_session),
):
    ingrediente = await session.get(Ingrediente, ingrediente_id)
    if not ingrediente:
        raise HTTPException(status_code=404, detail="Ingrediente não encontrado")
    ingrediente.ativo = False
    await session.commit()


async def _verificar_estoque_baixo(
    ingrediente_id: int,
    nome: str,
    quantidade_estoque: float,
    estoque_minimo: float,
    ativo: bool,
):
    """Verifica se o ingrediente está com estoque baixo e notifica (roda em BackgroundTask).

    Usa os campos reais de estoque definidos pelo usuário.
    """
    if not ativo or estoque_minimo <= 0:
        return

    if quantidade_estoque <= estoque_minimo:
        await notificar_estoque_baixo(nome, ingrediente_id)
