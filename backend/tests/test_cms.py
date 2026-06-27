"""Tests for CMS endpoints — SiteConfig and Testimonials (Fases A/B/C)."""

import pytest
from httpx import AsyncClient


class TestAdminSiteConfig:
    """CRUD tests for /api/v1/admin/site-config."""

    async def test_list_empty(self, client: AsyncClient):
        resp = await client.get("/api/v1/admin/site-config")
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_create(self, client: AsyncClient):
        resp = await client.post("/api/v1/admin/site-config", json={
            "chave": "hero_title", "valor": "Salgados Teste", "tipo": "text", "grupo": "hero",
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["chave"] == "hero_title"
        assert data["valor"] == "Salgados Teste"
        assert data["tipo"] == "text"
        assert data["grupo"] == "hero"
        assert "id" in data

    async def test_create_duplicate(self, client: AsyncClient):
        await client.post("/api/v1/admin/site-config", json={
            "chave": "dup_key", "valor": "v1", "tipo": "text",
        })
        resp = await client.post("/api/v1/admin/site-config", json={
            "chave": "dup_key", "valor": "v2", "tipo": "text",
        })
        assert resp.status_code == 409  # ConflictError

    async def test_create_validation_error(self, client: AsyncClient):
        resp = await client.post("/api/v1/admin/site-config", json={
            "chave": "", "valor": "teste",
        })
        assert resp.status_code == 422

    async def test_get_by_chave(self, client: AsyncClient):
        await client.post("/api/v1/admin/site-config", json={
            "chave": "test_chave", "valor": "Teste Valor", "tipo": "text", "grupo": "geral",
        })
        resp = await client.get("/api/v1/admin/site-config/test_chave")
        assert resp.status_code == 200
        assert resp.json()["valor"] == "Teste Valor"

    async def test_get_not_found(self, client: AsyncClient):
        resp = await client.get("/api/v1/admin/site-config/nao_existe")
        assert resp.status_code == 404

    async def test_update(self, client: AsyncClient):
        await client.post("/api/v1/admin/site-config", json={
            "chave": "update_test", "valor": "original", "tipo": "text",
        })
        resp = await client.put("/api/v1/admin/site-config/update_test", json={
            "valor": "atualizado",
        })
        assert resp.status_code == 200
        assert resp.json()["valor"] == "atualizado"

    async def test_delete(self, client: AsyncClient):
        await client.post("/api/v1/admin/site-config", json={
            "chave": "delete_test", "valor": "to_delete", "tipo": "text",
        })
        resp = await client.delete("/api/v1/admin/site-config/delete_test")
        assert resp.status_code == 204

        # Confirm deleted
        resp = await client.get("/api/v1/admin/site-config/delete_test")
        assert resp.status_code == 404

    async def test_list_by_group(self, client: AsyncClient):
        await client.post("/api/v1/admin/site-config", json={
            "chave": "g1", "valor": "v1", "tipo": "text", "grupo": "grupo_a",
        })
        await client.post("/api/v1/admin/site-config", json={
            "chave": "g2", "valor": "v2", "tipo": "text", "grupo": "grupo_b",
        })
        resp = await client.get("/api/v1/admin/site-config?grupo=grupo_a")
        assert resp.status_code == 200
        data = resp.json()
        assert all(c["grupo"] == "grupo_a" for c in data)


class TestPublicSiteConfig:
    """Tests for /api/v1/publico/site-config (read-only)."""

    async def test_list_public(self, client: AsyncClient):
        # Create configs first
        await client.post("/api/v1/admin/site-config", json={
            "chave": "public_hero", "valor": "Hero Title", "tipo": "text", "grupo": "hero",
        })
        await client.post("/api/v1/admin/site-config", json={
            "chave": "public_contato", "valor": "11999999999", "tipo": "text", "grupo": "contato",
        })

        resp = await client.get("/api/v1/publico/site-config")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        # Public response should only have chave, valor, tipo
        assert "chave" in data[0]
        assert "valor" in data[0]
        assert "tipo" in data[0]
        # Should NOT expose internal fields
        assert "id" not in data[0]
        assert "grupo" not in data[0]

    async def test_list_public_by_group(self, client: AsyncClient):
        # Create data within the test (DB is reset between tests)
        await client.post("/api/v1/admin/site-config", json={
            "chave": "hero_group_item", "valor": "Hero", "tipo": "text", "grupo": "hero",
        })
        await client.post("/api/v1/admin/site-config", json={
            "chave": "contato_group_item", "valor": "Tel", "tipo": "text", "grupo": "contato",
        })
        # Filter by hero group
        resp = await client.get("/api/v1/publico/site-config?grupo=hero")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["chave"] == "hero_group_item"
        assert data[0]["valor"] == "Hero"


class TestTestimonials:
    """Tests for public testimonial submission and admin moderation."""

    async def test_public_submit(self, client: AsyncClient):
        resp = await client.post("/api/v1/publico/testimonials", json={
            "cliente_nome": "Maria",
            "texto": "Adorei os salgados! Super recomendo.",
            "nota": 5,
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["cliente_nome"] == "Maria"
        assert data["texto"] == "Adorei os salgados! Super recomendo."
        assert data["nota"] == 5
        # Public response should NOT expose status
        assert "status" not in data

    async def test_public_submit_validation(self, client: AsyncClient):
        # Nome muito curto
        resp = await client.post("/api/v1/publico/testimonials", json={
            "cliente_nome": "A", "texto": "Texto válido aqui",
        })
        assert resp.status_code == 422

        # Texto muito curto
        resp = await client.post("/api/v1/publico/testimonials", json={
            "cliente_nome": "João", "texto": "Curto",
        })
        assert resp.status_code == 422

        # Nota inválida
        resp = await client.post("/api/v1/publico/testimonials", json={
            "cliente_nome": "João", "texto": "Texto válido para teste", "nota": 10,
        })
        assert resp.status_code == 422

    async def test_public_list_approved_only(self, client: AsyncClient):
        """Public GET should only return approved testimonials."""
        resp = await client.get("/api/v1/publico/testimonials")
        assert resp.status_code == 200
        data = resp.json()
        # All returned should be approved (none yet since we didn't approve)
        assert all(t["cliente_nome"] != "Maria" for t in data)

    async def test_admin_moderation_flow(self, client: AsyncClient):
        # Submit testimonial (creates as pendente)
        submit = await client.post("/api/v1/publico/testimonials", json={
            "cliente_nome": "Ana",
            "texto": "Pudim maravilhoso, melhor da cidade!",
            "nota": 4,
        })
        tid = submit.json()["id"]

        # Admin: list pendentes
        resp = await client.get("/api/v1/admin/testimonials?status_filter=pendente")
        assert resp.status_code == 200
        pendentes = resp.json()
        assert any(t["id"] == tid for t in pendentes)
        # Admin response SHOULD have status
        assert "status" in pendentes[0]

        # Admin: approve
        resp = await client.put(f"/api/v1/admin/testimonials/{tid}", json={
            "status": "aprovado", "destaque": True,
        })
        assert resp.status_code == 200
        assert resp.json()["status"] == "aprovado"
        assert resp.json()["destaque"] is True

        # Admin: list aprovados
        resp = await client.get("/api/v1/admin/testimonials?status_filter=aprovado")
        assert resp.status_code == 200
        assert any(t["id"] == tid for t in resp.json())

        # Public: should now show Ana's testimonial
        resp = await client.get("/api/v1/publico/testimonials")
        assert resp.status_code == 200
        data = resp.json()
        assert any(t["cliente_nome"] == "Ana" for t in data)

        # Admin: reject
        resp = await client.put(f"/api/v1/admin/testimonials/{tid}", json={
            "status": "rejeitado",
        })
        assert resp.status_code == 200
        assert resp.json()["status"] == "rejeitado"

        # Admin: delete
        resp = await client.delete(f"/api/v1/admin/testimonials/{tid}")
        assert resp.status_code == 204

        # Confirm deleted
        resp = await client.get("/api/v1/admin/testimonials")
        assert resp.status_code == 200
        assert all(t["id"] != tid for t in resp.json())

    async def test_admin_update_fields(self, client: AsyncClient):
        # Create
        resp = await client.post("/api/v1/publico/testimonials", json={
            "cliente_nome": "Original", "texto": "Texto original aqui mesmo",
        })
        tid = resp.json()["id"]

        # Update nome + texto
        resp = await client.put(f"/api/v1/admin/testimonials/{tid}", json={
            "cliente_nome": "Editado", "texto": "Texto editado pelo admin",
        })
        assert resp.status_code == 200
        assert resp.json()["cliente_nome"] == "Editado"
        assert resp.json()["texto"] == "Texto editado pelo admin"
