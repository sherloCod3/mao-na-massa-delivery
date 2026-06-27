from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.base import Base


class SiteConfig(Base):
    """Configuração do site — chave-valor para conteúdo editável da landing page.

    Cada linha é uma configuração atômica:
      - ``chave`` : identificador único (ex: "hero_title", "contato_whatsapp")
      - ``valor`` : conteúdo JSON serializado
      - ``tipo``  : dica pro frontend renderizar (text, image, url, json)
      - ``grupo`` : agrupamento visual no painel admin (hero, contato, redes, about)

    Admin altera pelo painel; landing page consome via API pública.
    """

    __tablename__ = "site_config"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    chave: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    valor: Mapped[str] = mapped_column(Text, nullable=False, default="")
    tipo: Mapped[str] = mapped_column(String(20), nullable=False, default="text")  # text, image, url, json
    grupo: Mapped[str] = mapped_column(String(50), nullable=False, default="geral")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    def __repr__(self) -> str:
        return f"<SiteConfig {self.chave}={self.valor[:40]}>"
