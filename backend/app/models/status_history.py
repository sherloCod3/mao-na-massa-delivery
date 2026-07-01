from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.base import Base


class StatusHistory(Base):
    """Registro de mudanças de status de um pedido."""

    __tablename__ = "status_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    pedido_id: Mapped[int] = mapped_column(
        ForeignKey("pedidos.id", ondelete="CASCADE"), nullable=False, index=True
    )
    status_anterior: Mapped[str | None] = mapped_column(String(20), nullable=True)
    status_novo: Mapped[str] = mapped_column(String(20), nullable=False)
    alterado_por: Mapped[str] = mapped_column(String(20), nullable=False, default="admin")
    """Quem alterou: 'admin' | 'sistema' | 'cliente'."""
    motivo: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )

    # relationships
    pedido: Mapped["Pedido"] = relationship(back_populates="status_history")

    def __repr__(self) -> str:
        return (
            f"<StatusHistory {self.id}: "
            f"{self.status_anterior}→{self.status_novo} "
            f"(ped.{self.pedido_id})>"
        )
