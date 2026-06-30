# Formação de Preço — Calculadora + Dashboard

> **Status:** 📋 Planejado
> **Impacto:** 🔥 Alto — impacto direto no lucro do negócio
> **Estimativa total:** ~6h

---

## 🎯 Problema

A admin (esposa do dev) precisa de duas coisas:

1. **Ver claramente** o preço de venda vs custo vs margem de cada produto já cadastrado
2. **Calcular na hora** o preço de um pedido personalizado — quando um cliente pede algo diferente do cardápio

O sistema já calcula `custo_unitario` e `preco_sugerido` automaticamente. O que falta é uma **interface visual** que torne isso óbvio e uma **calculadora rápida** para pedidos sob medida.

---

## ✅ O Que Já Existe

| Funcionalidade | Local |
|---|---|
| Custo unitário automático por receita | `Variacao.custo_unitario` (property) |
| Preço sugerido (custo × margem) | `Variacao.preco_sugerido` (property) |
| Endpoint de custo | `GET /variacoes/{id}/custo` → `CustoResponse` |
| Exibição custo/sugerido/margem | Cards de produto em `Produtos.tsx` |
| Margem configurável por variação | `Variacao.margem_percentual` |
| Preço mínimo por variação | `Variacao.preco_minimo` |

---

## 📋 Funcionalidades Propostas

### 1. Dashboard de Preços (dentro de Produtos)

**Problema:** Hoje o custo e margem aparecem em texto miúdo no card do produto. Difícil de comparar.

**Frontend (`Produtos.tsx`):**
- Linha de destaque no card com:
  ```
  [Preço Venda: R$ 12,00] [Custo: R$ 4,80] [Margem: 60%] [Lucro: R$ 7,20]
  ```
- Barra de progresso visual: `■ Preço ■ Custo ■ Lucro`
- Alerta visual quando preço_venda < preco_sugerido ou preco_minimo
- Destaque em verde/vermelho conforme margem saudável (>50% = verde, <30% = vermelho)

**Estimativa:** 1h

---

### 2. Calculadora de Preço Rápida 🧮

**Problema:** Cliente pede "20 coxinhas de frango com catupiry, mas maior que o normal". A admin precisa calcular na hora.

**Backend (NOVO):**
```python
# POST /api/v1/calculadora/preco
# Body: {
#   "ingredientes": [{ "ingrediente_id": 1, "quantidade": 50 }],
#   "margem_percentual": 60,
#   "quantidade_unidades": 20
# }
# Response: {
#   "custo_unitario": 4.80,
#   "preco_sugerido_unitario": 7.68,
#   "preco_sugerido_total": 153.60,
#   "margem_percentual": 60,
#   "detalhes": [
#     { "ingrediente": "Farinha", "quantidade": 50, "custo": 0.80 }
#   ]
# }
```

**Frontend (NOVA PÁGINA):**
- Rota: `/admin/calculadora-preco`
- Link na sidebar: "Calculadora de Preço"
- Formulário:
  1. Selecione ingredientes (AutocompleteIngrediente) + quantidade
  2. Adicione quantos ingredientes quiser (igual ao form de receita)
  3. Ajuste margem (slider ou input numérico)
  4. Informe quantidade de unidades
  5. Veja o resultado em tempo real
- Resultado:
  - Cards grandes com custo unitário, preço sugerido, preço total
  - Tabela de detalhamento por ingrediente
  - Botão "Criar produto a partir desta receita"

**Estimativa:** 3h

---

### 3. Simulação de Margem (what-if)

**Problema:** "E se eu aumentar a margem para 70%? Qual fica o preço?"

**Frontend (`Produtos.tsx` — modal da variação):**
- Slider de margem que atualiza o preço sugerido em tempo real
- Comparação: preço atual vs preço com margem X
- Mostra impacto no lucro: "Se vender 10 unidades, lucro será R$ XX"

**Estimativa:** 1h

---

### 4. Precificação Sugerida Automática

**Problema:** Ao criar uma nova variação, a margem padrão é fixa (60%). Poderia sugerir baseada no tipo de produto.

**Backend (`variacoes.py`):**
- Tabela de margens sugeridas por categoria (definida via site_config)
- Ao criar variação, calcular preço sugerido e preço mínimo automaticamente

**Frontend (`Produtos.tsx` — form de variação):**
- Mostrar preço sugerido antes mesmo de preencher preço_venda
- Tooltip: "Margem sugerida para salgados: 50-70%"

**Estimativa:** 1h

---

## 🗺 Roadmap Sugerido

```
Sprint 1 (3h) ─ Calculadora de Preço Rápida
  ├── Backend: POST /api/v1/calculadora/preco
  └── Frontend: Nova página /admin/calculadora-preco + sidebar

Sprint 2 (2h) ─ Dashboard de Preços + Simulação
  ├── Visualização melhorada nos cards de produto
  ├── Barra de progresso custo/preço/lucro
  ├── Slider de margem com simulação
  └── Alertas de margem baixa

Sprint 3 (1h) ─ Precificação Sugerida Automática
  └── Margens sugeridas por tipo + preenchimento automático
```

---

## 🧮 Fórmulas

```
custo_por_unidade = Σ (qtd_ingrediente × (preco_ingrediente / embalagem_ingrediente))

preco_sugerido_unitario = custo_unitario × (1 + margem_percentual / 100)

preco_total = preco_sugerido_unitario × quantidade_unidades

lucro_unitario = preco_venda - custo_unitario
lucro_total = lucro_unitario × quantidade_unidades
margem_real = (lucro_unitario / preco_venda) × 100
```

---

## 🚫 Não Escopo (por enquanto)

- Preço dinâmico por horário/dia da semana — overengineering
- Cálculo de frete na formação de preço — o delivery é local, taxa fixa
- Integração com gateway de pagamento — apenas PIX/Dinheiro/Cartão

---

## 📊 Exemplo de Uso

```
🧑‍🍳 Cliente: "Quero 30 coxinhas de frango com catupiry, maior que a normal"

Passos na Calculadora:
1. Seleciona ingredientes da receita de coxinha
2. Aumenta quantidade de massa (+20%) e recheio (+30%)
3. Adiciona catupiry extra (+15g por unidade)
4. Ajusta margem para 65%
5. Informa 30 unidades

Resultado:
  Custo unitário:    R$ 5,20
  Preço sugerido:    R$ 8,58/un
  Total:             R$ 257,40
  Lucro estimado:    R$ 101,40
```
