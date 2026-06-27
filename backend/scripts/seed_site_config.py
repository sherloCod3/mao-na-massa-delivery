"""Seed data: popula configurações iniciais do site na landing page.

Uso:
  cd backend && uv run python scripts/seed_site_config.py

Pode ser executado múltiplas vezes — ignora chaves já existentes.
"""

import asyncio

from app.database import async_session
from app.models.site_config import SiteConfig
from sqlalchemy import select

SEED_CONFIGS: list[dict] = [
    # ─── Hero ────────────────────────────────────────────────
    {
        "chave": "hero_title",
        "valor": "Salgados & Doces Artesanais",
        "tipo": "text",
        "grupo": "hero",
    },
    {
        "chave": "hero_subtitle",
        "valor": "Feitos com ingredientes selecionados e muito carinho para tornar seu dia mais saboroso",
        "tipo": "text",
        "grupo": "hero",
    },
    {"chave": "hero_cta_text", "valor": "Faça seu Pedido", "tipo": "text", "grupo": "hero"},
    # ─── Sobre ───────────────────────────────────────────────
    {"chave": "about_title", "valor": "Nossa História", "tipo": "text", "grupo": "about"},
    {
        "chave": "about_content",
        "valor": "Tudo começou na cozinha de casa, com a vontade de transformar receitas de família em momentos especiais. Hoje, levamos todo esse carinho até você, com salgados e doces feitos artesanalmente, ingredientes frescos e aquele sabor que só o preparo caseiro tem.",
        "tipo": "text",
        "grupo": "about",
    },
    # ─── Contato ─────────────────────────────────────────────
    {"chave": "contato_whatsapp", "valor": "5511999999999", "tipo": "text", "grupo": "contato"},
    {"chave": "contato_telefone", "valor": "", "tipo": "text", "grupo": "contato"},
    {"chave": "contato_endereco", "valor": "", "tipo": "text", "grupo": "contato"},
    {
        "chave": "contato_horario",
        "valor": "Seg-Sex: 8h às 18h\nSáb: 8h às 12h",
        "tipo": "text",
        "grupo": "contato",
    },
    # ─── Delivery ────────────────────────────────────────────
    {"chave": "delivery_taxa", "valor": "Grátis", "tipo": "text", "grupo": "delivery"},
    {
        "chave": "delivery_raio",
        "valor": "Entregamos em toda a cidade",
        "tipo": "text",
        "grupo": "delivery",
    },
    # ─── Redes Sociais ───────────────────────────────────────
    {"chave": "redes_instagram", "valor": "@maonamassa", "tipo": "text", "grupo": "redes"},
]


async def seed():
    print("🌱 Seeding SiteConfig...")
    created = 0
    skipped = 0

    async with async_session() as session:
        for cfg in SEED_CONFIGS:
            result = await session.execute(
                select(SiteConfig).where(SiteConfig.chave == cfg["chave"])
            )
            existing = result.scalar_one_or_none()
            if existing:
                print(f"  ⏭️  {cfg['chave']} — já existe, ignorando")
                skipped += 1
                continue

            session.add(SiteConfig(**cfg))
            created += 1

        await session.commit()

    print(f"\n✅ Seed concluído! {created} criados, {skipped} ignorados.")


if __name__ == "__main__":
    asyncio.run(seed())
