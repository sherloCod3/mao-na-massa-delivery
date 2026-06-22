import uuid
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_session
from app.models.item_pedido import ItemPedido
from app.models.pedido import Pedido, StatusPedido
from app.models.receita_item import ReceitaItem
from app.models.variacao import Variacao
from app.schemas.pedido import (
    ItemPedidoCreate,
    PedidoCreate,
    PedidoResponse,
    PedidoTrackingResponse,
    PedidoUpdateStatus,
)

router = APIRouter(prefix="/pedidos", tags=["Pedidos"])


def _calcular_subtotal(itens_data: list[ItemPedidoCreate]) -> float:
    total = 0.0
    for item in itens_data:
        custom_preco = sum(c.preco for c in item.customizacoes)
        total += item.quantidade * (item.preco_unitario + custom_preco)
    return round(total, 2)


def _serialize_item(item: ItemPedido) -> dict:
    return {
        "id": item.id,
        "variacao_id": item.variacao_id,
        "quantidade": item.quantidade,
        "preco_unitario": item.preco_unitario,
        "customizacoes": item.customizacoes,
        "subtotal": item.subtotal,
    }


@router.get("", response_model=list[PedidoResponse])
async def listar_pedidos(
    status_filter: str | None = Query(None, alias="status"),
    data_inicio: date | None = None,
    data_fim: date | None = None,
    session: AsyncSession = Depends(get_session),
):
    query = (
        select(Pedido)
        .options(selectinload(Pedido.itens))
        .order_by(Pedido.created_at.desc())
    )

    if status_filter:
        query = query.where(Pedido.status == status_filter)
    if data_inicio:
        query = query.where(func.date(Pedido.created_at) >= data_inicio)
    if data_fim:
        query = query.where(func.date(Pedido.created_at) <= data_fim)

    result = await session.execute(query)
    return result.scalars().all()


@router.post("", response_model=PedidoResponse, status_code=status.HTTP_201_CREATED)
async def criar_pedido(
    data: PedidoCreate,
    session: AsyncSession = Depends(get_session),
):
    total = _calcular_subtotal(data.itens)

    pedido = Pedido(
        cliente_nome=data.cliente_nome,
        cliente_whatsapp=data.cliente_whatsapp,
        token_acesso=str(uuid.uuid4()),
        status=StatusPedido.recebido.value,
        forma_pagamento=data.forma_pagamento,
        observacoes=data.observacoes,
        total=total,
        data_entrega=data.data_entrega,
    )

    # Create items
    for item_data in data.itens:
        custom_preco = sum(c.preco for c in item_data.customizacoes)
        subtotal = item_data.quantidade * (item_data.preco_unitario + custom_preco)
        custom_json = [c.model_dump() for c in item_data.customizacoes]
        item = ItemPedido(
            variacao_id=item_data.variacao_id,
            quantidade=item_data.quantidade,
            preco_unitario=item_data.preco_unitario,
            customizacoes=str(custom_json) if custom_json else None,
            subtotal=round(subtotal, 2),
        )
        pedido.itens.append(item)

    session.add(pedido)
    await session.commit()

    # Re-fetch with eager-loaded items
    query = (
        select(Pedido)
        .options(selectinload(Pedido.itens))
        .where(Pedido.id == pedido.id)
    )
    result = await session.execute(query)
    pedido = result.scalar_one()
    return pedido


@router.get("/{pedido_id}", response_model=PedidoResponse)
async def obter_pedido(
    pedido_id: int,
    session: AsyncSession = Depends(get_session),
):
    query = (
        select(Pedido)
        .options(selectinload(Pedido.itens))
        .where(Pedido.id == pedido_id)
    )
    result = await session.execute(query)
    pedido = result.scalar_one_or_none()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    return pedido


@router.put("/{pedido_id}/status", response_model=PedidoResponse)
async def atualizar_status_pedido(
    pedido_id: int,
    data: PedidoUpdateStatus,
    session: AsyncSession = Depends(get_session),
):
    query = (
        select(Pedido)
        .options(selectinload(Pedido.itens))
        .where(Pedido.id == pedido_id)
    )
    result = await session.execute(query)
    pedido = result.scalar_one_or_none()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")

    if data.status not in [s.value for s in StatusPedido]:
        raise HTTPException(
            status_code=400,
            detail=f"Status inválido. Opções: {', '.join(s.value for s in StatusPedido)}",
        )

    pedido.status = data.status
    await session.commit()
    # Re-fetch after commit
    result = await session.execute(query)
    pedido = result.scalar_one()
    return pedido


@router.delete("/{pedido_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancelar_pedido(
    pedido_id: int,
    session: AsyncSession = Depends(get_session),
):
    query = (
        select(Pedido)
        .options(selectinload(Pedido.itens))
        .where(Pedido.id == pedido_id)
    )
    result = await session.execute(query)
    pedido = result.scalar_one_or_none()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    pedido.status = StatusPedido.cancelado.value
    await session.commit()
