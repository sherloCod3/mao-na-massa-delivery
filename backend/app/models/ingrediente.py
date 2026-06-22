from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.base import Base


class Ingrediente(Base):
    __tablename__ = "ingredientes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nome: Mapped[str] = mapped_column(String(200), nullable=False)
    unidade_medida: Mapped[str] = mapped_column(String(20), nullable=False)  # g, ml, un
    preco_atual: Mapped[float] = mapped_column(Float, default=0.0)
    embalagem: Mapped[float] = mapped_column(Float, default=1.0)  # ex: 1000 se preco for por kg e unidade for g
    ativo: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), onupdate=func.now())

    # relationships
    receitas: Mapped[list["ReceitaItem"]] = relationship(back_populates="ingrediente")

    def __repr__(self) -> str:
        return f"<Ingrediente {self.id}: {self.nome}>"
