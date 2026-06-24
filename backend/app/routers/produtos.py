from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_session
from app.errors import NotFoundError
from app.models.produto import Produto
from app.schemas.produto import ProdutoCreate, ProdutoResponse, ProdutoUpdate

router = APIRouter(prefix="/produtos", tags=["Produtos"])


@router.get("", response_model=list[ProdutoResponse])
async def listar_produtos(
    apenas_ativos: bool = True,
    session: AsyncSession = Depends(get_session),
):
    query = select(Produto).options(selectinload(Produto.variacoes)).order_by(Produto.nome)
    if apenas_ativos:
        query = query.where(Produto.ativo.is_(True))
    result = await session.execute(query)
    return result.scalars().all()


@router.post("", response_model=ProdutoResponse, status_code=status.HTTP_201_CREATED)
async def criar_produto(
    data: ProdutoCreate,
    session: AsyncSession = Depends(get_session),
):
    produto = Produto(**data.model_dump())
    session.add(produto)
    await session.commit()
    await session.refresh(produto)
    return produto


@router.get("/{produto_id}", response_model=ProdutoResponse)
async def obter_produto(
    produto_id: int,
    session: AsyncSession = Depends(get_session),
):
    query = (
        select(Produto)
        .options(selectinload(Produto.variacoes))
        .where(Produto.id == produto_id)
    )
    result = await session.execute(query)
    produto = result.scalar_one_or_none()
    if not produto:
        raise NotFoundError("Produto", produto_id)
    return produto


@router.put("/{produto_id}", response_model=ProdutoResponse)
async def atualizar_produto(
    produto_id: int,
    data: ProdutoUpdate,
    session: AsyncSession = Depends(get_session),
):
    produto = await session.get(Produto, produto_id)
    if not produto:
        raise NotFoundError("Produto", produto_id)

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(produto, key, value)

    await session.commit()
    await session.refresh(produto)
    return produto


@router.delete("/{produto_id}", status_code=status.HTTP_204_NO_CONTENT)
async def desativar_produto(
    produto_id: int,
    session: AsyncSession = Depends(get_session),
):
    produto = await session.get(Produto, produto_id)
    if not produto:
        raise NotFoundError("Produto", produto_id)
    produto.ativo = False
    await session.commit()
