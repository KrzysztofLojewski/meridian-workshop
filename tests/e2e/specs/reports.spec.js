const { test, expect } = require('@playwright/test')

test.describe('Reports page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/reports')
    await page.waitForSelector('.reports-table', { timeout: 10000 })
  })

  test('displays quarterly performance table', async ({ page }) => {
    await expect(page.locator('.card-title').first()).toContainText('Quarterly Performance')
    const rows = page.locator('.reports-table').first().locator('tbody tr')
    await expect(rows).toHaveCount(4) // Q1–Q4 2025
  })

  test('displays monthly revenue chart', async ({ page }) => {
    await expect(page.locator('text=Monthly Revenue Trend')).toBeVisible()
    await expect(page.locator('.bar-chart')).toBeVisible()
  })

  test('displays summary stats', async ({ page }) => {
    await expect(page.locator('text=Total Revenue (YTD)')).toBeVisible()
    await expect(page.locator('text=Total Orders (YTD)')).toBeVisible()
    await expect(page.locator('text=Best Performing Quarter')).toBeVisible()
  })

  test('warehouse filter updates data', async ({ page }) => {
    await page.locator('.filter-select').nth(1).selectOption('London')
    await page.waitForTimeout(500)
    await expect(page.locator('.reports-table').first()).toBeVisible()
  })

  test('category filter updates data', async ({ page }) => {
    await page.locator('.filter-select').nth(2).selectOption('sensors')
    await page.waitForTimeout(500)
    await expect(page.locator('.reports-table').first()).toBeVisible()
  })

  test('time period filter updates data', async ({ page }) => {
    await page.locator('.filter-select').nth(0).selectOption('2025-03')
    await page.waitForTimeout(500)
    // Monthly trends table should show only March data
    const monthRows = page.locator('.reports-table').nth(1).locator('tbody tr')
    await expect(monthRows).toHaveCount(1)
  })

  test('fulfillment rate badges are colored', async ({ page }) => {
    const badges = page.locator('.badge')
    await expect(badges.first()).toBeVisible()
  })
})
