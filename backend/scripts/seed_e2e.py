"""Seed E2E test data: produtos, variações e pedidos de exemplo.

Uso:
  cd backend && uv run python scripts/seed_e2e.py

Requer ADMIN_TOKEN configurado via env var (senão auth fica livre em dev).
Pode ser executado múltiplas vezes — cria dados novos com sufixo incremental.
"""

import asyncio
import uuid
from datetime import UTC, datetime, timedelta

from app.database import async_session
from app.models.item_pedido import ItemPedido
from app.models.pedido import Pedido, StatusPedido
from app.models.produto import Produto
from app.models.status_history import StatusHistory
from app.models.variacao import Variacao


async def seed():
    print("🌱 Seeding E2E test data...")
    created = 0

    async with async_session() as session:
        # ─── Produto: Coxinha ─────────────────────────────
        produto = Produto(
            nome="Coxinha (E2E)",
            descricao="Coxinha de frango com catupiry — criada pelo seed E2E",
            ativo=True,
        )
        session.add(produto)
        await session.flush()

        variacao1 = Variacao(
            produto_id=produto.id,
            nome="Coxinha Tradicional (E2E)",
            preco_venda=8.00,
            preco_minimo=6.00,
            margem_percentual=40.0,
            custo_unitario=3.50,
            preco_sugerido=8.00,
            ativo=True,
        )
        session.add(variacao1)

        variacao2 = Variacao(
            produto_id=produto.id,
            nome="Coxinha Gigante (E2E)",
            preco_venda=14.00,
            preco_minimo=10.00,
            margem_percentual=40.0,
            custo_unitario=5.50,
            preco_sugerido=14.00,
            ativo=True,
        )
        session.add(variacao2)

        # ─── Produto: Empada ──────────────────────────────
        produto2 = Produto(
            nome="Empada (E2E)",
            descricao="Empada de frango — criada pelo seed E2E",
            ativo=True,
        )
        session.add(produto2)
        await session.flush()

        variacao3 = Variacao(
            produto_id=produto2.id,
            nome="Empada de Frango (E2E)",
            preco_venda=7.00,
            preco_minimo=5.00,
            margem_percentual=35.0,
            custo_unitario=3.00,
            preco_sugerido=7.00,
            ativo=True,
        )
        session.add(variacao3)
        await session.flush()

        print(f"  ✅ Produtos criados: coxinha (id={produto.id}), empada (id={produto2.id})")
        print(f"  ✅ Variações: {variacao1.nome} (id={variacao1.id}), {variacao2.nome} (id={variacao2.id}), {variacao3.nome} (id={variacao3.id})")

        # ─── Pedidos em diferentes status ─────────────────
        statuses = [
            StatusPedido.pendente,
            StatusPedido.producao,
            StatusPedido.produzido,
            StatusPedido.entrega,
            StatusPedido.entregue,
        ]

        for i, status in enumerate(statuses):
            criado_em = datetime.now(UTC) - timedelta(hours=len(statuses) - i)
            pedido = Pedido(
                cliente_nome=f"Cliente E2E {i + 1}",
                cliente_whatsapp="5511999999999",
                token_acesso=str(uuid.uuid4()),
                status=status.value,
                forma_pagamento="PIX",
                total=round(30.0 + i * 10, 2),
                created_at=criado_em,
                updated_at=criado_em,
                observacoes=f"Pedido E2E #{i + 1} — status {status.value}",
            )
            session.add(pedido)
            await session.flush()

            # Adiciona item ao pedido
            variacao_id = variacao1.id if i % 2 == 0 else variacao3.id
            item = ItemPedido(
                pedido_id=pedido.id,
                variacao_id=variacao_id,
                quantidade=2 + i,
                preco_unitario=8.0,
                subtotal=round((2 + i) * 8.0, 2),
            )
            session.add(item)

            # Histórico de status
            hist = StatusHistory(
                pedido_id=pedido.id,
                status_anterior=None,
                status_novo=status.value,
                alterado_por="sistema",
                created_at=criado_em,
            )
            session.add(hist)

            # Se status > pendente, adiciona transições anteriores
            status_flow = [
                StatusPedido.pendente,
                StatusPedido.producao,
                StatusPedido.produzido,
                StatusPedido.entrega,
                StatusPedido.entregue,
            ]
            current_idx = status_flow.index(status)
            for j in range(1, current_idx + 1):
                ts = criado_em - timedelta(hours=current_idx - j + 1)
                hist_anterior = StatusHistory(
                    pedido_id=pedido.id,
                    status_anterior=status_flow[j - 1].value if j > 0 else None,
                    status_novo=status_flow[j].value,
                    alterado_por="sistema",
                    created_at=ts,
                )
                session.add(hist_anterior)

            created += 1
            print(f"  📦 Pedido #{pedido.id}: {pedido.cliente_nome} → {status.value} (R$ {pedido.total:.2f})")

        await session.commit()

    print(f"\n✅ Seed E2E concluído! {created} pedidos criados.")
    print(f"\n🔑 Admin token: e2e-admin-2026")
    print(f"   Use: export ADMIN_TOKEN=e2e-admin-2026")
    print(f"   Ou configure no .env da API")


if __name__ == "__main__":
    asyncio.run(seed())
