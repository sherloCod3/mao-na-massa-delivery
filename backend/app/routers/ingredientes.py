from fastapi import APIRouter, BackgroundTasks, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.errors import NotFoundError, ValidationError
from app.models.ingrediente import Ingrediente
from app.schemas.ingrediente import (
    IngredienteCreate,
    IngredienteResponse,
    IngredienteUpdate,
)
from app.models.movimentacao_estoque import MovimentacaoEstoque
from app.schemas.movimentacao import MovimentacaoCreate, MovimentacaoResponse
from app.services.notificador import notificar_estoque_baixo

router = APIRouter(prefix="/ingredientes", tags=["Ingredientes"])


@router.get("", response_model=list[IngredienteResponse])
async def listar_ingredientes(
    apenas_ativos: bool = True,
    session: AsyncSession = Depends(get_session),
):
    query = select(Ingrediente).order_by(Ingrediente.nome)
    if apenas_ativos:
        query = query.where(Ingrediente.ativo.is_(True))
    result = await session.execute(query)
    return result.scalars().all()


@router.post("", response_model=IngredienteResponse, status_code=status.HTTP_201_CREATED)
async def criar_ingrediente(
    data: IngredienteCreate,
    session: AsyncSession = Depends(get_session),
):
    ingrediente = Ingrediente(**data.model_dump())
    session.add(ingrediente)
    await session.commit()
    await session.refresh(ingrediente)
    return ingrediente


@router.get("/{ingrediente_id}", response_model=IngredienteResponse)
async def obter_ingrediente(
    ingrediente_id: int,
    session: AsyncSession = Depends(get_session),
):
    ingrediente = await session.get(Ingrediente, ingrediente_id)
    if not ingrediente:
        raise NotFoundError("Ingrediente", ingrediente_id)
    return ingrediente


@router.put("/{ingrediente_id}", response_model=IngredienteResponse)
async def atualizar_ingrediente(
    ingrediente_id: int,
    data: IngredienteUpdate,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_session),
):
    ingrediente = await session.get(Ingrediente, ingrediente_id)
    if not ingrediente:
        raise NotFoundError("Ingrediente", ingrediente_id)

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(ingrediente, key, value)

    await session.commit()
    await session.refresh(ingrediente)

    # Verificar estoque baixo (fire-and-forget)
    background_tasks.add_task(
        _verificar_estoque_baixo,
        ingrediente.id, ingrediente.nome,
        ingrediente.quantidade_estoque, ingrediente.estoque_minimo,
        ingrediente.ativo,
    )

    return ingrediente


@router.delete("/{ingrediente_id}", status_code=status.HTTP_204_NO_CONTENT)
async def desativar_ingrediente(
    ingrediente_id: int,
    session: AsyncSession = Depends(get_session),
):
    ingrediente = await session.get(Ingrediente, ingrediente_id)
    if not ingrediente:
        raise NotFoundError("Ingrediente", ingrediente_id)
    ingrediente.ativo = False
    await session.commit()


@router.get("/{ingrediente_id}/movimentacoes", response_model=list[MovimentacaoResponse])
async def listar_movimentacoes(
    ingrediente_id: int,
    limite: int = 50,
    session: AsyncSession = Depends(get_session),
):
    """Retorna o histórico de movimentações de estoque de um ingrediente."""
    ingrediente = await session.get(Ingrediente, ingrediente_id)
    if not ingrediente:
        raise NotFoundError("Ingrediente", ingrediente_id)

    query = (
        select(MovimentacaoEstoque)
        .where(MovimentacaoEstoque.ingrediente_id == ingrediente_id)
        .order_by(MovimentacaoEstoque.created_at.desc())
        .limit(limite)
    )
    result = await session.execute(query)
    return result.scalars().all()


@router.post("/{ingrediente_id}/movimentar", response_model=MovimentacaoResponse)
async def movimentar_estoque(
    ingrediente_id: int,
    data: MovimentacaoCreate,
    session: AsyncSession = Depends(get_session),
):
    """Registra entrada ou saída de estoque e atualiza o saldo do ingrediente."""
    ingrediente = await session.get(Ingrediente, ingrediente_id)
    if not ingrediente:
        raise NotFoundError("Ingrediente", ingrediente_id)

    saldo_anterior = ingrediente.quantidade_estoque

    if data.tipo == "entrada":
        novo_saldo = saldo_anterior + data.quantidade
    else:  # saida
        if data.quantidade > saldo_anterior:
            raise ValidationError(
                message=f"Estoque insuficiente. Disponível: {saldo_anterior:.2f}, solicitado: {data.quantidade:.2f}",
                details={"disponivel": saldo_anterior, "solicitado": data.quantidade},
            )
        novo_saldo = saldo_anterior - data.quantidade

    mov = MovimentacaoEstoque(
        ingrediente_id=ingrediente_id,
        tipo=data.tipo,
        quantidade=data.quantidade,
        saldo_anterior=saldo_anterior,
        saldo_posterior=round(novo_saldo, 4),
        motivo=data.motivo,
    )
    session.add(mov)

    ingrediente.quantidade_estoque = round(novo_saldo, 4)
    await session.commit()
    await session.refresh(mov)
    return mov


async def _verificar_estoque_baixo(
    ingrediente_id: int,
    nome: str,
    quantidade_estoque: float,
    estoque_minimo: float,
    ativo: bool,
):
    """Verifica se o ingrediente está com estoque baixo e notifica (roda em BackgroundTask).

    Usa os campos reais de estoque definidos pelo usuário.
    """
    if not ativo or estoque_minimo <= 0:
        return

    if quantidade_estoque <= estoque_minimo:
        try:
            await notificar_estoque_baixo(nome, ingrediente_id)
        except Exception:
            import logging
            logging.getLogger(__name__).exception(
                "Falha ao notificar estoque baixo para ingrediente %d (%s)",
                ingrediente_id, nome,
            )
