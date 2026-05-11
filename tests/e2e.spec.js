const { test, expect } = require('@playwright/test')

test('сторінка завантажується і має заголовок TUNE3D', async ({ page }) => {
  await page.goto('file:///C:/Users/Ihor/Desktop/lab_IT/scr/3d_tuning.html')
  await expect(page.locator('#logo')).toContainText('TUNE')
})

test('кнопки вибору зброї присутні на сторінці', async ({ page }) => {
  await page.goto('file:///C:/Users/Ihor/Desktop/lab_IT/scr/3d_tuning.html')
  await expect(page.locator('.weapon-btn').first()).toBeVisible()
})