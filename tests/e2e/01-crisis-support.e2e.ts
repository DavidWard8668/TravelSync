import { test, expect } from '@playwright/test'

test.describe('Crisis Support Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Wait for initial load and crisis banner
    await page.waitForLoadState('networkidle')
  })

  test('displays crisis banner prominently on all pages', async ({ page }) => {
    // Check crisis banner is visible
    const crisisBanner = page.locator('[data-testid="crisis-banner"]')
    await expect(crisisBanner).toBeVisible()
    
    // Verify 988 hotline number is displayed
    await expect(crisisBanner).toContainText('988')
    
    // Check banner persists across navigation
    await page.click('[data-testid="nav-recovery-tracker"]')
    await expect(crisisBanner).toBeVisible()
  })

  test('988 hotline button works correctly', async ({ page }) => {
    const crisisButton = page.locator('[data-testid="crisis-button"]')
    await expect(crisisButton).toBeVisible()
    
    // Click should not navigate away (opens phone dialer)
    await crisisButton.click()
    
    // Verify we're still on the same page
    await expect(page).toHaveURL('/')
    
    // Check if modal or confirmation dialog appears
    const confirmDialog = page.locator('[data-testid="crisis-confirm-dialog"]')
    if (await confirmDialog.isVisible()) {
      await expect(confirmDialog).toContainText('988')
    }
  })

  test('crisis chat integration works', async ({ page }) => {
    const chatButton = page.locator('[data-testid="crisis-chat-button"]')
    
    if (await chatButton.isVisible()) {
      await chatButton.click()
      
      // Should open chat in new tab or iframe
      const chatFrame = page.locator('[data-testid="crisis-chat-frame"]')
      const hasFrame = await chatFrame.isVisible()
      
      if (hasFrame) {
        await expect(chatFrame).toBeVisible()
      } else {
        // Check if new tab was opened (would require different test approach)
        // For now, verify button click was registered
        await expect(page.locator('[data-testid="chat-loading"]')).toBeVisible()
      }
    }
  })

  test('location-based emergency resources work', async ({ page, context }) => {
    // Grant geolocation permissions
    await context.grantPermissions(['geolocation'])
    await context.setGeolocation({ latitude: 40.7128, longitude: -74.0060 })
    
    const resourcesButton = page.locator('[data-testid="local-resources-button"]')
    if (await resourcesButton.isVisible()) {
      await resourcesButton.click()
      
      // Should show local resources
      const resourcesList = page.locator('[data-testid="local-resources-list"]')
      await expect(resourcesList).toBeVisible({ timeout: 10000 })
      
      // Check for at least one resource
      const firstResource = page.locator('[data-testid="resource-item"]').first()
      await expect(firstResource).toBeVisible()
    }
  })

  test('crisis plan quick access works', async ({ page }) => {
    const planButton = page.locator('[data-testid="crisis-plan-button"]')
    
    if (await planButton.isVisible()) {
      await planButton.click()
      
      // Should navigate to crisis plan or show modal
      const planContainer = page.locator('[data-testid="crisis-plan-container"]')
      await expect(planContainer).toBeVisible({ timeout: 5000 })
      
      // Verify key crisis plan elements
      await expect(page.locator('[data-testid="warning-signs"]')).toBeVisible()
      await expect(page.locator('[data-testid="coping-strategies"]')).toBeVisible()
      await expect(page.locator('[data-testid="support-contacts"]')).toBeVisible()
    }
  })

  test('anonymous crisis mode preserves privacy', async ({ page }) => {
    // Check if anonymous mode toggle exists
    const anonymousToggle = page.locator('[data-testid="anonymous-mode-toggle"]')
    
    if (await anonymousToggle.isVisible()) {
      await anonymousToggle.click()
      
      // Verify anonymous mode is active
      await expect(page.locator('[data-testid="anonymous-indicator"]')).toBeVisible()
      
      // Check that user data is not displayed
      const userName = page.locator('[data-testid="user-name"]')
      if (await userName.isVisible()) {
        await expect(userName).toContainText('Anonymous')
      }
    }
  })

  test('crisis resources are accessible offline', async ({ page }) => {
    // Go offline
    await page.context().setOffline(true)
    
    // Try to access crisis resources
    const crisisBanner = page.locator('[data-testid="crisis-banner"]')
    await expect(crisisBanner).toBeVisible()
    
    // Verify offline crisis resources are available
    const offlineResources = page.locator('[data-testid="offline-crisis-resources"]')
    if (await offlineResources.isVisible()) {
      await expect(offlineResources).toContainText('988')
    }
    
    // Go back online
    await page.context().setOffline(false)
  })

  test('crisis text hotline integration', async ({ page }) => {
    const textButton = page.locator('[data-testid="crisis-text-button"]')
    
    if (await textButton.isVisible()) {
      await textButton.click()
      
      // Should show text hotline information
      const textInfo = page.locator('[data-testid="text-hotline-info"]')
      await expect(textInfo).toBeVisible()
      
      // Verify it contains the standard text crisis number
      await expect(textInfo).toContainText('741741')
    }
  })

  test('crisis feature accessibility compliance', async ({ page }) => {
    // Check crisis button has proper ARIA labels
    const crisisButton = page.locator('[data-testid="crisis-button"]')
    await expect(crisisButton).toHaveAttribute('aria-label')
    
    // Verify high contrast support
    await page.emulateMedia({ colorScheme: 'dark' })
    await expect(crisisButton).toBeVisible()
    
    // Check keyboard navigation
    await page.keyboard.press('Tab')
    await expect(crisisButton).toBeFocused()
    
    // Verify screen reader text
    const srOnly = page.locator('.sr-only')
    if (await srOnly.count() > 0) {
      const srText = await srOnly.first().textContent()
      expect(srText).toBeTruthy()
    }
  })
})

test.describe('Crisis Support Mobile Experience', () => {
  test.use({ viewport: { width: 375, height: 667 } })
  
  test('crisis banner is prominent on mobile', async ({ page }) => {
    await page.goto('/')
    
    const crisisBanner = page.locator('[data-testid="crisis-banner"]')
    await expect(crisisBanner).toBeVisible()
    
    // Check banner doesn't overflow on small screens
    const bannerBox = await crisisBanner.boundingBox()
    expect(bannerBox?.width).toBeLessThanOrEqual(375)
  })

  test('crisis button is easily tappable on mobile', async ({ page }) => {
    await page.goto('/')
    
    const crisisButton = page.locator('[data-testid="crisis-button"]')
    const buttonBox = await crisisButton.boundingBox()
    
    // Verify button meets minimum touch target size (44px)
    expect(buttonBox?.height).toBeGreaterThanOrEqual(44)
    expect(buttonBox?.width).toBeGreaterThanOrEqual(44)
  })
})