# UI/UX Analysis & Improvement Plan — Mão na Massa

> **Gerado em:** 30/06/2026
> **Framework:** UI/UX Pro Max (50+ styles, 99 UX guidelines, 161 color palettes)
> **Stack:** React 19 + Vite + TypeScript + Tailwind CSS 4 + Lucide React

---

## 📊 Assessment Geral: **7.5/10**

O projeto já tem uma base visual sólida e consistente: paleta terracota artesanal (`massa-*`),
tipografia Playfair Display + Inter, tema claro/escuro completo, e design system coerente.

---

## 🔴 Prioridade 1 — Acessibilidade (CRÍTICO)

| Critério | Status | Onde |
|----------|--------|------|
| `color-contrast` 4.5:1 | ✅ | Paleta massa-* tem bom contraste geral |
| `focus-states` visíveis | ✅ | `focus-visible` com outline 2px |
| `aria-labels` | ✅ | Botões de ícone têm aria-label |
| `keyboard-nav` | ✅ | Tab order lógico |
| `skip-links` | ❌ **Ausente** | Nenhum "Pular para conteúdo" |
| `emoji-as-icons` | ⚠️ | `Ingredientes.tsx` usa 📦, 📤 nos modais |
| `reduced-motion` | ❌ **Ausente** | Sem `prefers-reduced-motion` |
| `hover-only-action` | ⚠️ | `NotificationBell.tsx`: descartar só no hover |

### Ações:
- [x] Substituir emojis por SVG Lucide em Ingredientes.tsx e NotificationBell.tsx
- [x] Adicionar `prefers-reduced-motion` no index.css
- [x] Tornar botão "Descartar" sempre visível no mobile
- [x] Adicionar skip-link no Layout.tsx

---

## 🔴 Prioridade 2 — Touch & Interação (CRÍTICO)

| Critério | Status | Observação |
|----------|--------|------------|
| `touch-target-size` 44×44 | ✅ | `min-h-[44px]` consistente |
| `touch-spacing` 8px | ✅ | Gap adequado |
| `loading-buttons` | ✅ | Spinner + disabled |
| `safe-area-awareness` | ✅ | `.safe-area-bottom` + `env()` |
| `press-feedback` | ✅ | `btn:active { scale(0.97) }` |

✅ **Sem recomendações urgentes.**

---

## 🟡 Prioridade 3 — Performance (ALTA)

| Critério | Status | Observação |
|----------|--------|------------|
| `lazy-loading` | ✅ | `React.lazy()` + Suspense por rota |
| `bundle-splitting` | ✅ | Lazy loading por rota |
| `debounce-throttle` | ✅ | Autocomplete 300ms debounce |
| `offline-support` | ✅ | Service Worker + IndexedDB |

✅ **Sem recomendações urgentes.**

---

## 🟡 Prioridade 4 — Estilo Visual (ALTA)

| Critério | Status | Observação |
|----------|--------|------------|
| `style-match` | ✅ | Terracota artesanal condiz com food service |
| `consistency` | ✅ | Consistente entre páginas |
| `no-emoji-icons` | ⚠️ | Violação em Ingredientes.tsx e NotificationBell.tsx |
| `dark-mode-pairing` | ✅ | Bem implementado com variáveis CSS |
| `icon-style-consistent` | ✅ | Lucide React em todo lugar |

### Ações:
- [x] Substituir emojis por ícones Lucide (Package, Upload, ArrowUpDown, Bell, Pin, AlertTriangle)

---

## 🟡 Prioridade 5 — Layout & Responsivo (ALTA)

| Critério | Status | Observação |
|----------|--------|------------|
| `mobile-first` | ✅ | Grid responsivo em todas as páginas |
| `horizontal-scroll` | ✅ | Nenhum overflow horizontal |
| `z-index-management` | ⚠️ | Z-index ad-hoc (30, 40, 50) |

### Recomendação futura:
- Definir escala de z-index documentada

---

## 🟢 Prioridade 6 — Tipografia & Cor (MÉDIA)

| Critério | Status | Observação |
|----------|--------|------------|
| `font-pairing` | ✅ | Playfair Display + Inter |
| `color-semantic` | ⚠️ | `text-gray-500`, `bg-gray-50` em vez de tokens |
| `color-dark-mode` | ✅ | Dark mode com variáveis CSS |
| `number-tabular` | ⚠️ | Preços sem tabular-nums |

### Ações:
- [x] Adicionar `tabular-nums` em classes de valores monetários
- [x] Criar tokens semânticos Tailwind para reduzir hardcoded gray

---

## 🟢 Prioridade 7 — Animação (MÉDIA)

| Critério | Status | Observação |
|----------|--------|------------|
| `duration-timing` | ✅ | 150-300ms |
| `transform-performance` | ✅ | Só transform/opacity |
| `stagger-sequence` | ✅ | `idx * 80ms` nos cards |
| `reduced-motion` | ❌ | **Ausente** |

### Ações:
- [x] Adicionar `prefers-reduced-motion` no index.css

---

## 🟢 Prioridade 8 — Formulários & Feedback (MÉDIA)

| Critério | Status | Observação |
|----------|--------|------------|
| `input-labels` | ✅ | Labels visíveis |
| `error-placement` | ✅ | Erro próximo ao campo |
| `empty-states` | ✅ | Mensagens amigáveis |
| `toast-dismiss` | ✅ | 3.5s auto-dismiss |
| `confirmation-dialogs` | ⚠️ | `confirm()` nativo (bloqueante) |

### Ações:
- [x] Substituir `confirm()` nativo por `ConfirmDialog` modal custom

---

## 🟢 Prioridade 9 — Navegação (ALTA)

| Critério | Status | Observação |
|----------|--------|------------|
| `bottom-nav-limit` | ✅ | 5 itens |
| `back-behavior` | ✅ | `backTo` consistente |
| `nav-state-active` | ✅ | Destaque na rota ativa |

✅ **Sem recomendações urgentes.**

---

## 🟢 Prioridade 10 — Gráficos & Dados (BAIXA)

| Critério | Status | Observação |
|----------|--------|------------|
| `chart-type` | ✅ | Bar para comparação mensal |
| `tooltip-on-interact` | ✅ | Tooltip Recharts |
| `empty-data-state` | ✅ | "Nenhum dado disponível" |
| `color-guidance` | ⚠️ | Cores do gráfico pouco diferenciáveis |

### Recomendação futura:
- Melhorar paleta do gráfico mensal (mais contraste entre faturamento/custo/lucro)

---

## 📋 Plano de Implementação

### Fase 1 — Correções Críticas ✅ (Concluída)
1. Substituir emojis por SVG Lucide em `Ingredientes.tsx` e `NotificationBell.tsx`
2. Adicionar `prefers-reduced-motion` no `index.css`
3. Tornar botão "Descartar" da notificação visível sem hover no mobile
4. Adicionar skip-link no Layout

### Fase 2 — UX Médio ✅ (Concluída)
5. Substituir `confirm()` nativo por modal custom de confirmação
6. Criar tokens semânticos para reduzir `text-gray-500`/`bg-gray-50` hardcoded
7. Adicionar `tabular-nums` em valores monetários

### Fase 3 — Refinamento (Futuro)
8. Melhorar paleta de cores do gráfico mensal
9. Animações de transição de página
10. Loading skeletons para listas
