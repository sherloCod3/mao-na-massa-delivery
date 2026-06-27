from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import verify_admin
from app.database import get_session
from app.errors import NotFoundError
from app.models.ingrediente import Ingrediente
from app.models.receita_item import ReceitaItem
from app.models.variacao import Variacao
from app.schemas.receita import (
    CustoResponse,
    ReceitaItemCreate,
    ReceitaItemResponse,
    ReceitaItemUpdate,
)
from app.schemas.variacao import VariacaoCreate, VariacaoResponse, VariacaoUpdate

router = APIRouter(
    tags=["Variações"],
    dependencies=[Depends(verify_admin)],
)


# ─── Variações ───────────────────────────────────────────────────────────────

@router.get(
    "/produtos/{produto_id}/variacoes",
    response_model=list[VariacaoResponse],
)
async def listar_variacoes(
    produto_id: int,
    apenas_ativos: bool = True,
    session: AsyncSession = Depends(get_session),
):
    query = (
        select(Variacao)
        .options(selectinload(Variacao.receita).selectinload(ReceitaItem.ingrediente))
        .where(Variacao.produto_id == produto_id)
        .order_by(Variacao.nome)
    )
    if apenas_ativos:
        query = query.where(Variacao.ativo.is_(True))
    result = await session.execute(query)
    variacoes = result.scalars().all()
    return _serialize_variacoes(variacoes)


@router.post(
    "/produtos/{produto_id}/variacoes",
    response_model=VariacaoResponse,
    status_code=status.HTTP_201_CREATED,
)
async def criar_variacao(
    produto_id: int,
    data: VariacaoCreate,
    session: AsyncSession = Depends(get_session),
):
    variacao = Variacao(produto_id=produto_id, **data.model_dump())
    session.add(variacao)
    await session.commit()

    # Re-fetch with eager-loaded relationships for property access
    query = (
        select(Variacao)
        .options(selectinload(Variacao.receita).selectinload(ReceitaItem.ingrediente))
        .where(Variacao.id == variacao.id)
    )
    result = await session.execute(query)
    variacao = result.scalar_one()

    return _serialize_variacao(variacao)


@router.put("/variacoes/{variacao_id}", response_model=VariacaoResponse)
async def atualizar_variacao(
    variacao_id: int,
    data: VariacaoUpdate,
    session: AsyncSession = Depends(get_session),
):
    query = (
        select(Variacao)
        .options(selectinload(Variacao.receita).selectinload(ReceitaItem.ingrediente))
        .where(Variacao.id == variacao_id)
    )
    result = await session.execute(query)
    variacao = result.scalar_one_or_none()
    if not variacao:
        raise NotFoundError("Variação", variacao_id)

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(variacao, key, value)

    await session.commit()
    # Re-fetch after commit to get fresh data
    result = await session.execute(query)
    variacao = result.scalar_one()
    return _serialize_variacao(variacao)


@router.delete("/variacoes/{variacao_id}", status_code=status.HTTP_204_NO_CONTENT)
async def desativar_variacao(
    variacao_id: int,
    session: AsyncSession = Depends(get_session),
):
    variacao = await session.get(Variacao, variacao_id)
    if not variacao:
        raise NotFoundError("Variação", variacao_id)
    variacao.ativo = False
    await session.commit()


# ─── Receita (ingredientes da variação) ──────────────────────────────────────

@router.get(
    "/variacoes/{variacao_id}/receita",
    response_model=list[ReceitaItemResponse],
)
async def listar_receita(
    variacao_id: int,
    session: AsyncSession = Depends(get_session),
):
    query = (
        select(ReceitaItem)
        .options(selectinload(ReceitaItem.ingrediente))
        .where(ReceitaItem.variacao_id == variacao_id)
    )
    result = await session.execute(query)
    return result.scalars().all()


@router.post(
    "/variacoes/{variacao_id}/receita",
    response_model=ReceitaItemResponse,
    status_code=status.HTTP_201_CREATED,
)
async def adicionar_ingrediente_receita(
    variacao_id: int,
    data: ReceitaItemCreate,
    session: AsyncSession = Depends(get_session),
):
    # Verify the variation exists
    variacao = await session.get(Variacao, variacao_id)
    if not variacao:
        raise NotFoundError("Variação", variacao_id)

    # Verify the ingredient exists
    ingrediente = await session.get(Ingrediente, data.ingrediente_id)
    if not ingrediente:
        raise NotFoundError("Ingrediente", data.ingrediente_id)

    item = ReceitaItem(variacao_id=variacao_id, **data.model_dump())
    session.add(item)
    await session.commit()
    await session.refresh(item)

    # Eager load the ingredient relationship
    query = (
        select(ReceitaItem)
        .options(selectinload(ReceitaItem.ingrediente))
        .where(ReceitaItem.id == item.id)
    )
    result = await session.execute(query)
    return result.scalar_one()


@router.put("/receita/{receita_item_id}", response_model=ReceitaItemResponse)
async def atualizar_receita_item(
    receita_item_id: int,
    data: ReceitaItemUpdate,
    session: AsyncSession = Depends(get_session),
):
    item = await session.get(ReceitaItem, receita_item_id)
    if not item:
        raise NotFoundError("Item da receita", receita_item_id)

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(item, key, value)

    await session.commit()
    await session.refresh(item)
    return item


@router.delete("/receita/{receita_item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remover_ingrediente_receita(
    receita_item_id: int,
    session: AsyncSession = Depends(get_session),
):
    item = await session.get(ReceitaItem, receita_item_id)
    if not item:
        raise NotFoundError("Item da receita", receita_item_id)
    await session.delete(item)
    await session.commit()


# ─── Cálculo de custos ───────────────────────────────────────────────────────

@router.get("/variacoes/{variacao_id}/custo", response_model=CustoResponse)
async def calcular_custo_variacao(
    variacao_id: int,
    session: AsyncSession = Depends(get_session),
):
    query = (
        select(Variacao)
        .options(selectinload(Variacao.receita).selectinload(ReceitaItem.ingrediente))
        .where(Variacao.id == variacao_id)
    )
    result = await session.execute(query)
    variacao = result.scalar_one_or_none()
    if not variacao:
        raise NotFoundError("Variação", variacao_id)

    return CustoResponse(
        variacao_id=variacao.id,
        variacao_nome=variacao.nome,
        custo_unitario=variacao.custo_unitario,
        margem_percentual=variacao.margem_percentual,
        preco_sugerido=variacao.preco_sugerido,
        preco_minimo_atual=variacao.preco_minimo,
    )


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _serialize_variacao(variacao: Variacao) -> VariacaoResponse:
    return VariacaoResponse(
        id=variacao.id,
        produto_id=variacao.produto_id,
        nome=variacao.nome,
        preco_venda=variacao.preco_venda,
        preco_minimo=variacao.preco_minimo,
        margem_percentual=variacao.margem_percentual,
        ativo=variacao.ativo,
        custo_unitario=variacao.custo_unitario,
        preco_sugerido=variacao.preco_sugerido,
        created_at=variacao.created_at,
        updated_at=variacao.updated_at,
    )


def _serialize_variacoes(variacoes: list[Variacao]) -> list[VariacaoResponse]:
    return [_serialize_variacao(v) for v in variacoes]
