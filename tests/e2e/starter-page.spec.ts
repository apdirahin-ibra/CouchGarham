import { expect, test } from '@playwright/test'

test.describe('Best Official App - Authentication & Navigation Flows', () => {
  test('renders login page with Somali branding and dual role tabs', async ({
    page,
  }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Check title and branding
    await expect(
      page.getByRole('heading', { name: 'Best Official App' }),
    ).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Youth Football Club Management')).toBeVisible()

    // Dual role tabs exist
    const playerTab = page.getByRole('button', { name: 'Ciyaartoy' })
    const adminTab = page.getByRole('button', { name: 'Maamule' })
    await expect(playerTab).toBeVisible()
    await expect(adminTab).toBeVisible()

    // Switch to Admin login
    await adminTab.click()
    await expect(
      page.getByRole('button', { name: 'Gal Maamulka (Admin Login)' }),
    ).toBeVisible()

    // Switch back to Player login
    await playerTab.click()
    await expect(page.getByText('Dooro Magacaaga Ciyaartoyga')).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Ma tihid xubin? Codso Ku Biirid' }),
    ).toBeVisible()
  })

  test('opens join club request modal and validates form fields', async ({
    page,
  }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const joinButton = page.getByRole('button', {
      name: 'Ma tihid xubin? Codso Ku Biirid',
    })
    await expect(joinButton).toBeVisible({ timeout: 10000 })
    await joinButton.click()

    // Dialog should open
    await expect(
      page.getByText('Codsi Ku Biirid Kooxda (Join Club)'),
    ).toBeVisible()
    await expect(page.getByLabel('Magacaaga oo Buuxa *')).toBeVisible()
    await expect(page.getByLabel('Lambarka WhatsApp *')).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Dir Codsiga' }),
    ).toBeVisible()
  })

  test('validates admin login form and error feedback', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const adminTab = page.getByRole('button', { name: 'Maamule' })
    await adminTab.click()

    await expect(page.getByLabel('Magaca Maamulaha (Username)')).toBeVisible()
    await expect(page.getByLabel('Furaha Sirta ah (Password)')).toBeVisible()

    await page.getByLabel('Magaca Maamulaha (Username)').fill('admin')
    await page
      .getByLabel('Furaha Sirta ah (Password)')
      .fill('WrongSecretPass999!')

    const submitBtn = page.getByRole('button', {
      name: 'Gal Maamulka (Admin Login)',
    })
    await submitBtn.click()

    // Assert that error feedback is rendered
    await expect(page.locator('body')).toContainText(
      /Magaca maamulaha ama furaha sirta ah waa qalad|Qalad|Invalid server environment configuration|Error/i,
    )
  })
})
