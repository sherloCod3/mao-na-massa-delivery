# Fase 5: Relatórios Avançados

> **Status:** 📋 Planejado
> **Prioridade:** Média (após estabilizar WhatsApp e PWA)
> **Dependências:** Nenhuma (backend já tem os dados)

---

## ✅ O Que Já Está Feito

| Funcionalidade | Onde | Status |
|---|---|---|
| Dashboard Hoje (cards + status chart) | `Dashboard.tsx` + `dashboard.py` | ✅ |
| Gráfico Mensal (6/12 meses) | `MensalChart.tsx` + `dashboard/mensal` | ✅ |
| Relatório por Período (c/lucro real) | `Dashboard.tsx` + `dashboard/periodo` | ✅ |
| Top Produtos (mais vendidos) | `TopProdutos.tsx` + `dashboard/top-produtos` | ✅ |
| Exportação CSV | `csv.ts` + botões nas tabs Mensal e Produtos | ✅ |
| Nível de Estoque | `EstoqueChart.tsx` + `ingredientes/{id}/movimentacoes` | ✅ |
| Alerta de Estoque Baixo | `EstoqueBaixoAlert` no Dashboard + `Ingredientes.tsx` | ✅ |

---

## 📋 O Que Falta (ordenado por impacto)

### 1. Sazonalidade — Produtos por Período 🔥

**Problema:** "Quais produtos vendem mais no fim de semana vs dia de semana? E por mês?"

**Backend:**
```python
# NOVO: GET /api/v1/dashboard/sazonalidade
# Query params: mes (1-12), dia_semana (0-6), data_inicio, data_fim
# Response: { periodo: str, produtos: [{ nome, variacao, quantidade, total_faturado }] }
```

**Frontend:**
- Nova tab "Sazonalidade" no Dashboard
- Seletor: "Por mês" | "Por dia da semana" | "Personalizado"
- Gráfico de barras comparativo (Recharts)

**Estimativa:** 2h

---

### 2. Relatório de Custos Detalhado 📊

**Problema:** O dashboard já mostra custo total, mas não detalha por ingrediente/produto.

**Backend:**
```python
# NOVO: GET /api/v1/dashboard/custos-detalhados
# Response: {
#   periodo: { inicio, fim },
#   total_gasto: float,
#   por_ingrediente: [{ nome, quantidade_gasta, valor_gasto, percentual }],
#   por_produto: [{ nome, quantidade_produzida, custo_total, percentual }]
# }
```

**Frontend:**
- Nova tab "Custos" no Dashboard
- Tabela com ordenação por valor gasto
- Gráfico de pizza/rosca por ingrediente

**Estimativa:** 3h

---

### 3. Exportação PDF 📄

**Problema:** Admin quer imprimir/exportar relatório bonito para compartilhar.

**Backend:**
- Gerar PDF no servidor (ReportLab ou WeasyPrint)
- `GET /api/v1/dashboard/exportar-pdf?tipo=mensal&meses=6`
- Ou usar `html2canvas` no frontend para gerar PDF client-side

**Frontend:**
- Botão "Exportar PDF" nas tabs
- PDF com logo, período, tabelas, gráficos

**Estimativa:** 4h

---

### 4. Filtros Avançados no Dashboard 🔍

**Problema:** Dashboard hoje só mostra "tudo" sem drill-down.

**Backend:** Já existem filtros `?data_inicio=&data_fim=` nos endpoints de período.

**Frontend:**
- Adicionar filtro de data na tab "Hoje"
- Adicionar filtro de produto na tab "Mensal"
- Drill-down: clicar em um mês no gráfico → ver detalhamento do mês

**Estimativa:** 2h

---

### 5. Métricas de Performance ⏱️

**Problema:** "Qual o tempo médio entre recebido e entregue?"

**Backend:**
```python
# GET /api/v1/dashboard/metricas
# Response: {
#   tempo_medio_entrega: float (horas),
#   taxa_cancelamento: float (%),
#   ticket_medio_periodo: float,
#   dias_mais_movimentados: [{ dia_semana: str, total_pedidos: int }]
# }
```

**Frontend:**
- Cards no topo do Dashboard com as métricas

**Estimativa:** 2h

---

## 🗺 Roadmap Sugerido

```
Sprint 1 (3h) ─ Sazonalidade + Métricas de Performance
  ├── Backend: /dashboard/sazonalidade, /dashboard/metricas
  └── Frontend: Nova tab + cards

Sprint 2 (3h) ─ Custos Detalhados
  ├── Backend: /dashboard/custos-detalhados
  └── Frontend: Nova tab + gráfico de pizza + tabela

Sprint 3 (4h) ─ Exportação PDF + Filtros
  └── PDF client-side ou server-side + drill-down no dashboard
```

---

## 💡 Decisões de Arquitetura

| Decisão | Opção | Escolha | Motivo |
|---------|-------|---------|--------|
| **PDF** | Server-side vs Client-side | **Client-side** (html2canvas + jsPDF) | Zero dependência extra no backend; admin pode gerar no browser sem esperar servidor |
| **Gráfico pizza** | Recharts vs Nivo | **Recharts** (já usado) | Consistência com gráfico mensal já existente |
| **Sazonalidade** | Nova rota vs query existente | **Nova rota** | Lógica específica de agregação por período |

---

## 🚫 Não Escopo (por enquanto)

- Relatórios por email agendado — será Fase 6 (Notificações)
- Previsão de demanda com ML — overengineering para o estágio atual
- Dashboard em tempo real com WebSocket — polling é suficiente
