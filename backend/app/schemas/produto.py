from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ProdutoBase(BaseModel):
    nome: str
    descricao: str | None = None
    imagem_url: str | None = None


class ProdutoCreate(ProdutoBase):
    pass


class ProdutoUpdate(BaseModel):
    nome: str | None = None
    descricao: str | None = None
    imagem_url: str | None = None
    ativo: bool | None = None


class ProdutoResponse(ProdutoBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    ativo: bool
    created_at: datetime
    updated_at: datetime
