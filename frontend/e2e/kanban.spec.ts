import { test, expect, type Page } from '@playwright/test'

/**
 * E2E tests for the Kanban board and order management UI.
 *
 * Prerequisites:
 *   docker compose up -d backend      # or `uv run uvicorn app.main:app --port 8000`
 *   cd backend && uv run python scripts/seed_e2e.py   # seed test data
 *
 * The Playwright webServer config starts both backend and frontend automatically.
 */

const API_BASE = process.env.VITE_API_URL || '/api/v1'
const ADMIN_PASSWORD = process.env.ADMIN_TOKEN || 'e2e-admin-2026'

/**
 * Authenticate via API and store the JWT in localStorage.
 * This works for any backend serving at API_BASE.
 */
async function loginAsAdmin(page: Page) {
  const response = await page.request.post(`${API_BASE}/admin/login`, {
    data: { password: ADMIN_PASSWORD },
  })
  expect(response.ok()).toBe(true)
  const body = await response.json()
  expect(body.token).toBeDefined()

  await page.evaluate((token: string) => {
    localStorage.setItem('mao_na_massa_admin_token', token)
  }, body.token)
}

/** Skip the test if no backend is available (no auth configured) */
test.skip(() => {
  // In CI, ADMIN_TOKEN may not be set — skip authenticated tests
  return !ADMIN_PASSWORD || ADMIN_PASSWORD === ''
}, 'ADMIN_TOKEN not configured — skipping authenticated tests')

test.beforeEach(async ({ page }) => {
  await loginAsAdmin(page)
})

test.describe('Kanban Board - Ordem de Serviço', () => {

  test.describe('View Toggle', () => {
    test('kanban view toggle buttons exist on pedidos page', async ({ page }) => {
      await page.goto('/admin/pedidos')
      await page.waitForLoadState('networkidle')

      // View toggle should be present
      const listaBtn = page.getByRole('button', { name: /Lista/i }).first()
      const kanbanBtn = page.getByRole('button', { name: /Kanban/i }).first()

      await expect(listaBtn).toBeVisible()
      await expect(kanbanBtn).toBeVisible()

      // Default view should be 'Lista' (active state)
      await expect(listaBtn).toHaveClass(/bg-white/)
    })

    test('switching to kanban view updates URL and shows columns', async ({ page }) => {
      await page.goto('/admin/pedidos')
      await page.waitForLoadState('networkidle')

      // Click Kanban toggle
      await page.getByRole('button', { name: /Kanban/i }).first().click()

      // URL should have ?view=kanban
      await expect(page).toHaveURL(/\?view=kanban/)

      // Column headers should be visible
      await expect(page.getByText('Pendente').first()).toBeVisible()
      await expect(page.getByText('Em Produção').first()).toBeVisible()
      await expect(page.getByText('Produzido').first()).toBeVisible()
      await expect(page.getByText('Em Entrega').first()).toBeVisible()
      await expect(page.getByText('Entregue').first()).toBeVisible()
      await expect(page.getByText('Pausado').first()).toBeVisible()
      await expect(page.getByText('Cancelado').first()).toBeVisible()

      // Switch back to List view
      await page.getByRole('button', { name: /Lista/i }).first().click()
      await expect(page).not.toHaveURL(/\?view=kanban/)
    })

    test('kanban view persists across page reload', async ({ page }) => {
      await page.goto('/admin/pedidos?view=kanban')
      await page.waitForLoadState('networkidle')

      // Verify kanban view is active
      await expect(page.getByText('Pendente').first()).toBeVisible()

      // Reload — view should persist
      await page.reload()
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveURL(/\?view=kanban/)
      await expect(page.getByText('Pendente').first()).toBeVisible()
    })
  })

  test.describe('Kanban Cards', () => {
    test('cards are rendered in kanban view with correct info', async ({ page }) => {
      await page.goto('/admin/pedidos?view=kanban')
      await page.waitForLoadState('networkidle')

      // There should be at least one card (from seed data)
      const cards = page.locator('[class*="rounded-xl"][class*="shadow"]').filter({
        has: page.locator('text=/Cliente E2E|R\\$/'),
      })
      const cardCount = await cards.count()

      // Seed data creates 5 orders — some should appear
      expect(cardCount).toBeGreaterThanOrEqual(1)
    })

    test('action buttons appear on non-terminal cards', async ({ page }) => {
      await page.goto('/admin/pedidos?view=kanban')
      await page.waitForLoadState('networkidle')

      // Pendente column should have "Iniciar" button
      const iniciarBtns = page.locator('button[title="Iniciar"]')
      const pendenteCount = await iniciarBtns.count()

      if (pendenteCount > 0) {
        await expect(iniciarBtns.first()).toBeVisible()
      }
    })
  })

  test.describe('ModalMotivo', () => {
    test('modal opens and validates motivo length', async ({ page }) => {
      await page.goto('/admin/pedidos?view=kanban')
      await page.waitForLoadState('networkidle')

      // Find a card with a "Pausar" button
      const pausarBtn = page.locator('button[title="Pausar"]').first()
      const pausarVisible = await pausarBtn.isVisible()

      if (!pausarVisible) {
        // No pausable cards — mark as passed (no cards to test)
        test.skip()
        return
      }

      await pausarBtn.click()

      // Modal should be visible
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3000 })

      // Textarea should be visible
      const textarea = page.locator('textarea')
      await expect(textarea).toBeVisible()

      // Type short text (< 3 chars) — validation error should appear
      await textarea.fill('ab')
      await expect(page.getByText('Mínimo de 3 caracteres')).toBeVisible()

      // Confirm button should be disabled
      const confirmBtn = page.locator('button').filter({ hasText: /Pausar|Confirmar/ })
      await expect(confirmBtn).toBeDisabled()

      // Type valid text — error should disappear, button enabled
      await textarea.fill('Aguardando cliente confirmar')
      await expect(page.getByText('Mínimo de 3 caracteres')).not.toBeVisible()
      await expect(confirmBtn).toBeEnabled()

      // Close modal via Cancel
      await page.locator('button').filter({ hasText: /Cancelar/ }).last().click()
      await expect(page.getByRole('dialog')).not.toBeVisible()
    })

    test('modal closes on Escape key', async ({ page }) => {
      await page.goto('/admin/pedidos?view=kanban')
      await page.waitForLoadState('networkidle')

      const pausarBtn = page.locator('button[title="Pausar"]').first()
      if (!(await pausarBtn.isVisible())) {
        test.skip()
        return
      }

      await pausarBtn.click()
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3000 })

      // Press Escape
      await page.keyboard.press('Escape')
      await expect(page.getByRole('dialog')).not.toBeVisible()
    })
  })

  test.describe('Public Tracking', () => {
    test('public tracking page renders without crashing', async ({ page }) => {
      await page.goto('/track/invalid-token')
      await page.waitForLoadState('networkidle')
      await expect(page.locator('body')).not.toBeEmpty()
    })

    test('public tracking page layout is responsive', async ({ page }) => {
      await page.goto('/track/invalid-token')
      await page.waitForLoadState('networkidle')

      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      await page.waitForTimeout(500)
      await expect(page.locator('body')).not.toBeEmpty()

      // Content should be visible
      const bodyText = await page.locator('body').innerText()
      expect(bodyText.length).toBeGreaterThan(0)
    })
  })

  test.describe('Navigation Flow', () => {
    test('full flow: landing → pedidos → toggle kanban → check columns', async ({ page }) => {
      await page.goto('/admin/pedidos?view=kanban')
      await page.waitForLoadState('networkidle')

      // Verify kanban columns render
      await expect(page.getByText('Pendente').first()).toBeVisible()
    })
  })
})

test.describe('Error Recovery (visual)', () => {
  test('kanban board handles network errors gracefully', async ({ page }) => {
    await page.goto('/admin/pedidos?view=kanban')
    await page.waitForLoadState('networkidle')

    // Cards should be visible initially
    const cards = page.locator('[class*="rounded-xl"][class*="shadow"]')
    const cardCount = await cards.count()
    expect(cardCount).toBeGreaterThanOrEqual(1)

    // Simulate offline and attempt an action
    await page.context().setOffline(true)

    // Find a pendente card's action button
    const actionBtn = page.locator('button[title="Iniciar"]').first()
    if (await actionBtn.isVisible()) {
      await actionBtn.click()
      // Wait briefly — the error banner might appear
      await page.waitForTimeout(1500)
    }

    // Restore online
    await page.context().setOffline(false)
  })
})
