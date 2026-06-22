from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.models.ingrediente import Ingrediente
from app.schemas.ingrediente import (
    IngredienteCreate,
    IngredienteResponse,
    IngredienteUpdate,
)

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
