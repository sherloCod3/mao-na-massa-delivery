"""Serviço de notificações — Telegram Bot API + banco in-app."""

import logging

import httpx

from app.config import settings
from app.database import async_session
from app.models.notificacao import Notificacao

logger = logging.getLogger(__name__)

# ─── Telegram ───────────────────────────────────────────────────


async def _telegram_send(text: str) -> bool:
    """Send a text message to the configured Telegram chat."""
    token = settings.telegram_bot_token
    chat_id = settings.telegram_chat_id
    if not token or not chat_id:
        logger.debug("Telegram não configurado — pulando notificação")
        return False

    try:
        url = f"https://api.telegram.org/bot{token}/sendMessage"
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(url, json={
                "chat_id": chat_id,
                "text": text,
                "parse_mode": "HTML",
                "disable_web_page_preview": True,
            })
        if resp.status_code != 200:
            logger.error("Telegram API error: %s — %s", resp.status_code, resp.text)
            return False
        return True
    except Exception as exc:
        logger.exception("Falha ao enviar notificação Telegram: %s", exc)
        return False


# ─── Banco (in-app) ──────────────────────────────────────────────


async def _salvar_notificacao(
    tipo: str,
    titulo: str,
    mensagem: str,
    referencia_tipo: str | None = None,
    referencia_id: int | None = None,
) -> Notificacao | None:
    """Persiste uma notificação no banco para exibição in-app."""
    try:
        async with async_session() as session:
            notif = Notificacao(
                tipo=tipo,
                titulo=titulo,
                mensagem=mensagem,
                referencia_tipo=referencia_tipo,
                referencia_id=referencia_id,
            )
            session.add(notif)
            await session.commit()
            await session.refresh(notif)
            return notif
    except Exception as exc:
        logger.exception("Falha ao salvar notificação: %s", exc)
        return None


# ─── Notificações públicas ────────────────────────────────────────


async def notificar_novo_pedido(
    pedido_id: int,
    cliente_nome: str,
    total: float,
    itens_resumo: str,
    whatsapp: str | None = None,
):
    """Notifica administrador sobre novo pedido."""
    titulo = f"🆕 Pedido #{pedido_id}"
    mensagem = f"Pedido de <b>{cliente_nome}</b> no valor de <b>R$ {total:.2f}</b>"
    contato = f"\n📞 Whatsapp: {whatsapp}" if whatsapp else ""
    detalhes = f"\n{itens_resumo}"

    texto_telegram = (
        f"<b>🆕 NOVO PEDIDO #{pedido_id}</b>\n"
        f"━━━━━━━━━━━━━━━━\n"
        f"👤 Cliente: {cliente_nome}{contato}\n"
        f"💰 Total: R$ {total:.2f}\n"
        f"{detalhes}\n"
        f"━━━━━━━━━━━━━━━━\n"
        f"🏠 <a href='{settings.app_url}/pedidos/{pedido_id}'>Abrir no painel</a>"
    )

    await _telegram_send(texto_telegram)
    await _salvar_notificacao(
        tipo="novo_pedido",
        titulo=titulo,
        mensagem=mensagem,
        referencia_tipo="pedido",
        referencia_id=pedido_id,
    )


async def notificar_status_pedido(
    pedido_id: int,
    cliente_nome: str,
    status_novo: str,
    total: float,
):
    """Notifica administrador sobre mudança de status do pedido."""
    emoji_map = {
        "recebido": "📥",
        "producao": "👨‍🍳",
        "entrega": "🚚",
        "entregue": "✅",
        "cancelado": "❌",
    }
    emoji = emoji_map.get(status_novo, "📌")
    status_nome = status_novo.capitalize()

    titulo = f"{emoji} Pedido #{pedido_id} — {status_nome}"
    mensagem = f"Status do pedido de {cliente_nome} alterado para: {status_nome}"

    texto_telegram = (
        f"{emoji} <b>Pedido #{pedido_id}</b>\n"
        f"Status: <b>{status_nome}</b>\n"
        f"👤 {cliente_nome}\n"
        f"💰 R$ {total:.2f}\n"
        f"<a href='{settings.app_url}/pedidos/{pedido_id}'>Ver no painel</a>"
    )

    await _telegram_send(texto_telegram)
    await _salvar_notificacao(
        tipo="status_pedido",
        titulo=titulo,
        mensagem=mensagem,
        referencia_tipo="pedido",
        referencia_id=pedido_id,
    )


async def notificar_estoque_baixo(ingrediente_nome: str, ingrediente_id: int):
    """Notifica administrador sobre ingrediente com estoque baixo."""
    titulo = f"⚠️ Estoque Baixo: {ingrediente_nome}"
    mensagem = f"O ingrediente <b>{ingrediente_nome}</b> está com estoque baixo e precisa ser reabastecido."

    texto_telegram = (
        f"<b>⚠️ ESTOQUE BAIXO</b>\n"
        f"━━━━━━━━━━━━━━━━\n"
        f"🧂 Ingrediente: {ingrediente_nome}\n"
        f"━━━━━━━━━━━━━━━━\n"
        f"<a href='{settings.app_url}/ingredientes/{ingrediente_id}'>Ver no painel</a>"
    )

    await _telegram_send(texto_telegram)
    await _salvar_notificacao(
        tipo="estoque_baixo",
        titulo=titulo,
        mensagem=mensagem,
        referencia_tipo="ingrediente",
        referencia_id=ingrediente_id,
    )
