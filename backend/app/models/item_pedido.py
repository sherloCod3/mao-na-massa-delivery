from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.base import Base


class ItemPedido(Base):
    __tablename__ = "itens_pedido"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    pedido_id: Mapped[int] = mapped_column(ForeignKey("pedidos.id"), nullable=False)
    variacao_id: Mapped[int] = mapped_column(ForeignKey("variacoes.id"), nullable=False)
    quantidade: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    preco_unitario: Mapped[float] = mapped_column(Float, nullable=False)
    customizacoes: Mapped[str | None] = mapped_column(
        String(500), nullable=True
    )  # JSON string: [{"nome": "catupiry extra", "preco": 2.0}]
    subtotal: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # relationships
    pedido: Mapped["Pedido"] = relationship(back_populates="itens")
    variacao: Mapped["Variacao"] = relationship(back_populates="itens_pedido")

    def __repr__(self) -> str:
        return f"<ItemPedido {self.id}: {self.quantidade}x var.{self.variacao_id} ped.{self.pedido_id}>"
