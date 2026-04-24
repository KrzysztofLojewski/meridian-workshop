const { test, expect } = require('@playwright/test')

test.describe('Global filter bar', () => {
  test('filter bar is present on all main pages', async ({ page }) => {
    const pages = ['/', '/inventory', '/orders', '/reports', '/restocking']
    for (const path of pages) {
      await page.goto(path)
      await expect(page.locator('.filters-bar')).toBeVisible()
    }
  })

  test('reset button is disabled when no filters active', async ({ page }) => {
    await page.goto('/')
    const resetBtn = page.locator('.reset-filters-btn')
    await expect(resetBtn).toBeDisabled()
  })

  test('reset button enables after filter selection', async ({ page }) => {
    await page.goto('/inventory')
    await page.locator('.filter-select').nth(1).selectOption('London')
    const resetBtn = page.locator('.reset-filters-btn')
    await expect(resetBtn).toBeEnabled()
  })

  test('reset button clears all filters', async ({ page }) => {
    await page.goto('/inventory')
    await page.locator('.filter-select').nth(1).selectOption('London')
    await page.locator('.reset-filters-btn').click()
    // All selects should be back to 'all'
    const selects = page.locator('.filter-select')
    const count = await selects.count()
    for (let i = 0; i < count; i++) {
      await expect(selects.nth(i)).toHaveValue('all')
    }
  })

  test('warehouse filter persists across navigation', async ({ page }) => {
    await page.goto('/inventory')
    await page.locator('.filter-select').nth(1).selectOption('Tokyo')

    await page.click('text=Orders')
    await expect(page.locator('.filter-select').nth(1)).toHaveValue('Tokyo')
  })
})
