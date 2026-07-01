import json
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
from app.models.pedido import STATUS_FLOW, Pedido, StatusPedido
from app.models.produto import Produto
from app.models.status_history import StatusHistory
from app.models.variacao import Variacao
from app.schemas.pedido import (
    ItemPedidoCreate,
    PedidoCancelar,
    PedidoCreate,
    PedidoPausar,
    PedidoResponse,
    PedidoUpdateStatus,
    StatusHistoryResponse,
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


async def _notificar_pedido_criado(  # pylint: disable=too-many-positional-arguments
    pedido_id: int, cliente_nome: str, total: float, whatsapp: str | None, token_acesso: str | None
):
    """Busca os nomes das variações e notifica (roda em BackgroundTask)."""
    import logging  # pylint: disable=import-outside-toplevel

    logger = logging.getLogger(__name__)

    from app.database import (  # pylint: disable=import-outside-toplevel
        async_session as _async_session,
    )

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
    except Exception as exc:  # pylint: disable=broad-exception-caught
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
    except Exception as exc:  # pylint: disable=broad-exception-caught
        logger.exception("Falha ao notificar novo pedido %d: %s", pedido_id, exc)


@router.get("", response_model=list[PedidoResponse])
async def listar_pedidos(  # pylint: disable=too-many-positional-arguments
    status_filter: str | None = Query(None, alias="status"),
    data_inicio: date | None = None,
    data_fim: date | None = None,
    limite: int = Query(200, ge=1, le=500, description="Máx. de resultados por página"),
    pagina: int = Query(1, ge=1, description="Número da página (começa em 1)"),
    session: AsyncSession = Depends(get_session),
    _: None = Depends(verify_admin),
):
    offset = (pagina - 1) * limite
    query = (
        select(Pedido)
        .options(
            selectinload(Pedido.itens),
            selectinload(Pedido.status_history),
        )
        .order_by(Pedido.created_at.desc())
    )

    if status_filter:
        query = query.where(Pedido.status == status_filter)
    if data_inicio:
        query = query.where(func.date(Pedido.created_at) >= data_inicio)
    if data_fim:
        query = query.where(func.date(Pedido.created_at) <= data_fim)

    query = query.offset(offset).limit(limite)
    result = await session.execute(query)
    return result.scalars().all()


@router.post("", response_model=PedidoResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("100/minute")
async def criar_pedido(  # pylint: disable=unused-argument
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
        status=StatusPedido.pendente.value,
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
            customizacoes=json.dumps(custom_json, ensure_ascii=False) if custom_json else None,
            subtotal=round(subtotal, 2),
        )
        pedido.itens.append(item)

    # Seed initial status_history entry
    pedido.status_history.append(
        StatusHistory(
            status_anterior=None,
            status_novo=StatusPedido.pendente.value,
            alterado_por="sistema",
        )
    )

    session.add(pedido)
    await session.commit()

    # Re-fetch with eager-loaded items and status history
    query = (
        select(Pedido)
        .options(
            selectinload(Pedido.itens),
            selectinload(Pedido.status_history),
        )
        .where(Pedido.id == pedido.id)
    )
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
    query = (
        select(Pedido)
        .options(
            selectinload(Pedido.itens),
            selectinload(Pedido.status_history),
        )
        .where(Pedido.id == pedido_id)
    )
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
    query = (
        select(Pedido)
        .options(
            selectinload(Pedido.itens),
            selectinload(Pedido.status_history),
        )
        .where(Pedido.id == pedido_id)
    )
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
    status_anterior = pedido.status
    pedido.status = StatusPedido.cancelado.value
    await _registrar_historico(
        session,
        pedido_id,
        status_anterior,
        StatusPedido.cancelado.value,
        alterado_por="admin",
        motivo="Cancelado via endpoint DELETE",
    )
    await session.commit()


async def _registrar_historico(
    session: AsyncSession,
    pedido_id: int,
    status_anterior: str | None,
    status_novo: str,
    *,
    alterado_por: str = "admin",
    motivo: str | None = None,
) -> StatusHistory:
    """Registra uma mudança de status no histórico."""
    historico = StatusHistory(
        pedido_id=pedido_id,
        status_anterior=status_anterior,
        status_novo=status_novo,
        alterado_por=alterado_por,
        motivo=motivo,
    )
    session.add(historico)
    return historico


@router.put("/{pedido_id}/pausar", response_model=PedidoResponse)
async def pausar_pedido(
    pedido_id: int,
    data: PedidoPausar,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_session),
    _: None = Depends(verify_admin),
):
    """Pausa um pedido, salvando o status anterior para retomar depois."""
    query = (
        select(Pedido)
        .options(
            selectinload(Pedido.itens),
            selectinload(Pedido.status_history),
        )
        .where(Pedido.id == pedido_id)
    )
    result = await session.execute(query)
    pedido = result.scalar_one_or_none()
    if not pedido:
        raise NotFoundError("Pedido", pedido_id)

    if pedido.status == StatusPedido.pausado.value:
        raise ValidationError(message="Pedido já está pausado")
    if pedido.status == StatusPedido.cancelado.value:
        raise ValidationError(message="Pedido cancelado não pode ser pausado")
    if pedido.status == StatusPedido.entregue.value:
        raise ValidationError(message="Pedido entregue não pode ser pausado")

    status_anterior = pedido.status
    pedido.status_anterior = status_anterior
    pedido.status = StatusPedido.pausado.value

    await _registrar_historico(
        session, pedido_id, status_anterior, StatusPedido.pausado.value, motivo=data.motivo
    )
    await session.commit()

    # Re-fetch
    result = await session.execute(query)
    pedido = result.scalar_one()

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


@router.put("/{pedido_id}/retomar", response_model=PedidoResponse)
async def retomar_pedido(
    pedido_id: int,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_session),
    _: None = Depends(verify_admin),
):
    """Retoma um pedido pausado, voltando ao status anterior."""
    query = (
        select(Pedido)
        .options(
            selectinload(Pedido.itens),
            selectinload(Pedido.status_history),
        )
        .where(Pedido.id == pedido_id)
    )
    result = await session.execute(query)
    pedido = result.scalar_one_or_none()
    if not pedido:
        raise NotFoundError("Pedido", pedido_id)

    if pedido.status != StatusPedido.pausado.value:
        raise ValidationError(message="Pedido não está pausado")

    destino = pedido.status_anterior or StatusPedido.pendente.value
    status_anterior = pedido.status
    pedido.status = destino
    pedido.status_anterior = None

    await _registrar_historico(
        session, pedido_id, status_anterior, destino, motivo="Pedido retomado"
    )
    await session.commit()

    # Re-fetch
    result = await session.execute(query)
    pedido = result.scalar_one()

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


@router.put("/{pedido_id}/cancelar", response_model=PedidoResponse)
async def cancelar_pedido_com_motivo(
    pedido_id: int,
    data: PedidoCancelar,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_session),
    _: None = Depends(verify_admin),
):
    """Cancela um pedido com motivo obrigatório."""
    query = (
        select(Pedido)
        .options(
            selectinload(Pedido.itens),
            selectinload(Pedido.status_history),
        )
        .where(Pedido.id == pedido_id)
    )
    result = await session.execute(query)
    pedido = result.scalar_one_or_none()
    if not pedido:
        raise NotFoundError("Pedido", pedido_id)

    if pedido.status == StatusPedido.cancelado.value:
        raise ValidationError(message="Pedido já está cancelado")
    if pedido.status == StatusPedido.entregue.value:
        raise ValidationError(message="Pedido entregue não pode ser cancelado")

    status_anterior = pedido.status
    pedido.status = StatusPedido.cancelado.value
    pedido.status_anterior = None

    await _registrar_historico(
        session,
        pedido_id,
        status_anterior,
        StatusPedido.cancelado.value,
        motivo=data.motivo,
    )
    await session.commit()

    # Re-fetch
    result = await session.execute(query)
    pedido = result.scalar_one()

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


@router.post("/{pedido_id}/avancar", response_model=PedidoResponse)
async def avancar_pedido(
    pedido_id: int,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_session),
    _: None = Depends(verify_admin),
):
    """Avança o pedido para o próximo status no fluxo canônico.

    pendente → producao → produzido → entrega → entregue
    """
    query = (
        select(Pedido)
        .options(
            selectinload(Pedido.itens),
            selectinload(Pedido.status_history),
        )
        .where(Pedido.id == pedido_id)
    )
    result = await session.execute(query)
    pedido = result.scalar_one_or_none()
    if not pedido:
        raise NotFoundError("Pedido", pedido_id)

    if pedido.status not in STATUS_FLOW:
        raise ValidationError(
            message=f"Pedido com status '{pedido.status}' não pode avançar no fluxo. "
            f"Use pausar/retomar/cancelar para ações específicas."
        )

    current_idx = STATUS_FLOW.index(pedido.status)
    if current_idx >= len(STATUS_FLOW) - 1:
        raise ValidationError(message="Pedido já está no último status do fluxo")

    status_anterior = pedido.status
    proximo_status = STATUS_FLOW[current_idx + 1]
    pedido.status = proximo_status

    await _registrar_historico(
        session,
        pedido_id,
        status_anterior,
        proximo_status,
    )
    await session.commit()

    # Re-fetch
    result = await session.execute(query)
    pedido = result.scalar_one()

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


@router.get("/{pedido_id}/historico", response_model=list[StatusHistoryResponse])
async def historico_pedido(
    pedido_id: int,
    session: AsyncSession = Depends(get_session),
    _: None = Depends(verify_admin),
):
    """Retorna o histórico de status de um pedido."""
    query = select(Pedido).where(Pedido.id == pedido_id)
    result = await session.execute(query)
    pedido = result.scalar_one_or_none()
    if not pedido:
        raise NotFoundError("Pedido", pedido_id)

    hist_query = (
        select(StatusHistory)
        .where(StatusHistory.pedido_id == pedido_id)
        .order_by(StatusHistory.created_at.desc())
    )
    hist_result = await session.execute(hist_query)
    return hist_result.scalars().all()
