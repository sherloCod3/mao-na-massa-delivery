from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.models.site_config import SiteConfig
from app.schemas.site_config import SiteConfigPublicResponse

router = APIRouter(prefix="/publico/site-config", tags=["Público — Configuração do Site"])


@router.get("", response_model=list[SiteConfigPublicResponse])
async def listar_configuracoes_publicas(
    grupo: str | None = None,
    session: AsyncSession = Depends(get_session),
):
    """Retorna todas as configurações do site para a landing page.

    Opcionalmente filtra por grupo (ex: ``?grupo=hero``).
    """
    query = select(SiteConfig).order_by(SiteConfig.grupo, SiteConfig.chave)
    if grupo:
        query = query.where(SiteConfig.grupo == grupo)
    result = await session.execute(query)
    configs = result.scalars().all()
    return [SiteConfigPublicResponse(chave=c.chave, valor=c.valor, tipo=c.tipo) for c in configs]
