from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.base import Base


class Variacao(Base):
    __tablename__ = "variacoes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    produto_id: Mapped[int] = mapped_column(ForeignKey("produtos.id"), nullable=False)
    nome: Mapped[str] = mapped_column(String(100), nullable=False)
    preco_venda: Mapped[float | None] = mapped_column(Float, nullable=True)
    preco_minimo: Mapped[float | None] = mapped_column(Float, nullable=True)
    margem_percentual: Mapped[float] = mapped_column(Float, nullable=False, default=50.0)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    # relationships
    produto: Mapped["Produto"] = relationship(back_populates="variacoes")
    receita: Mapped[list["ReceitaItem"]] = relationship(
        back_populates="variacao",
        cascade="all, delete-orphan",
    )
    itens_pedido: Mapped[list["ItemPedido"]] = relationship(back_populates="variacao")

    @property
    def custo_unitario(self) -> float:
        """Calculate unit cost from recipe ingredients."""
        if not self.receita:
            return 0.0
        total = 0.0
        for item in self.receita:
            preco_unit = (
                item.ingrediente.preco_atual / item.ingrediente.embalagem
                if item.ingrediente.embalagem > 0
                else 0
            )
            total += item.quantidade * preco_unit
        return round(total, 2)

    @property
    def preco_sugerido(self) -> float:
        """Suggested selling price based on cost + margin."""
        custo = self.custo_unitario
        if custo <= 0:
            return 0.0
        return round(custo * (1 + self.margem_percentual / 100), 2)

    def __repr__(self) -> str:
        return f"<Variacao {self.id}: {self.nome} (produto {self.produto_id})>"
