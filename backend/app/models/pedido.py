from datetime import datetime
from enum import StrEnum

from sqlalchemy import DateTime, Enum, Float, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.base import Base

STATUS_FLOW = ["pendente", "producao", "produzido", "entrega", "entregue"]
"""Ordem canônica do fluxo de produção."""


class StatusPedido(StrEnum):
    pendente = "pendente"  # NOVO (substitui "recebido")
    producao = "producao"
    produzido = "produzido"  # NOVO
    entrega = "entrega"
    entregue = "entregue"
    pausado = "pausado"  # NOVO
    cancelado = "cancelado"


class Pedido(Base):
    __tablename__ = "pedidos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    cliente_nome: Mapped[str] = mapped_column(String(150), nullable=False)
    cliente_whatsapp: Mapped[str | None] = mapped_column(String(20), nullable=True)
    token_acesso: Mapped[str] = mapped_column(String(36), unique=True, nullable=False, index=True)
    status: Mapped[str] = mapped_column(
        Enum(StatusPedido),
        default=StatusPedido.pendente.value,
        nullable=False,
    )
    status_anterior: Mapped[str | None] = mapped_column(String(20), nullable=True)
    """Guarda o status anterior quando pausado, para retomar depois."""
    forma_pagamento: Mapped[str | None] = mapped_column(String(50), nullable=True)
    observacoes: Mapped[str | None] = mapped_column(Text, nullable=True)
    total: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    data_entrega: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    # relationships
    itens: Mapped[list["ItemPedido"]] = relationship(
        back_populates="pedido",
        cascade="all, delete-orphan",
        order_by="ItemPedido.id",
    )
    status_history: Mapped[list["StatusHistory"]] = relationship(
        back_populates="pedido",
        cascade="all, delete-orphan",
        order_by="StatusHistory.created_at.desc()",
    )

    def __repr__(self) -> str:
        return f"<Pedido {self.id}: {self.cliente_nome} [{self.status}]>"
