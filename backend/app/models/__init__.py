"""Models package — all models are imported here so Base.metadata knows about them."""
from app.models.ingrediente import Ingrediente
from app.models.produto import Produto
from app.models.variacao import Variacao
from app.models.receita_item import ReceitaItem
from app.models.pedido import Pedido, StatusPedido
from app.models.item_pedido import ItemPedido
from app.models.lista_compras import ListaCompraItem, ListaSalva
from app.models.notificacao import Notificacao

__all__ = [
    "Ingrediente",
    "Produto",
    "Variacao",
    "ReceitaItem",
    "Pedido",
    "StatusPedido",
    "ItemPedido",
    "ListaCompraItem",
    "ListaSalva",
    "Notificacao",
]
