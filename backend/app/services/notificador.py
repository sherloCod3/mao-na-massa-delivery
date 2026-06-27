"""Serviço de notificações — Telegram Bot API + banco in-app."""

import logging
from urllib.parse import quote

import httpx
from app.config import settings
from app.database import async_session
from app.models.notificacao import Notificacao

logger = logging.getLogger(__name__)

# ─── WhatsApp (wa.me links) ──────────────────────────────────────


def gerar_link_whatsapp(telefone: str, mensagem: str) -> str | None:
    """Gera um link wa.me com mensagem pré-preenchida.

    Args:
        telefone: Número com DDD (ex: 11999999999) — sem 55.
        mensagem: Texto livre que será URL-encoded.

    Returns:
        URL completa do wa.me ou None se telefone for inválido.
    """
    if not telefone:
        return None
    # Remove tudo que não é dígito
    digitos = "".join(c for c in telefone if c.isdigit())
    if len(digitos) < 10:
        return None
    # Adiciona 55 (Brasil) se não tiver código de país
    if not digitos.startswith("55"):
        digitos = f"55{digitos}"
    texto = quote(mensagem)
    return f"https://wa.me/{digitos}?text={texto}"


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
            resp = await client.post(
                url,
                json={
                    "chat_id": chat_id,
                    "text": text,
                    "parse_mode": "HTML",
                    "disable_web_page_preview": True,
                },
            )
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


async def _whatsapp_evolution_enviar(telefone: str, mensagem: str) -> bool:
    """Send a WhatsApp message via Evolution API (self-hosted Docker)."""
    api_url = settings.evolution_api_url
    api_key = settings.evolution_api_key
    if not api_url or not api_key:
        return False

    digitos = "".join(c for c in telefone if c.isdigit())
    if not digitos.startswith("55"):
        digitos = f"55{digitos}"

    instance = "mao-na-massa"
    try:
        url = f"{api_url.rstrip('/')}/message/send/{instance}"
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                url,
                headers={"apikey": api_key, "Content-Type": "application/json"},
                json={"number": digitos, "text": mensagem, "delay": 1},
            )
        if resp.status_code not in (200, 201):
            logger.error("Evolution API error: %s — %s", resp.status_code, resp.text)
            return False
        return True
    except Exception as exc:
        logger.exception("Falha ao enviar WhatsApp Evolution: %s", exc)
        return False


async def notificar_novo_pedido(
    pedido_id: int,
    cliente_nome: str,
    total: float,
    itens_resumo: str,
    whatsapp: str | None = None,
    token_acesso: str | None = None,
):
    """Notifica administrador sobre novo pedido."""
    titulo = f"🆕 Pedido #{pedido_id}"
    mensagem = f"Pedido de <b>{cliente_nome}</b> no valor de <b>R$ {total:.2f}</b>"
    contato = f"\n📞 Whatsapp: {whatsapp}" if whatsapp else ""
    detalhes = f"\n{itens_resumo}"

    tracking_url = f"{settings.app_url}/track/{token_acesso}" if token_acesso else None
    tracking_linha = f"\n📍 Acompanhe: {tracking_url}" if tracking_url else ""

    # Gerar link wa.me + Evolution API se configurado
    msg_cliente = (
        f"━━━ 🧾 PEDIDO #{pedido_id} ━━━\n\n"
        f"👤 Olá {cliente_nome}!\n"
        f"💰 Total: R$ {total:.2f}\n"
        f"📥 Status: *Recebido*\n"
    )
    if itens_resumo:
        msg_cliente += f"\n── Itens ──\n{itens_resumo}\n"
    msg_cliente += (
        f"────────────────\n"
        f"{tracking_linha}\n"
        f"Em breve começaremos a preparar! 👨‍🍳\n"
        f"Obrigado por comprar no Mão na Massa! 🎉\n"
        f"━━━ 🥟 Mão na Massa ━━━"
    )
    link_whatsapp = gerar_link_whatsapp(whatsapp, msg_cliente) if whatsapp else None

    # WhatsApp automático via Evolution API (se configurado)
    if whatsapp and settings.evolution_api_url:
        await _whatsapp_evolution_enviar(whatsapp, msg_cliente)

    texto_telegram = (
        f"<b>🆕 NOVO PEDIDO #{pedido_id}</b>\n"
        f"━━━━━━━━━━━━━━━━\n"
        f"👤 Cliente: {cliente_nome}{contato}\n"
        f"💰 Total: R$ {total:.2f}\n"
        f"{detalhes}\n"
        f"━━━━━━━━━━━━━━━━\n"
        f"🏠 <a href='{settings.app_url}/pedidos/{pedido_id}'>Abrir no painel</a>"
    )

    if tracking_url:
        texto_telegram += f"\n📍 <a href='{tracking_url}'>Tracking do cliente</a>"

    if link_whatsapp:
        texto_telegram += f"\n📱 <a href='{link_whatsapp}'>WhatsApp para {cliente_nome}</a>"

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
    whatsapp: str | None = None,
    token_acesso: str | None = None,
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

    tracking_url = f"{settings.app_url}/track/{token_acesso}" if token_acesso else None
    tracking_linha = f"\n📍 Acompanhe: {tracking_url}" if tracking_url else ""

    # WhatsApp automático via Evolution API + wa.me link
    msg_cliente = (
        f"━━━ 🧾 PEDIDO #{pedido_id} ━━━\n\n"
        f"👤 Olá {cliente_nome}!\n"
        f"💰 Total: R$ {total:.2f}\n"
        f"{emoji} Status: *{status_nome}*\n"
        f"────────────────\n"
        f"{tracking_linha}\n\n"
        f"Obrigado por comprar no Mão na Massa! 🎉\n"
        f"━━━ 🥟 Mão na Massa ━━━"
    )
    link_whatsapp = gerar_link_whatsapp(whatsapp, msg_cliente) if whatsapp else None

    # WhatsApp automático via Evolution API (se configurado)
    if whatsapp and settings.evolution_api_url:
        await _whatsapp_evolution_enviar(whatsapp, msg_cliente)

    texto_telegram = (
        f"{emoji} <b>Pedido #{pedido_id}</b>\n"
        f"Status: <b>{status_nome}</b>\n"
        f"👤 {cliente_nome}\n"
        f"💰 R$ {total:.2f}\n"
        f"━━━━━━━━━━━━━━━━\n"
        f"🏠 <a href='{settings.app_url}/pedidos/{pedido_id}'>Ver no painel</a>"
    )

    if tracking_url:
        texto_telegram += f"\n📍 <a href='{tracking_url}'>Tracking do cliente</a>"

    if link_whatsapp:
        texto_telegram += f"\n📱 <a href='{link_whatsapp}'>WhatsApp para {cliente_nome}</a>"

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
