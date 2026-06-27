import uuid
from datetime import date

from fastapi import APIRouter, BackgroundTasks, Depends, Query, Request, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import limiter, verify_admin
from app.database import get_session
from app.errors import NotFoundError, ValidationError
from app.models.item_pedido import ItemPedido
from app.models.pedido import Pedido, StatusPedido
from app.models.produto import Produto
from app.models.variacao import Variacao
from app.schemas.pedido import (
    ItemPedidoCreate,
    PedidoCreate,
    PedidoResponse,
    PedidoUpdateStatus,
)
from app.services.notificador import notificar_novo_pedido, notificar_status_pedido

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


async def _notificar_pedido_criado(
    pedido_id: int, cliente_nome: str, total: float, whatsapp: str | None, token_acesso: str | None
):
    """Busca os nomes das variações e notifica (roda em BackgroundTask)."""
    import logging

    logger = logging.getLogger(__name__)

    from app.database import async_session as _async_session

    try:
        async with _async_session() as s:
            query = (
                select(
                    ItemPedido.variacao_id,
                    ItemPedido.quantidade,
                    ItemPedido.preco_unitario,
                    Variacao.nome,
                    Produto.nome,
                )
                .join(Variacao, ItemPedido.variacao_id == Variacao.id)
                .join(Produto, Variacao.produto_id == Produto.id)
                .where(ItemPedido.pedido_id == pedido_id)
            )
            result = await s.execute(query)
            rows = result.all()

        itens_resumo = "\n".join(
            f"  • {q}x {p_nome} ({v_nome}) — R$ {pu:.2f}" for _, q, pu, v_nome, p_nome in rows
        )
    except Exception as exc:
        logger.warning("Erro ao buscar itens do pedido %d para notificação: %s", pedido_id, exc)
        itens_resumo = ""

    try:
        await notificar_novo_pedido(
            pedido_id=pedido_id,
            cliente_nome=cliente_nome,
            total=total,
            itens_resumo=itens_resumo,
            whatsapp=whatsapp,
            token_acesso=token_acesso,
        )
    except Exception as exc:
        logger.exception("Falha ao notificar novo pedido %d: %s", pedido_id, exc)


@router.get("", response_model=list[PedidoResponse])
async def listar_pedidos(
    status_filter: str | None = Query(None, alias="status"),
    data_inicio: date | None = None,
    data_fim: date | None = None,
    session: AsyncSession = Depends(get_session),
    _: None = Depends(verify_admin),
):
    query = select(Pedido).options(selectinload(Pedido.itens)).order_by(Pedido.created_at.desc())

    if status_filter:
        query = query.where(Pedido.status == status_filter)
    if data_inicio:
        query = query.where(func.date(Pedido.created_at) >= data_inicio)
    if data_fim:
        query = query.where(func.date(Pedido.created_at) <= data_fim)

    result = await session.execute(query)
    return result.scalars().all()


@router.post("", response_model=PedidoResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def criar_pedido(
    request: Request,
    data: PedidoCreate,
    background_tasks: BackgroundTasks,
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
    query = select(Pedido).options(selectinload(Pedido.itens)).where(Pedido.id == pedido.id)
    result = await session.execute(query)
    pedido = result.scalar_one()

    # Notificar admin sobre novo pedido (fire-and-forget via BackgroundTasks)
    background_tasks.add_task(
        _notificar_pedido_criado,
        pedido.id,
        pedido.cliente_nome,
        pedido.total,
        pedido.cliente_whatsapp,
        pedido.token_acesso,
    )

    return pedido


@router.get("/{pedido_id}", response_model=PedidoResponse)
async def obter_pedido(
    pedido_id: int,
    session: AsyncSession = Depends(get_session),
    _: None = Depends(verify_admin),
):
    query = select(Pedido).options(selectinload(Pedido.itens)).where(Pedido.id == pedido_id)
    result = await session.execute(query)
    pedido = result.scalar_one_or_none()
    if not pedido:
        raise NotFoundError("Pedido", pedido_id)
    return pedido


@router.put("/{pedido_id}/status", response_model=PedidoResponse)
async def atualizar_status_pedido(
    pedido_id: int,
    data: PedidoUpdateStatus,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_session),
    _: None = Depends(verify_admin),
):
    query = select(Pedido).options(selectinload(Pedido.itens)).where(Pedido.id == pedido_id)
    result = await session.execute(query)
    pedido = result.scalar_one_or_none()
    if not pedido:
        raise NotFoundError("Pedido", pedido_id)

    if data.status not in [s.value for s in StatusPedido]:
        raise ValidationError(
            message=f"Status inválido. Opções: {', '.join(s.value for s in StatusPedido)}",
            details={"recebido": data.status, "opcoes": [s.value for s in StatusPedido]},
        )

    pedido.status = data.status
    await session.commit()
    # Re-fetch after commit
    result = await session.execute(query)
    pedido = result.scalar_one()

    # Notificar admin sobre mudança de status (fire-and-forget)
    background_tasks.add_task(
        notificar_status_pedido,
        pedido_id=pedido.id,
        cliente_nome=pedido.cliente_nome,
        status_novo=pedido.status,
        total=pedido.total,
        whatsapp=pedido.cliente_whatsapp,
        token_acesso=pedido.token_acesso,
    )

    return pedido


@router.delete("/{pedido_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancelar_pedido(
    pedido_id: int,
    session: AsyncSession = Depends(get_session),
    _: None = Depends(verify_admin),
):
    query = select(Pedido).options(selectinload(Pedido.itens)).where(Pedido.id == pedido_id)
    result = await session.execute(query)
    pedido = result.scalar_one_or_none()
    if not pedido:
        raise NotFoundError("Pedido", pedido_id)
    pedido.status = StatusPedido.cancelado.value
    await session.commit()
