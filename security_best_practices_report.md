# 🔒 Mão na Massa — Security Best Practices Report

> **Data:** 26/06/2026
> **Escopo:** Backend (Python/FastAPI) + Frontend (TypeScript/React)
> **Skill:** security-best-practices v1.0.0
> **Referências:** `python-fastapi-web-server-security.md`, `javascript-typescript-react-web-frontend-security.md`

---

## Sumário Executivo

Foram identificados **7 achados** de segurança, sendo **1 de severidade Alta**, **3 Média** e **3 Baixa**. Não foram encontradas vulnerabilidades críticas (XSS, SQLi, command injection, SSRF).

Os principais riscos são: (1) token de admin armazenado em `localStorage` (vulnerável a XSS), (2) documentação OpenAPI exposta publicamente, e (3) ausência de rate limiting no endpoint de login. Recomenda-se corrigir os itens de severidade Alta e Média antes do deploy em produção.

---

## FIND-001: Token de admin armazenado em `localStorage`

| Campo | Valor |
|-------|-------|
| **Rule ID** | REACT-AUTH-001 / JS-STORAGE-001 |
| **Severity** | 🔴 **Alta** |
| **Location** | `frontend/src/contexts/AuthContext.tsx` (linhas 29, 34) |
| **Evidence** | `localStorage.setItem(AUTH_KEY, newToken)` |
| **Impact** | Um XSS no frontend pode exfiltrar o token de admin, concedendo acesso total ao painel administrativo. O token é de longa duração (fixo, sem refresh). |
| **Fix** | Migrar para cookies HTTPOnly com CSRF, ou usar tokens de curta duração armazenados em memória. Para o MVP, documentar como débito técnico. |
| **Mitigation** | Deploy de CSP restritivo + monitoramento de XSS. |

---

## FIND-002: Documentação OpenAPI exposta (sem proteção)

| Campo | Valor |
|-------|-------|
| **Rule ID** | FASTAPI-OPENAPI-001 |
| **Severity** | 🟡 **Média** |
| **Location** | `backend/app/main.py` (linha 50-54) |
| **Evidence** | `app = FastAPI(title=..., docs_url="/docs", ...)` — usa valores padrão (docs e openapi.json expostos) |
| **Impact** | Qualquer pessoa pode acessar `/docs` e `/openapi.json` para descobrir todos os endpoints, schemas e detalhes da API. |
| **Fix** | Desabilitar docs em produção: `docs_url=None, redoc_url=None, openapi_url=None` via configuração por ambiente. |
| **Mitigation** | Restringir por rede (VPN/firewall) ou autenticação. |

---

## FIND-003: Ausência de rate limiting no login

| Campo | Valor |
|-------|-------|
| **Rule ID** | FASTAPI-LIMITS-001 |
| **Severity** | 🟡 **Média** |
| **Location** | `backend/app/routers/admin_auth.py` (linha 26) |
| **Evidence** | `@router.post("/login", response_model=LoginResponse)` — sem rate limiting |
| **Impact** | Atacante pode realizar brute-force na senha do admin sem qualquer restrição de velocidade. |
| **Fix** | Adicionar middleware de rate limiting (ex: `slowapi`) ou implementar no reverse proxy. |
| **Mitigation** | Usar senha forte + monitoramento de tentativas de login. |

---

## FIND-004: CORS com `allow_credentials=True` e origens explícitas

| Campo | Valor |
|-------|-------|
| **Rule ID** | FASTAPI-CORS-001 |
| **Severity** | 🟢 **Baixa** |
| **Location** | `backend/app/main.py` (linhas 60-65) |
| **Evidence** | `allow_credentials=True` com `allow_origins=origins` (lista de origens configuradas) |
| **Impact** | Baixo — origens são configuráveis via env var e não usam wildcard. `allow_credentials=True` é necessário para envio de cookies (não usado atualmente, mas pode ser necessário para futuras features). |
| **Fix** | Nenhum — config atual é seguro para o caso de uso. Apenas monitorar se `allow_origins` não se torna `["*"]`. |
| **Mitigation** | Manter CORS_ORIGINS restrito no .env de produção. |

---

## FIND-005: Ausência de validação de Host header

| Campo | Valor |
|-------|-------|
| **Rule ID** | FASTAPI-HOST-001 |
| **Severity** | 🟢 **Baixa** |
| **Location** | `backend/app/main.py` |
| **Evidence** | Nenhum uso de `TrustedHostMiddleware` — qualquer valor de `Host` é aceito |
| **Impact** | Baixo para API pura (sem geração de links a partir de host). Pode ser relevante se a app gerar links de tracking/notificação a partir do host. |
| **Fix** | Adicionar `TrustedHostMiddleware(allowed_hosts=[...])` configurável. |
| **Mitigation** | Validar no reverse proxy (nginx, Cloudflare). |

---

## FIND-006: Ausência de Content Security Policy (CSP)

| Campo | Valor |
|-------|-------|
| **Rule ID** | REACT-CSP-001 |
| **Severity** | 🟢 **Baixa** |
| **Location** | `frontend/` — sem CSP configurado |
| **Evidence** | Nenhum header CSP no backend, nenhuma meta tag CSP no HTML |
| **Impact** | Sem defesa em profundidade contra XSS. O app renderiza conteúdo público (depoimentos) que podem conter HTML malicioso. |
| **Fix** | Adicionar CSP via header HTTP ou meta tag. Política inicial restritiva com `default-src 'self'`. |
| **Mitigation** | Usar React JSX (escapamento automático) + sanitização de depoimentos. |

---

## FIND-007: Token de tracking exposto em URLs de rastreamento

| Campo | Valor |
|-------|-------|
| **Rule ID** | FASTAPI-AUTH-002 |
| **Severity** | 🟢 **Baixa** |
| **Location** | `frontend/src/pages/PedidoDetalhe.tsx` (linha 28) |
| **Evidence** | `const trackingUrl = \`${window.location.origin}/track/${pedido.token_acesso}\`` |
| **Impact** | Token de tracking é exposto em URLs (pode vazar via logs, referrers). É um token de acesso público para rastreamento de pedido, então o impacto é baixo por design. |
| **Fix** | Nenhum — token de tracking é intencionalmente público para permitir que clientes acompanhem pedidos. Apenas documentar que não é um token de segurança. |
| **Mitigation** | Garantir que o tracking token só dá acesso a dados do próprio pedido. |

---

## Resumo por Severidade

| Severidade | Quantidade | IDs |
|------------|-----------|-----|
| 🔴 **Alta** | 1 | FIND-001 |
| 🟡 **Média** | 2 | FIND-002, FIND-003 |
| 🟢 **Baixa** | 4 | FIND-004, FIND-005, FIND-006, FIND-007 |

## Recomendações Imediatas (Antes do Deploy)

1. **FIND-002**: Desabilitar `/docs` e `/openapi.json` em produção
2. **FIND-001**: Documentar o risco do token em localStorage no README
3. **FIND-003**: Adicionar rate limiting no login (ou documentar que o proxy deve fazer isso)

---

*Relatório gerado automaticamente usando security-best-practices skill (FastAPI + React references)*
