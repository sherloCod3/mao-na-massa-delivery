from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_session
from app.models.pedido import Pedido
from app.schemas.pedido import PedidoTrackingResponse

router = APIRouter(prefix="/publico", tags=["Público"])


@router.get("/pedidos/{token}", response_model=PedidoTrackingResponse)
async def tracking_pedido(
    token: str,
    session: AsyncSession = Depends(get_session),
):
    """Rota pública — qualquer um com o token pode ver o status do pedido."""
    query = (
        select(Pedido)
        .options(selectinload(Pedido.itens))
        .where(Pedido.token_acesso == token)
    )
    result = await session.execute(query)
    pedido = result.scalar_one_or_none()

    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")

    if pedido.status == "cancelado":
        raise HTTPException(status_code=410, detail="Este pedido foi cancelado")

    return pedido
