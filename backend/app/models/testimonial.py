from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.base import Base


class Testimonial(Base):
    """Depoimento de cliente — exibido na landing page.

    Workflow de moderação:
      1. Cliente envia → status = "pendente"
      2. Admin revisa no painel → aprova ("aprovado") ou rejeita ("rejeitado")
      3. Landing page exibe apenas status = "aprovado"
    """

    __tablename__ = "testimonials"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    cliente_nome: Mapped[str] = mapped_column(String(150), nullable=False)
    texto: Mapped[str] = mapped_column(Text, nullable=False)
    nota: Mapped[int | None] = mapped_column(Integer, nullable=True)  # 1-5 estrelas
    foto_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pendente", index=True
    )  # pendente, aprovado, rejeitado
    destaque: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    def __repr__(self) -> str:
        return f"<Testimonial {self.id}: {self.cliente_nome} [{self.status}]>"
