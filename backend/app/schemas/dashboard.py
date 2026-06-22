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
