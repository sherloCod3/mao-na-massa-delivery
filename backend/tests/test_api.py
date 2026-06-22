"""API tests for Mão na Massa backend."""

import pytest
from httpx import AsyncClient


class TestIngredientes:
    """CRUD tests for /api/v1/ingredientes."""

    async def test_list_empty(self, client: AsyncClient):
        resp = await client.get("/api/v1/ingredientes")
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_create(self, client: AsyncClient):
        payload = {
            "nome": "Farinha de Trigo",
            "unidade_medida": "kg",
            "preco_atual": 5.50,
            "embalagem": 1.0,
        }
        resp = await client.post("/api/v1/ingredientes", json=payload)
        assert resp.status_code == 201
        data = resp.json()
        assert data["nome"] == "Farinha de Trigo"
        assert data["preco_atual"] == 5.50
        assert data["ativo"] is True
        assert "id" in data

    async def test_create_validation_error(self, client: AsyncClient):
        resp = await client.post("/api/v1/ingredientes", json={"nome": ""})
        assert resp.status_code == 422

    async def test_get_by_id(self, client: AsyncClient):
        created = await client.post("/api/v1/ingredientes", json={
            "nome": "Óleo", "unidade_medida": "ml", "preco_atual": 12.0, "embalagem": 900.0,
        })
        cid = created.json()["id"]
        resp = await client.get(f"/api/v1/ingredientes/{cid}")
        assert resp.status_code == 200
        assert resp.json()["nome"] == "Óleo"

    async def test_get_not_found(self, client: AsyncClient):
        resp = await client.get("/api/v1/ingredientes/99999")
        assert resp.status_code == 404

    async def test_update(self, client: AsyncClient):
        created = await client.post("/api/v1/ingredientes", json={
            "nome": "Sal", "unidade_medida": "kg", "preco_atual": 2.0, "embalagem": 1.0,
        })
        cid = created.json()["id"]
        resp = await client.put(f"/api/v1/ingredientes/{cid}", json={
            "nome": "Sal Marinho", "unidade_medida": "kg", "preco_atual": 3.5, "embalagem": 1.0,
        })
        assert resp.status_code == 200
        assert resp.json()["nome"] == "Sal Marinho"
        assert resp.json()["preco_atual"] == 3.5

    async def test_delete(self, client: AsyncClient):
        created = await client.post("/api/v1/ingredientes", json={
            "nome": "Leite", "unidade_medida": "l", "preco_atual": 6.0, "embalagem": 1.0,
        })
        cid = created.json()["id"]
        resp = await client.delete(f"/api/v1/ingredientes/{cid}")
        assert resp.status_code == 204

        # Soft delete: ingredient still exists but is inactive
        resp = await client.get(f"/api/v1/ingredientes/{cid}")
        assert resp.status_code == 200
        assert resp.json()["ativo"] is False

        # And inactive items are excluded from list
        resp = await client.get("/api/v1/ingredientes")
        ids = [i["id"] for i in resp.json()]
        assert cid not in ids


class TestProdutos:
    """CRUD tests for /api/v1/produtos."""

    async def test_create_produto(self, client: AsyncClient):
        resp = await client.post("/api/v1/produtos", json={
            "nome": "Coxinha", "descricao": "Frango com catupiry",
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["nome"] == "Coxinha"
        assert data["ativo"] is True
        assert "id" in data

    async def test_list_produtos(self, client: AsyncClient):
        await client.post("/api/v1/produtos", json={"nome": "Pudim"})
        await client.post("/api/v1/produtos", json={"nome": "Brigadeiro"})
        resp = await client.get("/api/v1/produtos")
        assert resp.status_code == 200
        assert len(resp.json()) == 2


class TestVariacoes:
    """Tests for variações endpoints."""

    async def test_crud_flow(self, client: AsyncClient):
        # Create a product
        prod = await client.post("/api/v1/produtos", json={"nome": "Empada"})
        pid = prod.json()["id"]

        # Create variation
        resp = await client.post(f"/api/v1/produtos/{pid}/variacoes", json={
            "nome": "Empada de Frango", "preco_venda": 8.0, "margem_percentual": 40.0,
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["nome"] == "Empada de Frango"
        assert data["produto_id"] == pid
        vid = data["id"]

        # List variations
        resp = await client.get(f"/api/v1/produtos/{pid}/variacoes")
        assert resp.status_code == 200
        assert len(resp.json()) == 1

        # Update variation
        resp = await client.put(f"/api/v1/variacoes/{vid}", json={
            "nome": "Empada de Frango c/ Catupiry", "preco_venda": 9.0, "margem_percentual": 45.0,
        })
        assert resp.status_code == 200
        assert resp.json()["nome"] == "Empada de Frango c/ Catupiry"

        # Delete variation
        resp = await client.delete(f"/api/v1/variacoes/{vid}")
        assert resp.status_code == 204


class TestPedidos:
    """Tests for pedidos CRUD and status flow."""

    async def test_create_order(self, client: AsyncClient):
        # Setup: create product + variation
        prod = await client.post("/api/v1/produtos", json={"nome": "Produto Teste"})
        pid = prod.json()["id"]
        var = await client.post(f"/api/v1/produtos/{pid}/variacoes", json={
            "nome": "Variação A", "preco_venda": 10.0, "margem_percentual": 30.0,
        })
        vid = var.json()["id"]

        # Create order
        resp = await client.post("/api/v1/pedidos", json={
            "cliente_nome": "Maria",
            "cliente_whatsapp": "11999999999",
            "forma_pagamento": "PIX",
            "observacoes": "Sem cebola",
            "itens": [{"variacao_id": vid, "quantidade": 2, "preco_unitario": 10.0, "customizacoes": []}],
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["cliente_nome"] == "Maria"
        assert data["status"] == "recebido"
        assert data["total"] == 20.0
        assert len(data["itens"]) == 1
        assert "token_acesso" in data

    async def test_list_orders(self, client: AsyncClient):
        resp = await client.get("/api/v1/pedidos")
        assert resp.status_code == 200

    async def test_status_flow(self, client: AsyncClient):
        # Create product+variation+order
        prod = await client.post("/api/v1/produtos", json={"nome": "P"})
        pid = prod.json()["id"]
        var = await client.post(f"/api/v1/produtos/{pid}/variacoes", json={
            "nome": "V", "preco_venda": 5.0, "margem_percentual": 20.0,
        })
        vid = var.json()["id"]
        order = await client.post("/api/v1/pedidos", json={
            "cliente_nome": "João",
            "itens": [{"variacao_id": vid, "quantidade": 1, "preco_unitario": 5.0, "customizacoes": []}],
        })
        oid = order.json()["id"]

        # Advance: recebido → producao
        resp = await client.put(f"/api/v1/pedidos/{oid}/status", json={"status": "producao"})
        assert resp.status_code == 200
        assert resp.json()["status"] == "producao"

        # Advance: producao → entrega
        resp = await client.put(f"/api/v1/pedidos/{oid}/status", json={"status": "entrega"})
        assert resp.status_code == 200
        assert resp.json()["status"] == "entrega"

        # Advance: entrega → entregue
        resp = await client.put(f"/api/v1/pedidos/{oid}/status", json={"status": "entregue"})
        assert resp.status_code == 200
        assert resp.json()["status"] == "entregue"

    async def test_delete_order(self, client: AsyncClient):
        prod = await client.post("/api/v1/produtos", json={"nome": "P2"})
        pid = prod.json()["id"]
        var = await client.post(f"/api/v1/produtos/{pid}/variacoes", json={
            "nome": "V2", "preco_venda": 3.0, "margem_percentual": 20.0,
        })
        vid = var.json()["id"]
        order = await client.post("/api/v1/pedidos", json={
            "cliente_nome": "Ana",
            "itens": [{"variacao_id": vid, "quantidade": 1, "preco_unitario": 3.0, "customizacoes": []}],
        })
        oid = order.json()["id"]

        resp = await client.delete(f"/api/v1/pedidos/{oid}")
        assert resp.status_code == 204


class TestTracking:
    """Tests for public tracking endpoint."""

    async def test_tracking_link(self, client: AsyncClient):
        prod = await client.post("/api/v1/produtos", json={"nome": "T"})
        pid = prod.json()["id"]
        var = await client.post(f"/api/v1/produtos/{pid}/variacoes", json={
            "nome": "TV", "preco_venda": 7.0, "margem_percentual": 20.0,
        })
        vid = var.json()["id"]
        order = await client.post("/api/v1/pedidos", json={
            "cliente_nome": "Cliente Teste",
            "itens": [{"variacao_id": vid, "quantidade": 3, "preco_unitario": 7.0, "customizacoes": []}],
        })
        token = order.json()["token_acesso"]

        # Public tracking
        resp = await client.get(f"/api/v1/publico/pedidos/{token}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["cliente_nome"] == "Cliente Teste"
        assert data["status"] == "recebido"
        assert data["total"] == 21.0

        # Invalid token
        resp = await client.get("/api/v1/publico/pedidos/invalid-token-123")
        assert resp.status_code == 404


class TestDashboard:
    """Tests for dashboard endpoints."""

    async def test_dashboard_hoje(self, client: AsyncClient):
        resp = await client.get("/api/v1/dashboard/hoje")
        assert resp.status_code == 200
        data = resp.json()
        assert "total_pedidos" in data
        assert "faturamento_hoje" in data
        assert "pedidos_ativos" in data
        assert "pedidos_entregues_hoje" in data
        assert "pedidos_por_status" in data

    async def test_dashboard_periodo(self, client: AsyncClient):
        resp = await client.get("/api/v1/dashboard/periodo")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, dict)
        assert "total_pedidos" in data
        assert "total_faturado" in data
