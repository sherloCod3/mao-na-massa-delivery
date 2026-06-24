import { test, expect } from '@playwright/test'

test.describe('Mão na Massa - E2E', () => {

  test('navega entre páginas pelo menu lateral', async ({ page }) => {
    await page.goto('/')

    // Sidebar should be visible on desktop
    await expect(page.getByText('Dashboard').first()).toBeVisible()
    await expect(page.getByText('Pedidos').first()).toBeVisible()
    await expect(page.getByText('Lista de Compras').first()).toBeVisible()
    await expect(page.getByText('Produtos').first()).toBeVisible()
    await expect(page.getByText('Ingredientes').first()).toBeVisible()

    // Navigate to Pedidos
    await page.getByText('Pedidos').first().click()
    await expect(page).toHaveURL(/\/pedidos/)
    await expect(page.getByText('Pedidos').first()).toBeVisible()

    // Navigate to Ingredientes
    await page.getByText('Ingredientes').first().click()
    await expect(page).toHaveURL(/\/ingredientes/)
  })

  test('alterna entre as abas do dashboard', async ({ page }) => {
    await page.goto('/')

    // Wait for page to render
    await page.waitForTimeout(1000)

    // Click "Mensal" tab (use label text in the tab bar)
    await page.getByRole('button', { name: 'Mensal' }).click()
    await expect(page.getByText('Faturamento Mensal').first()).toBeVisible({ timeout: 5000 })

    // Click "Estoque" tab
    await page.getByRole('button', { name: 'Estoque' }).click()
  })

  test('página de tracking público renderiza', async ({ page }) => {
    await page.goto('/track/invalid-token')
    // Should render without crashing
    await expect(page.locator('body')).not.toBeEmpty()
  })

  test('dark mode toggle funciona e persiste', async ({ page }) => {
    await page.goto('/')

    // ThemeToggle button exists - use first one (sidebar or mobile bar)
    const toggle = page.getByLabel('Ativar modo escuro').first()
    await expect(toggle).toBeVisible()

    // Click to enable dark mode
    await toggle.click()

    // html should have dark class
    await expect(page.locator('html')).toHaveClass(/dark/)

    // Toggle should now show "modo claro" (but only one needs to exist)
    await expect(page.getByLabel('Ativar modo claro').first()).toBeVisible()

    // Refresh and check persistence
    await page.reload()
    await expect(page.locator('html')).toHaveClass(/dark/)
  })
})
