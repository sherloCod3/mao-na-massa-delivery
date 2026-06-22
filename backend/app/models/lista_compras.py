import json
from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, Float, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.base import Base


class ListaCompraItem(Base):
    __tablename__ = "lista_compras"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nome: Mapped[str] = mapped_column(String(200), nullable=False)
    quantidade: Mapped[float | None] = mapped_column(Float)
    unidade_medida: Mapped[str | None] = mapped_column(String(20))
    valor_estimado: Mapped[float | None] = mapped_column(Float)
    comprado: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


class ListaSalva(Base):
    __tablename__ = "listas_salvas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nome: Mapped[str] = mapped_column(String(100), nullable=False)
    itens_json: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    def set_itens(self, itens: list[dict[str, Any]]) -> None:
        self.itens_json = json.dumps(itens)

    def get_itens(self) -> list[dict[str, Any]]:
        return json.loads(self.itens_json)
