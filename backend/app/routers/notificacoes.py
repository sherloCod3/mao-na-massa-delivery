from fastapi import APIRouter, Depends
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.models.notificacao import Notificacao
from app.schemas.notificacao import NotificacaoNaoLidasResponse, NotificacaoResponse

router = APIRouter(prefix="/notificacoes", tags=["Notificações"])


@router.get("", response_model=NotificacaoNaoLidasResponse)
async def listar_notificacoes(
    apenas_nao_lidas: bool = True,
    limite: int = 50,
    session: AsyncSession = Depends(get_session),
):
    """Lista notificações, ordenadas da mais recente para a mais antiga."""
    query = (
        select(Notificacao)
        .order_by(Notificacao.created_at.desc())
        .limit(limite)
    )
    if apenas_nao_lidas:
        query = query.where(Notificacao.lida.is_(False))

    result = await session.execute(query)
    notificacoes = result.scalars().all()

    total_query = select(Notificacao).where(Notificacao.lida.is_(False))
    total_result = await session.execute(total_query)
    total_nao_lidas = len(total_result.scalars().all())

    return NotificacaoNaoLidasResponse(
        total=total_nao_lidas,
        notificacoes=[NotificacaoResponse.model_validate(n) for n in notificacoes],
    )


@router.post("/{notificacao_id}/ler")
async def marcar_como_lida(
    notificacao_id: int,
    session: AsyncSession = Depends(get_session),
):
    """Marca uma notificação como lida."""
    stmt = (
        update(Notificacao)
        .where(Notificacao.id == notificacao_id)
        .values(lida=True)
    )
    await session.execute(stmt)
    await session.commit()
    return {"ok": True}


@router.post("/ler-todas")
async def marcar_todas_como_lidas(
    session: AsyncSession = Depends(get_session),
):
    """Marca todas as notificações como lidas."""
    stmt = (
        update(Notificacao)
        .where(Notificacao.lida.is_(False))
        .values(lida=True)
    )
    await session.execute(stmt)
    await session.commit()
    return {"ok": True}
