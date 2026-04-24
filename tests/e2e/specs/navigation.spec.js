const { test, expect } = require('@playwright/test')

test.describe('Navigation', () => {
  test('loads dashboard on root path', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h2').first()).toBeVisible()
    await expect(page).toHaveURL('/')
  })

  test('navigates to Inventory', async ({ page }) => {
    await page.goto('/')
    await page.locator('nav a[href="/inventory"]').click()
    await expect(page).toHaveURL('/inventory')
    await expect(page.locator('h2')).toContainText('Inventory')
  })

  test('navigates to Orders', async ({ page }) => {
    await page.goto('/')
    await page.locator('nav a[href="/orders"]').click()
    await expect(page).toHaveURL('/orders')
    await expect(page.locator('h2')).toContainText('Orders')
  })

  test('navigates to Reports', async ({ page }) => {
    await page.goto('/')
    await page.locator('nav a[href="/reports"]').click()
    await expect(page).toHaveURL('/reports')
    await expect(page.locator('h2')).toContainText('Reports')
  })

  test('navigates to Restocking', async ({ page }) => {
    await page.goto('/')
    await page.locator('nav a[href="/restocking"]').click()
    await expect(page).toHaveURL('/restocking')
    await expect(page.locator('h2')).toContainText('Restocking')
  })

  test('filter bar is visible on all pages', async ({ page }) => {
    for (const path of ['/', '/inventory', '/orders', '/reports', '/restocking']) {
      await page.goto(path)
      await expect(page.locator('.filters-bar')).toBeVisible()
    }
  })
})
