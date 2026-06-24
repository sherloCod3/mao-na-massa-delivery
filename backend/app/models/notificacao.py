from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.base import Base


class Notificacao(Base):
    """Notificação gerada pelo sistema (in-app)."""

    __tablename__ = "notificacoes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tipo: Mapped[str] = mapped_column(String(30), nullable=False)  # novo_pedido, status_pedido, estoque_baixo
    titulo: Mapped[str] = mapped_column(String(200), nullable=False)
    mensagem: Mapped[str] = mapped_column(Text, nullable=False)
    referencia_tipo: Mapped[str | None] = mapped_column(String(30), nullable=True)  # pedido, ingrediente
    referencia_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    lida: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    def __repr__(self) -> str:
        return f"<Notificacao {self.id}: {self.tipo} — {self.titulo}>"
