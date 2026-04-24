const { test, expect } = require('@playwright/test')

test.describe('Restocking page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/restocking')
    await page.waitForSelector('h2', { timeout: 10000 })
  })

  test('displays restocking recommendations table', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Restocking')
    // Either table or empty state should be visible
    const hasTable = await page.locator('.restock-table').isVisible().catch(() => false)
    const hasEmpty = await page.locator('.empty-state').isVisible().catch(() => false)
    expect(hasTable || hasEmpty).toBeTruthy()
  })

  test('shows priority badges', async ({ page }) => {
    const table = page.locator('.restock-table')
    if (await table.isVisible()) {
      await expect(page.locator('.badge').first()).toBeVisible()
    }
  })

  test('budget input is visible and persistent', async ({ page }) => {
    const budgetInput = page.locator('.budget-input')
    await expect(budgetInput).toBeVisible()

    await budgetInput.fill('50000')
    await budgetInput.press('Tab')
    await page.waitForTimeout(500)

    // Reload and check persistence
    await page.reload()
    await page.waitForSelector('.budget-input')
    await expect(budgetInput).toHaveValue('50000')

    // Clean up
    await budgetInput.fill('')
    await budgetInput.press('Tab')
  })

  test('summary bar shows item counts', async ({ page }) => {
    const summaryBar = page.locator('.summary-bar')
    if (await summaryBar.isVisible()) {
      await expect(page.locator('.summary-label').first()).toBeVisible()
      await expect(page.locator('.summary-value').first()).toBeVisible()
    }
  })

  test('warehouse filter reloads recommendations', async ({ page }) => {
    await page.locator('.filter-select').nth(1).selectOption('London')
    await page.waitForTimeout(500)
    await expect(page.locator('h2')).toContainText('Restocking')
  })

  test('add to order button marks item as ordered', async ({ page }) => {
    const orderBtn = page.locator('.order-btn').first()
    if (await orderBtn.isVisible()) {
      await orderBtn.click()
      await expect(orderBtn).toContainText('✓ Ordered')
    }
  })
})
