from app.routers.ingredientes import router as ingredientes_router
from app.routers.produtos import router as produtos_router
from app.routers.variacoes import router as variacoes_router
from app.routers.pedidos import router as pedidos_router
from app.routers.publico import router as publico_router
from app.routers.dashboard import router as dashboard_router
from app.routers.lista_compras import router as lista_compras_router
from app.routers.notificacoes import router as notificacoes_router
from app.routers.admin_auth import router as admin_auth_router
from app.routers.admin_site_config import router as admin_site_config_router
from app.routers.admin_testimonials import router as admin_testimonials_router
from app.routers.publico_site_config import router as publico_site_config_router
from app.routers.publico_testimonials import router as publico_testimonials_router

__all__ = [
    "admin_auth_router",
    "ingredientes_router",
    "produtos_router",
    "variacoes_router",
    "pedidos_router",
    "publico_router",
    "dashboard_router",
    "lista_compras_router",
    "notificacoes_router",
    "admin_site_config_router",
    "admin_testimonials_router",
    "publico_site_config_router",
    "publico_testimonials_router",
]
