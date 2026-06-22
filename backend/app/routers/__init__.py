from app.routers.ingredientes import router as ingredientes_router
from app.routers.produtos import router as produtos_router
from app.routers.variacoes import router as variacoes_router
from app.routers.pedidos import router as pedidos_router
from app.routers.publico import router as publico_router
from app.routers.dashboard import router as dashboard_router
from app.routers.lista_compras import router as lista_compras_router

__all__ = [
    "ingredientes_router",
    "produtos_router",
    "variacoes_router",
    "pedidos_router",
    "publico_router",
    "dashboard_router",
    "lista_compras_router",
]
