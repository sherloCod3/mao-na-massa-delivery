from datetime import date, datetime

from fastapi import APIRouter, Depends
from sqlalchemy import Date, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_session
from app.models.item_pedido import ItemPedido
from app.models.pedido import Pedido, StatusPedido
from app.models.variacao import Variacao
from app.schemas.dashboard import DashboardHojeResponse, DashboardPeriodoResponse

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


async def _calcular_custo_pedido(pedido: Pedido) -> float:
    """Calculate the real cost of an order based on recipe ingredients."""
    custo_total = 0.0
    for item in pedido.itens:
        # Each ItemPedido has a variacao with .custo_unitario property
        # The property requires receita + ingrediente to be loaded
        custo_total += item.quantidade * item.variacao.custo_unitario
    return round(custo_total, 2)


@router.get("/hoje", response_model=DashboardHojeResponse)
async def dashboard_hoje(session: AsyncSession = Depends(get_session)):
    today = date.today()

    # All orders from today with nested relationships for cost calculation
    query = (
        select(Pedido)
        .options(
            selectinload(Pedido.itens).selectinload(ItemPedido.variacao).selectinload(Variacao.receita),
        )
        .where(func.date(Pedido.created_at) == today)
    )
    result = await session.execute(query)
    pedidos_hoje = result.scalars().all()

    # Count by status
    status_counts: dict[str, int] = {}
    for s in StatusPedido:
        status_counts[s.value] = 0

    total_pedidos = len(pedidos_hoje)
    ativos = 0
    entregues_hoje = 0
    faturamento = 0.0
    custo_total = 0.0

    for pedido in pedidos_hoje:
        status_counts[pedido.status] = status_counts.get(pedido.status, 0) + 1
        if pedido.status in ("recebido", "producao", "entrega"):
            ativos += 1
            # Estimate cost even for active orders (based on what's been produced so far)
            custo_total += await _calcular_custo_pedido(pedido)
        if pedido.status == "entregue":
            entregues_hoje += 1
            faturamento += pedido.total
            custo_total += await _calcular_custo_pedido(pedido)

    return DashboardHojeResponse(
        pedidos_ativos=ativos,
        pedidos_entregues_hoje=entregues_hoje,
        faturamento_hoje=round(faturamento, 2),
        custo_total_estimado=round(custo_total, 2),
        lucro_estimado=round(faturamento - custo_total, 2),
        total_pedidos=total_pedidos,
        pedidos_por_status=status_counts,
    )


@router.get("/periodo", response_model=DashboardPeriodoResponse)
async def dashboard_periodo(
    data_inicio: date | None = None,
    data_fim: date | None = None,
    session: AsyncSession = Depends(get_session),
):
    query = (
        select(Pedido)
        .options(
            selectinload(Pedido.itens).selectinload(ItemPedido.variacao).selectinload(Variacao.receita),
        )
        .where(Pedido.status == StatusPedido.entregue.value)
    )

    if data_inicio:
        query = query.where(func.date(Pedido.created_at) >= data_inicio)
    if data_fim:
        query = query.where(func.date(Pedido.created_at) <= data_fim)

    result = await session.execute(query)
    pedidos = result.scalars().all()

    total_pedidos = len(pedidos)
    total_faturado = sum(p.total for p in pedidos)
    total_custos = 0.0
    for p in pedidos:
        total_custos += await _calcular_custo_pedido(p)
    total_custos = round(total_custos, 2)
    ticket_medio = round(total_faturado / total_pedidos, 2) if total_pedidos > 0 else 0.0

    return DashboardPeriodoResponse(
        total_pedidos=total_pedidos,
        total_faturado=round(total_faturado, 2),
        total_custos=total_custos,
        total_lucro=round(total_faturado - total_custos, 2),
        ticket_medio=ticket_medio,
    )
