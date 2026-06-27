from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class TestimonialCreate(BaseModel):
    """Schema para o cliente enviar um depoimento (rota pública)."""
    cliente_nome: str = Field(min_length=2, max_length=150)
    texto: str = Field(min_length=10, max_length=1000)
    nota: int | None = Field(default=None, ge=1, le=5)
    foto_url: str | None = None


class TestimonialUpdate(BaseModel):
    """Schema para admin editar/moderar (rota admin)."""
    cliente_nome: str | None = None
    texto: str | None = None
    nota: int | None = Field(default=None, ge=1, le=5)
    foto_url: str | None = None
    status: str | None = Field(default=None, pattern=r"^(pendente|aprovado|rejeitado)$")
    destaque: bool | None = None


class TestimonialResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    cliente_nome: str
    texto: str
    nota: int | None = None
    foto_url: str | None = None
    status: str
    destaque: bool
    created_at: datetime
    updated_at: datetime


class TestimonialPublicResponse(BaseModel):
    """Versão pública — só dados do depoimento aprovado, sem metadados de moderação."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    cliente_nome: str
    texto: str
    nota: int | None = None
    foto_url: str | None = None
    destaque: bool
    created_at: datetime
