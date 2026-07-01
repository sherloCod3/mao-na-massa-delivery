"""Models package — all models are imported here so Base.metadata knows about them."""

from app.models.ingrediente import Ingrediente
from app.models.item_pedido import ItemPedido
from app.models.lista_compras import ListaCompraItem, ListaSalva
from app.models.movimentacao_estoque import MovimentacaoEstoque
from app.models.notificacao import Notificacao
from app.models.pedido import Pedido, StatusPedido
from app.models.produto import Produto
from app.models.receita_item import ReceitaItem
from app.models.site_config import SiteConfig
from app.models.status_history import StatusHistory
from app.models.testimonial import Testimonial
from app.models.variacao import Variacao

__all__ = [
    "Ingrediente",
    "ItemPedido",
    "ListaCompraItem",
    "ListaSalva",
    "MovimentacaoEstoque",
    "Notificacao",
    "Pedido",
    "Produto",
    "ReceitaItem",
    "SiteConfig",
    "StatusHistory",
    "StatusPedido",
    "Testimonial",
    "Variacao",
]
