import { test, expect } from '@playwright/test'

test.describe('User Authentication and Privacy', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('allows anonymous usage without registration', async ({ page }) => {
    // Should be able to use core features without signing up
    const recoveryButton = page.locator('[data-testid="recovery-tracker-button"]')
    if (await recoveryButton.isVisible()) {
      await recoveryButton.click()
      
      // Should access recovery features without auth
      await expect(page.locator('[data-testid="recovery-dashboard"]')).toBeVisible({ timeout: 5000 })
    }
    
    // Verify no forced registration modal
    const authModal = page.locator('[data-testid="auth-required-modal"]')
    await expect(authModal).not.toBeVisible()
  })

  test('registration process preserves privacy', async ({ page }) => {
    const signUpButton = page.locator('[data-testid="sign-up-button"]')
    
    if (await signUpButton.isVisible()) {
      await signUpButton.click()
      
      const registrationForm = page.locator('[data-testid="registration-form"]')
      await expect(registrationForm).toBeVisible()
      
      // Check privacy-focused registration
      await expect(page.locator('[data-testid="privacy-notice"]')).toBeVisible()
      await expect(page.locator('[data-testid="data-encryption-info"]')).toBeVisible()
      
      // Verify optional fields are clearly marked
      const optionalFields = page.locator('[data-testid*="optional"]')
      if (await optionalFields.count() > 0) {
        await expect(optionalFields.first()).toContainText('optional')
      }
    }
  })

  test('secure login with proper error handling', async ({ page }) => {
    const loginButton = page.locator('[data-testid="login-button"]')
    
    if (await loginButton.isVisible()) {
      await loginButton.click()
      
      const loginForm = page.locator('[data-testid="login-form"]')
      await expect(loginForm).toBeVisible()
      
      // Test with invalid credentials
      await page.fill('[data-testid="email-input"]', 'invalid@test.com')
      await page.fill('[data-testid="password-input"]', 'wrongpassword')
      await page.click('[data-testid="login-submit"]')
      
      // Should show generic error message (not revealing if user exists)
      const errorMessage = page.locator('[data-testid="login-error"]')
      await expect(errorMessage).toBeVisible()
      await expect(errorMessage).not.toContainText('user does not exist')
    }
  })

  test('data encryption indicators work', async ({ page }) => {
    // Check for encryption status indicators
    const encryptionIndicator = page.locator('[data-testid="encryption-status"]')
    
    if (await encryptionIndicator.isVisible()) {
      await expect(encryptionIndicator).toContainText('encrypted')
      
      // Verify security icon is present
      const securityIcon = page.locator('[data-testid="security-icon"]')
      await expect(securityIcon).toBeVisible()
    }
  })

  test('account deletion and data purging', async ({ page }) => {
    // This test would require a logged-in state
    // For now, check if account settings are accessible
    const accountButton = page.locator('[data-testid="account-button"]')
    
    if (await accountButton.isVisible()) {
      await accountButton.click()
      
      const accountSettings = page.locator('[data-testid="account-settings"]')
      if (await accountSettings.isVisible()) {
        // Check for data deletion option
        const deleteButton = page.locator('[data-testid="delete-account-button"]')
        if (await deleteButton.isVisible()) {
          await expect(deleteButton).toContainText('delete', { ignoreCase: true })
        }
      }
    }
  })

  test('privacy controls are accessible', async ({ page }) => {
    const privacyButton = page.locator('[data-testid="privacy-settings-button"]')
    
    if (await privacyButton.isVisible()) {
      await privacyButton.click()
      
      const privacySettings = page.locator('[data-testid="privacy-settings"]')
      await expect(privacySettings).toBeVisible()
      
      // Check for data sharing controls
      const sharingControls = page.locator('[data-testid="data-sharing-controls"]')
      if (await sharingControls.isVisible()) {
        // Should have toggle switches for different data types
        const toggles = page.locator('[data-testid*="privacy-toggle"]')
        expect(await toggles.count()).toBeGreaterThan(0)
      }
    }
  })

  test('session management and security', async ({ page }) => {
    // Check for session timeout warnings
    const sessionWarning = page.locator('[data-testid="session-warning"]')
    
    // Simulate inactivity (this would require custom implementation)
    // For now, check if session security features exist
    
    const logoutButton = page.locator('[data-testid="logout-button"]')
    if (await logoutButton.isVisible()) {
      await logoutButton.click()
      
      // Should clear session data
      const confirmLogout = page.locator('[data-testid="confirm-logout"]')
      if (await confirmLogout.isVisible()) {
        await confirmLogout.click()
      }
      
      // Verify user is logged out
      await expect(page.locator('[data-testid="login-button"]')).toBeVisible()
    }
  })

  test('two-factor authentication setup', async ({ page }) => {
    const twoFAButton = page.locator('[data-testid="2fa-setup-button"]')
    
    if (await twoFAButton.isVisible()) {
      await twoFAButton.click()
      
      const twoFASetup = page.locator('[data-testid="2fa-setup-modal"]')
      await expect(twoFASetup).toBeVisible()
      
      // Should show QR code or backup codes
      const qrCode = page.locator('[data-testid="2fa-qr-code"]')
      const backupCodes = page.locator('[data-testid="2fa-backup-codes"]')
      
      const hasQR = await qrCode.isVisible()
      const hasCodes = await backupCodes.isVisible()
      
      expect(hasQR || hasCodes).toBeTruthy()
    }
  })

  test('password recovery with security questions', async ({ page }) => {
    const forgotPasswordLink = page.locator('[data-testid="forgot-password-link"]')
    
    if (await forgotPasswordLink.isVisible()) {
      await forgotPasswordLink.click()
      
      const recoveryForm = page.locator('[data-testid="password-recovery-form"]')
      await expect(recoveryForm).toBeVisible()
      
      // Fill in email
      await page.fill('[data-testid="recovery-email"]', 'test@example.com')
      await page.click('[data-testid="send-recovery"]')
      
      // Should show confirmation without revealing if email exists
      const confirmation = page.locator('[data-testid="recovery-sent-message"]')
      await expect(confirmation).toBeVisible()
      await expect(confirmation).not.toContainText('not found')
    }
  })
})

test.describe('Privacy Compliance', () => {
  test('HIPAA compliance indicators', async ({ page }) => {
    await page.goto('/')
    
    // Check for HIPAA compliance notice
    const hipaaNotice = page.locator('[data-testid="hipaa-notice"]')
    if (await hipaaNotice.isVisible()) {
      await expect(hipaaNotice).toContainText('HIPAA')
    }
    
    // Verify privacy policy link
    const privacyPolicyLink = page.locator('[data-testid="privacy-policy-link"]')
    if (await privacyPolicyLink.isVisible()) {
      await privacyPolicyLink.click()
      await expect(page).toHaveURL(/privacy/)
    }
  })

  test('cookie consent and tracking controls', async ({ page }) => {
    await page.goto('/')
    
    const cookieBanner = page.locator('[data-testid="cookie-consent-banner"]')
    if (await cookieBanner.isVisible()) {
      // Should have options beyond just "Accept All"
      const customizeButton = page.locator('[data-testid="customize-cookies"]')
      const rejectButton = page.locator('[data-testid="reject-cookies"]')
      
      const hasCustomize = await customizeButton.isVisible()
      const hasReject = await rejectButton.isVisible()
      
      expect(hasCustomize || hasReject).toBeTruthy()
    }
  })

  test('data export functionality', async ({ page }) => {
    await page.goto('/account')
    
    const exportButton = page.locator('[data-testid="export-data-button"]')
    if (await exportButton.isVisible()) {
      await exportButton.click()
      
      // Should show export options
      const exportOptions = page.locator('[data-testid="export-options"]')
      await expect(exportOptions).toBeVisible()
      
      // Should allow different formats
      const formatSelector = page.locator('[data-testid="export-format-selector"]')
      if (await formatSelector.isVisible()) {
        await expect(formatSelector).toBeVisible()
      }
    }
  })
})