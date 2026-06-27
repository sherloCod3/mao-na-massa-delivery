from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import verify_admin
from app.database import get_session
from app.errors import NotFoundError
from app.models.testimonial import Testimonial
from app.schemas.testimonial import TestimonialResponse, TestimonialUpdate

router = APIRouter(
    prefix="/admin/testimonials",
    tags=["Admin — Depoimentos"],
    dependencies=[Depends(verify_admin)],
)


@router.get("", response_model=list[TestimonialResponse])
async def listar_depoimentos(
    status_filter: str | None = None,
    session: AsyncSession = Depends(get_session),
):
    """Lista todos os depoimentos. Admin pode filtrar por status."""
    query = select(Testimonial).order_by(Testimonial.created_at.desc())
    if status_filter:
        query = query.where(Testimonial.status == status_filter)
    result = await session.execute(query)
    return result.scalars().all()


@router.get("/{testimonial_id}", response_model=TestimonialResponse)
async def obter_depoimento(
    testimonial_id: int,
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(Testimonial).where(Testimonial.id == testimonial_id)
    )
    depoimento = result.scalar_one_or_none()
    if not depoimento:
        raise NotFoundError("Depoimento", testimonial_id)
    return depoimento


@router.put("/{testimonial_id}", response_model=TestimonialResponse)
async def atualizar_depoimento(
    testimonial_id: int,
    data: TestimonialUpdate,
    session: AsyncSession = Depends(get_session),
):
    """Admin atualiza/moderada um depoimento (aprova, rejeita, edita)."""
    result = await session.execute(
        select(Testimonial).where(Testimonial.id == testimonial_id)
    )
    depoimento = result.scalar_one_or_none()
    if not depoimento:
        raise NotFoundError("Depoimento", testimonial_id)

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(depoimento, key, value)

    await session.commit()
    await session.refresh(depoimento)
    return depoimento


@router.delete("/{testimonial_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deletar_depoimento(
    testimonial_id: int,
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(Testimonial).where(Testimonial.id == testimonial_id)
    )
    depoimento = result.scalar_one_or_none()
    if not depoimento:
        raise NotFoundError("Depoimento", testimonial_id)
    await session.delete(depoimento)
    await session.commit()
