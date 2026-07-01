from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import verify_admin
from app.database import get_session
from app.models.item_pedido import ItemPedido
from app.models.pedido import Pedido, StatusPedido
from app.models.variacao import Variacao
from app.schemas.dashboard import (
    DashboardHojeResponse,
    DashboardMensalResponse,
    DashboardPeriodoResponse,
    DashboardTopProdutosResponse,
    MesItem,
    ProdutoMaisVendido,
)

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
    dependencies=[Depends(verify_admin)],
)


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
            selectinload(Pedido.itens)
            .selectinload(ItemPedido.variacao)
            .selectinload(Variacao.receita),
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
        if pedido.status in ("pendente", "producao", "produzido", "entrega"):
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
            selectinload(Pedido.itens)
            .selectinload(ItemPedido.variacao)
            .selectinload(Variacao.receita),
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


@router.get("/mensal", response_model=DashboardMensalResponse)
async def dashboard_mensal(
    meses: int = 6,
    session: AsyncSession = Depends(get_session),
):
    """Monthly revenue/costs breakdown for the last N months."""
    query = (
        select(Pedido)
        .options(
            selectinload(Pedido.itens)
            .selectinload(ItemPedido.variacao)
            .selectinload(Variacao.receita),
        )
        .where(Pedido.status == StatusPedido.entregue.value)
        .order_by(Pedido.created_at.asc())
    )
    result = await session.execute(query)
    pedidos = result.scalars().all()

    # Group by year-month
    meses_map: dict[str, dict] = {}
    for p in pedidos:
        ym = p.created_at.strftime("%Y-%m")
        if ym not in meses_map:
            meses_map[ym] = {"faturamento": 0.0, "custos": 0.0, "total_pedidos": 0}
        meses_map[ym]["faturamento"] += p.total
        meses_map[ym]["custos"] += await _calcular_custo_pedido(p)
        meses_map[ym]["total_pedidos"] += 1

    # Sort and take last N months
    sorted_meses = sorted(meses_map.keys())[-meses:]
    items = []
    for ym in sorted_meses:
        d = meses_map[ym]
        items.append(
            MesItem(
                mes=ym,
                faturamento=round(d["faturamento"], 2),
                custos=round(d["custos"], 2),
                lucro=round(d["faturamento"] - d["custos"], 2),
                total_pedidos=d["total_pedidos"],
            )
        )

    return DashboardMensalResponse(meses=items)


@router.get("/top-produtos", response_model=DashboardTopProdutosResponse)
async def dashboard_top_produtos(
    limite: int = 10,
    session: AsyncSession = Depends(get_session),
):
    """Top selling products by quantity."""
    from sqlalchemy import desc as sql_desc  # pylint: disable=import-outside-toplevel

    query = (
        select(ItemPedido)
        .options(
            selectinload(ItemPedido.variacao).selectinload(Variacao.produto),
        )
        .order_by(sql_desc(ItemPedido.quantidade))
        .limit(limite)
    )
    result = await session.execute(query)
    itens = result.scalars().all()

    # Aggregate by variation since same variation can appear in multiple orders
    agg: dict[str, dict] = {}
    for item in itens:
        v = item.variacao
        p = v.produto
        key = f"{p.nome}|{v.nome}"
        if key not in agg:
            agg[key] = {
                "produto_nome": p.nome,
                "variacao_nome": v.nome,
                "quantidade": 0,
                "total_faturado": 0.0,
            }
        agg[key]["quantidade"] += item.quantidade
        agg[key]["total_faturado"] += item.subtotal

    # Sort by quantity desc and take top N
    sorted_produtos = sorted(agg.values(), key=lambda x: x["quantidade"], reverse=True)[:limite]

    return DashboardTopProdutosResponse(produtos=[ProdutoMaisVendido(**p) for p in sorted_produtos])
