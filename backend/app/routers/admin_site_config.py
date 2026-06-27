from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import verify_admin
from app.database import get_session
from app.errors import ConflictError, NotFoundError
from app.models.site_config import SiteConfig
from app.schemas.site_config import (
    SiteConfigCreate,
    SiteConfigResponse,
    SiteConfigUpdate,
)

router = APIRouter(
    prefix="/admin/site-config",
    tags=["Admin — Configuração do Site"],
    dependencies=[Depends(verify_admin)],
)


@router.get("", response_model=list[SiteConfigResponse])
async def listar_configuracoes(
    grupo: str | None = None,
    session: AsyncSession = Depends(get_session),
):
    query = select(SiteConfig).order_by(SiteConfig.grupo, SiteConfig.chave)
    if grupo:
        query = query.where(SiteConfig.grupo == grupo)
    result = await session.execute(query)
    return result.scalars().all()


@router.get("/{chave}", response_model=SiteConfigResponse)
async def obter_configuracao(
    chave: str,
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(SiteConfig).where(SiteConfig.chave == chave))
    config = result.scalar_one_or_none()
    if not config:
        raise NotFoundError("Configuração", chave)
    return config


@router.post("", response_model=SiteConfigResponse, status_code=status.HTTP_201_CREATED)
async def criar_configuracao(
    data: SiteConfigCreate,
    session: AsyncSession = Depends(get_session),
):
    # Verificar se chave já existe
    existing = await session.execute(select(SiteConfig).where(SiteConfig.chave == data.chave))
    if existing.scalar_one_or_none():
        raise ConflictError(f"Chave '{data.chave}' já existe")

    config = SiteConfig(**data.model_dump())
    session.add(config)
    await session.commit()
    await session.refresh(config)
    return config


@router.put("/{chave}", response_model=SiteConfigResponse)
async def atualizar_configuracao(
    chave: str,
    data: SiteConfigUpdate,
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(SiteConfig).where(SiteConfig.chave == chave))
    config = result.scalar_one_or_none()
    if not config:
        raise NotFoundError("Configuração", chave)

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(config, key, value)

    await session.commit()
    await session.refresh(config)
    return config


@router.delete("/{chave}", status_code=status.HTTP_204_NO_CONTENT)
async def deletar_configuracao(
    chave: str,
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(SiteConfig).where(SiteConfig.chave == chave))
    config = result.scalar_one_or_none()
    if not config:
        raise NotFoundError("Configuração", chave)
    await session.delete(config)
    await session.commit()
