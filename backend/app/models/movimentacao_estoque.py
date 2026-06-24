from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.base import Base


class MovimentacaoEstoque(Base):
    """Registro de movimentação de estoque — entrada ou saída de ingrediente."""

    __tablename__ = "movimentacoes_estoque"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    ingrediente_id: Mapped[int] = mapped_column(
        ForeignKey("ingredientes.id"), nullable=False, index=True
    )
    tipo: Mapped[str] = mapped_column(String(10), nullable=False)  # "entrada" | "saida"
    quantidade: Mapped[float] = mapped_column(Float, nullable=False)
    saldo_anterior: Mapped[float] = mapped_column(Float, nullable=False)
    saldo_posterior: Mapped[float] = mapped_column(Float, nullable=False)
    motivo: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # relationships
    ingrediente: Mapped["Ingrediente"] = relationship(back_populates="movimentacoes")

    def __repr__(self) -> str:
        return (
            f"<MovimentacaoEstoque {self.id}: {self.tipo} {self.quantidade}"
            f" ingr.{self.ingrediente_id}>"
        )
