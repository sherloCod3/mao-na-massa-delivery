from pydantic import BaseModel


class DashboardHojeResponse(BaseModel):
    pedidos_ativos: int = 0
    pedidos_entregues_hoje: int = 0
    faturamento_hoje: float = 0.0
    custo_total_estimado: float = 0.0
    lucro_estimado: float = 0.0
    total_pedidos: int = 0
    pedidos_por_status: dict[str, int] = {}


class DashboardPeriodoResponse(BaseModel):
    total_pedidos: int = 0
    total_faturado: float = 0.0
    total_custos: float = 0.0
    total_lucro: float = 0.0
    ticket_medio: float = 0.0


class MesItem(BaseModel):
    mes: str  # "2026-01"
    faturamento: float = 0.0
    custos: float = 0.0
    lucro: float = 0.0
    total_pedidos: int = 0


class DashboardMensalResponse(BaseModel):
    meses: list[MesItem] = []


class ProdutoMaisVendido(BaseModel):
    produto_nome: str
    variacao_nome: str
    quantidade: int = 0
    total_faturado: float = 0.0


class DashboardTopProdutosResponse(BaseModel):
    produtos: list[ProdutoMaisVendido] = []
