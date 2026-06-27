from fastapi import APIRouter, Depends, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import limiter
from app.database import get_session
from app.models.testimonial import Testimonial
from app.schemas.testimonial import TestimonialCreate, TestimonialPublicResponse

router = APIRouter(prefix="/publico/testimonials", tags=["Público — Depoimentos"])


@router.get("", response_model=list[TestimonialPublicResponse])
async def listar_depoimentos_aprovados(
    session: AsyncSession = Depends(get_session),
):
    """Retorna apenas depoimentos aprovados para exibição na landing page."""
    query = (
        select(Testimonial)
        .where(Testimonial.status == "aprovado")
        .order_by(Testimonial.destaque.desc(), Testimonial.created_at.desc())
    )
    result = await session.execute(query)
    return result.scalars().all()


@router.post("", response_model=TestimonialPublicResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
async def enviar_depoimento(
    request: Request,
    data: TestimonialCreate,
    session: AsyncSession = Depends(get_session),
):
    """Cliente envia um depoimento (criado como 'pendente' — aguarda moderação)."""
    depoimento = Testimonial(
        cliente_nome=data.cliente_nome,
        texto=data.texto,
        nota=data.nota,
        foto_url=data.foto_url,
        status="pendente",
    )
    session.add(depoimento)
    await session.commit()
    await session.refresh(depoimento)

    # Retorna como resposta pública (sem campos de moderação expostos)
    return TestimonialPublicResponse.model_validate(depoimento)
