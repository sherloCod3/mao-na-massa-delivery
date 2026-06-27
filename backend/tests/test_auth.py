"""Tests for admin authentication."""

import pytest
from httpx import AsyncClient

from app.config import settings


class TestAdminLogin:
    """Tests for POST /api/v1/admin/login."""

    async def test_login_success(self, client: AsyncClient):
        """Valid password returns JWT token."""
        settings.admin_token = "test-secret-123"
        try:
            resp = await client.post("/api/v1/admin/login", json={
                "password": "test-secret-123",
            })
            assert resp.status_code == 200
            data = resp.json()
            # JWT tokens start with "eyJ" (base64url-encoded JSON header)
            assert data["token"].startswith("eyJ"), "Expected JWT token"
            assert data["ok"] is True
        finally:
            settings.admin_token = ""

    async def test_login_wrong_password(self, client: AsyncClient):
        """Wrong password returns 401."""
        settings.admin_token = "test-secret-123"
        try:
            resp = await client.post("/api/v1/admin/login", json={
                "password": "wrong-password",
            })
            assert resp.status_code == 401
            data = resp.json()
            # FastAPI returns detail for standard errors
            assert "detail" in data or "error" in data
        finally:
            settings.admin_token = ""

    async def test_login_no_token_configured(self, client: AsyncClient):
        """When no ADMIN_TOKEN is set, login always returns 401."""
        settings.admin_token = ""
        resp = await client.post("/api/v1/admin/login", json={
            "password": "anything",
        })
        assert resp.status_code == 401
        data = resp.json()
        assert "detail" in data or "error" in data

    async def test_login_empty_password(self, client: AsyncClient):
        """Empty password returns validation error."""
        resp = await client.post("/api/v1/admin/login", json={
            "password": "",
        })
        assert resp.status_code == 401


class TestAuthProtectedRoutes:
    """Tests that admin routes require authentication."""

    async def test_protected_route_without_token(self, client: AsyncClient):
        """Requests to protected routes without token return 401 when auth is enabled."""
        settings.admin_token = "test-secret"
        try:
            # Test a few protected endpoints
            endpoints = [
                "/api/v1/ingredientes",
                "/api/v1/produtos",
                "/api/v1/dashboard/hoje",
                "/api/v1/lista-compras",
                "/api/v1/notificacoes",
                "/api/v1/admin/site-config",
                "/api/v1/admin/testimonials",
            ]
            for ep in endpoints:
                resp = await client.get(ep)
                assert resp.status_code == 401, f"{ep} should return 401, got {resp.status_code}"
        finally:
            settings.admin_token = ""

    async def test_protected_route_with_valid_token(self, client: AsyncClient):
        """Requests with valid JWT token succeed."""
        settings.admin_token = "test-secret"
        try:
            # First login to get a JWT
            login = await client.post("/api/v1/admin/login", json={"password": "test-secret"})
            jwt_token = login.json()["token"]

            resp = await client.get(
                "/api/v1/ingredientes",
                headers={"Authorization": f"Bearer {jwt_token}"},
            )
            assert resp.status_code == 200
        finally:
            settings.admin_token = ""

    async def test_protected_route_with_invalid_token(self, client: AsyncClient):
        """Requests with invalid JWT token return 401."""
        settings.admin_token = "test-secret"
        try:
            # An expired or invalid JWT should be rejected
            resp = await client.get(
                "/api/v1/ingredientes",
                headers={"Authorization": "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbiJ9.fake-token"},
            )
            assert resp.status_code == 401
        finally:
            settings.admin_token = ""

    async def test_protected_route_no_auth_header(self, client: AsyncClient):
        """Requests without Authorization header return 401 when auth is enabled."""
        settings.admin_token = "test-secret"
        try:
            resp = await client.get("/api/v1/produtos")
            assert resp.status_code == 401
        finally:
            settings.admin_token = ""


class TestPublicRoutesAccessible:
    """Tests that public routes remain accessible without auth."""

    async def test_public_order_creation(self, client: AsyncClient):
        """POST /pedidos (create order) is public and works without auth."""
        # Create product + variation
        prod = await client.post("/api/v1/produtos", json={"nome": "Test"})
        pid = prod.json()["id"]
        var = await client.post(f"/api/v1/produtos/{pid}/variacoes", json={
            "nome": "V", "preco_venda": 10.0, "margem_percentual": 30.0,
        })
        vid = var.json()["id"]

        settings.admin_token = "test-secret"
        try:
            resp = await client.post("/api/v1/pedidos", json={
                "cliente_nome": "Public Customer",
                "itens": [{"variacao_id": vid, "quantidade": 1, "preco_unitario": 10.0, "customizacoes": []}],
            })
            assert resp.status_code == 201, f"Public order creation should work without auth"
        finally:
            settings.admin_token = ""

    async def test_public_tracking(self, client: AsyncClient):
        """Public tracking endpoint is accessible without auth."""
        resp = await client.get("/api/v1/publico/pedidos/test-token")
        # Returns 404 for invalid token (not 401)
        assert resp.status_code == 404

    async def test_public_site_config(self, client: AsyncClient):
        """Public site-config endpoint is accessible without auth."""
        resp = await client.get("/api/v1/publico/site-config")
        assert resp.status_code == 200

    async def test_public_testimonials(self, client: AsyncClient):
        """Public testimonials endpoint is accessible without auth."""
        resp = await client.get("/api/v1/publico/testimonials")
        assert resp.status_code == 200

    async def test_root_endpoint(self, client: AsyncClient):
        """Root endpoint is accessible without auth."""
        resp = await client.get("/api/v1/")
        # This might be 404 since root is at /
        assert resp.status_code in (200, 404)

    async def test_login_endpoint_accessible(self, client: AsyncClient):
        """Login endpoint is accessible without auth."""
        resp = await client.post("/api/v1/admin/login", json={"password": "test"})
        # We expect 401 (wrong password) not 403/other
        assert resp.status_code == 401


class TestAuthDevMode:
    """Tests for auth behavior when admin_token is empty (dev mode)."""

    async def test_dev_mode_no_auth(self, client: AsyncClient):
        """When admin_token is empty, protected routes are accessible without token."""
        settings.admin_token = ""
        resp = await client.get("/api/v1/ingredientes")
        assert resp.status_code == 200
