import json
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_session
from app.models.ingrediente import Ingrediente
from app.models.lista_compras import ListaCompraItem, ListaSalva
from app.schemas.lista_compras import (
    ListaCompraItemCreate,
    ListaCompraItemResponse,
    ListaCompraItemUpdate,
    ListaCompraResumo,
    ListaSalvaCreate,
    ListaSalvaResumo,
    SugestaoIngrediente,
)

router = APIRouter(tags=["Lista de Compras"])


# ─── Itens ─────────────────────────────────────────────────────────


@router.get("/lista-compras", response_model=list[ListaCompraItemResponse])
async def listar_itens(session: AsyncSession = Depends(get_session)):
    result = await session.execute(
        select(ListaCompraItem).order_by(ListaCompraItem.comprado, ListaCompraItem.nome)
    )
    return result.scalars().all()


@router.get("/lista-compras/resumo", response_model=ListaCompraResumo)
async def resumo_lista(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(ListaCompraItem))
    itens = result.scalars().all()
    total_estimado = sum(i.valor_estimado or 0 for i in itens if not i.comprado)
    total_comprado = sum(i.valor_estimado or 0 for i in itens if i.comprado)
    return ListaCompraResumo(
        total_estimado=total_estimado,
        total_comprado=total_comprado,
        itens_pendentes=sum(1 for i in itens if not i.comprado),
        itens_comprados=sum(1 for i in itens if i.comprado),
    )


@router.post("/lista-compras", response_model=ListaCompraItemResponse, status_code=status.HTTP_201_CREATED)
async def criar_item(
    data: ListaCompraItemCreate,
    session: AsyncSession = Depends(get_session),
):
    item = ListaCompraItem(**data.model_dump())
    session.add(item)
    await session.commit()
    await session.refresh(item)
    return item


@router.put("/lista-compras/{item_id}", response_model=ListaCompraItemResponse)
async def atualizar_item(
    item_id: int,
    data: ListaCompraItemUpdate,
    session: AsyncSession = Depends(get_session),
):
    item = await session.get(ListaCompraItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    await session.commit()
    await session.refresh(item)
    return item


@router.delete("/lista-compras/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remover_item(item_id: int, session: AsyncSession = Depends(get_session)):
    item = await session.get(ListaCompraItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    await session.delete(item)
    await session.commit()


@router.post("/lista-compras/limpar-comprados", status_code=status.HTTP_204_NO_CONTENT)
async def limpar_comprados(session: AsyncSession = Depends(get_session)):
    result = await session.execute(
        select(ListaCompraItem).where(ListaCompraItem.comprado.is_(True))
    )
    for item in result.scalars():
        await session.delete(item)
    await session.commit()


# ─── Sugestões ──────────────────────────────────────────────────────


@router.get("/lista-compras/sugestoes", response_model=list[SugestaoIngrediente])
async def sugerir_ingredientes(session: AsyncSession = Depends(get_session)):
    """Retorna ingredientes que ainda não estão na lista de compras."""
    # Busca nomes já na lista
    result = await session.execute(select(ListaCompraItem.nome))
    nomes_na_lista = {row[0].strip().lower() for row in result}

    # Busca ingredientes ativos
    result = await session.execute(
        select(Ingrediente).where(Ingrediente.ativo.is_(True)).order_by(Ingrediente.nome)
    )
    sugestoes = []
    for ing in result.scalars():
        if ing.nome.strip().lower() not in nomes_na_lista:
            sugestoes.append(
                SugestaoIngrediente(
                    nome=ing.nome,
                    unidade_medida=ing.unidade_medida,
                    valor_sugerido=ing.preco_atual,
                )
            )
    return sugestoes


# ─── Listas Salvas ──────────────────────────────────────────────────


@router.get("/lista-compras/salvas", response_model=list[ListaSalvaResumo])
async def listar_salvas(session: AsyncSession = Depends(get_session)):
    result = await session.execute(
        select(ListaSalva).order_by(ListaSalva.created_at.desc())
    )
    salvas = result.scalars().all()
    return [
        ListaSalvaResumo(
            id=s.id,
            nome=s.nome,
            total_itens=len(json.loads(s.itens_json)),
            created_at=s.created_at,
        )
        for s in salvas
    ]


@router.post("/lista-compras/salvar", response_model=ListaSalvaResumo, status_code=status.HTTP_201_CREATED)
async def salvar_lista(
    data: ListaSalvaCreate,
    session: AsyncSession = Depends(get_session),
):
    """Salva a lista atual como template (copia itens pendentes)."""
    result = await session.execute(
        select(ListaCompraItem).order_by(ListaCompraItem.nome)
    )
    itens = result.scalars().all()
    if not itens:
        raise HTTPException(status_code=400, detail="Lista vazia — adicione itens antes de salvar")

    itens_data = [
        {
            "nome": i.nome,
            "quantidade": i.quantidade,
            "unidade_medida": i.unidade_medida,
            "valor_estimado": i.valor_estimado,
        }
        for i in itens
    ]

    salva = ListaSalva(nome=data.nome)
    salva.set_itens(itens_data)
    session.add(salva)
    await session.commit()
    await session.refresh(salva)

    return ListaSalvaResumo(
        id=salva.id,
        nome=salva.nome,
        total_itens=len(itens_data),
        created_at=salva.created_at,
    )


@router.post("/lista-compras/carregar/{salva_id}", response_model=list[ListaCompraItemResponse])
async def carregar_lista(
    salva_id: int,
    session: AsyncSession = Depends(get_session),
):
    """Copia os itens de uma lista salva para a lista atual."""
    salva = await session.get(ListaSalva, salva_id)
    if not salva:
        raise HTTPException(status_code=404, detail="Lista salva não encontrada")

    itens_data = salva.get_itens()
    criados = []
    for item_data in itens_data:
        item = ListaCompraItem(
            nome=item_data["nome"],
            quantidade=item_data.get("quantidade"),
            unidade_medida=item_data.get("unidade_medida"),
            valor_estimado=item_data.get("valor_estimado"),
            comprado=False,
        )
        session.add(item)
        criados.append(item)

    await session.commit()
    for item in criados:
        await session.refresh(item)

    return criados


@router.delete("/lista-compras/salvas/{salva_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deletar_salva(salva_id: int, session: AsyncSession = Depends(get_session)):
    salva = await session.get(ListaSalva, salva_id)
    if not salva:
        raise HTTPException(status_code=404, detail="Lista salva não encontrada")
    await session.delete(salva)
    await session.commit()
