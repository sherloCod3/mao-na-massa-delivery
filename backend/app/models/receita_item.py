from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.base import Base


class ReceitaItem(Base):
    """Links a Variacao to an Ingrediente with a quantity."""

    __tablename__ = "receita_itens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    variacao_id: Mapped[int] = mapped_column(ForeignKey("variacoes.id"), nullable=False)
    ingrediente_id: Mapped[int] = mapped_column(ForeignKey("ingredientes.id"), nullable=False)
    quantidade: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # relationships
    variacao: Mapped["Variacao"] = relationship(back_populates="receita")
    ingrediente: Mapped["Ingrediente"] = relationship(back_populates="receitas")

    def __repr__(self) -> str:
        return f"<ReceitaItem {self.id}: {self.quantidade}g de ingr.{self.ingrediente_id} na var.{self.variacao_id}>"
