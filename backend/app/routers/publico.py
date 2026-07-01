from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_session
from app.errors import AppError, NotFoundError
from app.models.pedido import Pedido
from app.models.produto import Produto
from app.models.variacao import Variacao
from app.schemas.pedido import PedidoTrackingResponse

router = APIRouter(prefix="/publico", tags=["Público"])


@router.get("/pedidos/{token}", response_model=PedidoTrackingResponse)
async def tracking_pedido(
    token: str,
    session: AsyncSession = Depends(get_session),
):
    """Rota pública — qualquer um com o token pode ver o status do pedido."""
    query = select(Pedido).options(selectinload(Pedido.itens)).where(Pedido.token_acesso == token)
    result = await session.execute(query)
    pedido = result.scalar_one_or_none()

    if not pedido:
        raise NotFoundError("Pedido")

    if pedido.status == "cancelado":
        raise AppError(
            message="Este pedido foi cancelado",
            status_code=410,
            code="PEDIDO_CANCELADO",
        )

    if pedido.status == "pausado":
        raise AppError(
            message="Este pedido está pausado",
            status_code=410,
            code="PEDIDO_PAUSADO",
        )

    # Buscar nomes das variações e produtos para cada item
    if pedido.itens:
        variacao_ids = [i.variacao_id for i in pedido.itens]
        v_query = (
            select(Variacao.id, Variacao.nome, Produto.nome)
            .join(Produto, Variacao.produto_id == Produto.id)
            .where(Variacao.id.in_(variacao_ids))
        )
        v_result = await session.execute(v_query)
        variacao_map = {vid: {"v": vnome, "p": pnome} for vid, vnome, pnome in v_result.all()}
        for item in pedido.itens:
            info = variacao_map.get(item.variacao_id)
            if info:
                item.variacao_nome = info["v"]
                item.produto_nome = info["p"]

    return pedido
