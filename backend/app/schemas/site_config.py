from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class SiteConfigCreate(BaseModel):
    chave: str = Field(min_length=1, max_length=100, pattern=r"^[a-zA-Z0-9_-]+$")
    valor: str = ""
    tipo: str = Field(default="text", pattern=r"^(text|image|url|json)$")
    grupo: str = Field(default="geral", max_length=50)


class SiteConfigUpdate(BaseModel):
    valor: str | None = None
    tipo: str | None = Field(default=None, pattern=r"^(text|image|url|json)$")
    grupo: str | None = None


class SiteConfigResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    chave: str
    valor: str
    tipo: str
    grupo: str
    created_at: datetime
    updated_at: datetime


class SiteConfigPublicResponse(BaseModel):
    """Versão simplificada para a API pública — só chave → valor."""
    chave: str
    valor: str
    tipo: str
