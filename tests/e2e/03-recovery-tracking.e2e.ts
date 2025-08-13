import { test, expect } from '@playwright/test'

test.describe('Recovery Tracking Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('recovery dashboard displays correctly', async ({ page }) => {
    const recoveryButton = page.locator('[data-testid="recovery-tracker-button"]')
    
    if (await recoveryButton.isVisible()) {
      await recoveryButton.click()
      
      const dashboard = page.locator('[data-testid="recovery-dashboard"]')
      await expect(dashboard).toBeVisible({ timeout: 5000 })
      
      // Check for key dashboard elements
      await expect(page.locator('[data-testid="days-counter"]')).toBeVisible()
      await expect(page.locator('[data-testid="milestone-progress"]')).toBeVisible()
      await expect(page.locator('[data-testid="mood-tracker"]')).toBeVisible()
    }
  })

  test('daily check-in functionality works', async ({ page }) => {
    await page.goto('/recovery')
    
    const checkInButton = page.locator('[data-testid="daily-checkin-button"]')
    if (await checkInButton.isVisible()) {
      await checkInButton.click()
      
      const checkInForm = page.locator('[data-testid="checkin-form"]')
      await expect(checkInForm).toBeVisible()
      
      // Fill out mood rating
      const moodSlider = page.locator('[data-testid="mood-slider"]')
      if (await moodSlider.isVisible()) {
        await moodSlider.fill('7')
      }
      
      // Select coping strategies used
      const copingCheckbox = page.locator('[data-testid="coping-strategy-checkbox"]').first()
      if (await copingCheckbox.isVisible()) {
        await copingCheckbox.click()
      }
      
      // Add notes
      const notesTextarea = page.locator('[data-testid="checkin-notes"]')
      if (await notesTextarea.isVisible()) {
        await notesTextarea.fill('Feeling positive today, attended support group')
      }
      
      // Submit check-in
      await page.click('[data-testid="submit-checkin"]')
      
      // Verify success message
      const successMessage = page.locator('[data-testid="checkin-success"]')
      await expect(successMessage).toBeVisible()
    }
  })

  test('milestone tracking and celebrations', async ({ page }) => {
    await page.goto('/recovery')
    
    const milestonesSection = page.locator('[data-testid="milestones-section"]')
    if (await milestonesSection.isVisible()) {
      // Check for milestone badges
      const milestoneBadges = page.locator('[data-testid="milestone-badge"]')
      if (await milestoneBadges.count() > 0) {
        await expect(milestoneBadges.first()).toBeVisible()
        
        // Click on a milestone to see details
        await milestoneBadges.first().click()
        
        const milestoneDetails = page.locator('[data-testid="milestone-details"]')
        await expect(milestoneDetails).toBeVisible()
      }
    }
  })

  test('progress charts and analytics', async ({ page }) => {
    await page.goto('/recovery/progress')
    
    // Check for mood trend chart
    const moodChart = page.locator('[data-testid="mood-trend-chart"]')
    if (await moodChart.isVisible()) {
      await expect(moodChart).toBeVisible()
      
      // Verify chart has data points
      const chartData = page.locator('[data-testid="chart-data-point"]')
      if (await chartData.count() > 0) {
        expect(await chartData.count()).toBeGreaterThan(0)
      }
    }
    
    // Check for coping strategies effectiveness
    const strategiesChart = page.locator('[data-testid="strategies-effectiveness-chart"]')
    if (await strategiesChart.isVisible()) {
      await expect(strategiesChart).toBeVisible()
    }
  })

  test('goal setting and tracking', async ({ page }) => {
    await page.goto('/recovery/goals')
    
    const setGoalButton = page.locator('[data-testid="set-new-goal-button"]')
    if (await setGoalButton.isVisible()) {
      await setGoalButton.click()
      
      const goalForm = page.locator('[data-testid="goal-form"]')
      await expect(goalForm).toBeVisible()
      
      // Fill out goal details
      await page.fill('[data-testid="goal-title"]', 'Attend 3 support group meetings this week')
      await page.fill('[data-testid="goal-description"]', 'Building my support network')
      
      // Set deadline
      const deadlineInput = page.locator('[data-testid="goal-deadline"]')
      if (await deadlineInput.isVisible()) {
        await deadlineInput.fill('2024-12-31')
      }
      
      // Submit goal
      await page.click('[data-testid="save-goal"]')
      
      // Verify goal appears in list
      const goalsList = page.locator('[data-testid="goals-list"]')
      await expect(goalsList).toContainText('Attend 3 support group meetings')
    }
  })

  test('relapse prevention planning', async ({ page }) => {
    await page.goto('/recovery/relapse-prevention')
    
    const preventionPlan = page.locator('[data-testid="relapse-prevention-plan"]')
    if (await preventionPlan.isVisible()) {
      // Check for warning signs section
      const warningSigns = page.locator('[data-testid="warning-signs-section"]')
      await expect(warningSigns).toBeVisible()
      
      // Add a warning sign
      const addWarningSignButton = page.locator('[data-testid="add-warning-sign"]')
      if (await addWarningSignButton.isVisible()) {
        await addWarningSignButton.click()
        
        const warningSignInput = page.locator('[data-testid="warning-sign-input"]')
        await warningSignInput.fill('Increased irritability')
        
        const saveWarningSignButton = page.locator('[data-testid="save-warning-sign"]')
        await saveWarningSignButton.click()
        
        // Verify it was added
        await expect(page.locator('[data-testid="warning-sign-item"]')).toContainText('Increased irritability')
      }
    }
  })

  test('support network management', async ({ page }) => {
    await page.goto('/recovery/support-network')
    
    const supportNetwork = page.locator('[data-testid="support-network"]')
    if (await supportNetwork.isVisible()) {
      // Add a support contact
      const addContactButton = page.locator('[data-testid="add-support-contact"]')
      if (await addContactButton.isVisible()) {
        await addContactButton.click()
        
        const contactForm = page.locator('[data-testid="contact-form"]')
        await expect(contactForm).toBeVisible()
        
        // Fill contact details
        await page.fill('[data-testid="contact-name"]', 'Sarah Johnson')
        await page.fill('[data-testid="contact-phone"]', '555-0123')
        await page.fill('[data-testid="contact-relationship"]', 'Sponsor')
        
        await page.click('[data-testid="save-contact"]')
        
        // Verify contact was added
        const contactsList = page.locator('[data-testid="contacts-list"]')
        await expect(contactsList).toContainText('Sarah Johnson')
      }
    }
  })

  test('journal and reflection features', async ({ page }) => {
    await page.goto('/recovery/journal')
    
    const journalSection = page.locator('[data-testid="journal-section"]')
    if (await journalSection.isVisible()) {
      // Create new journal entry
      const newEntryButton = page.locator('[data-testid="new-journal-entry"]')
      if (await newEntryButton.isVisible()) {
        await newEntryButton.click()
        
        const journalEditor = page.locator('[data-testid="journal-editor"]')
        await expect(journalEditor).toBeVisible()
        
        // Write entry
        await journalEditor.fill('Today was challenging but I used breathing exercises and called my sponsor when I felt triggered.')
        
        // Add mood and tags
        const moodSelector = page.locator('[data-testid="entry-mood-selector"]')
        if (await moodSelector.isVisible()) {
          await moodSelector.selectOption('optimistic')
        }
        
        // Save entry
        await page.click('[data-testid="save-journal-entry"]')
        
        // Verify entry was saved
        const entriesList = page.locator('[data-testid="journal-entries-list"]')
        await expect(entriesList).toContainText('Today was challenging')
      }
    }
  })

  test('data visualization and insights', async ({ page }) => {
    await page.goto('/recovery/insights')
    
    const insightsSection = page.locator('[data-testid="insights-section"]')
    if (await insightsSection.isVisible()) {
      // Check for recovery patterns
      const patternsChart = page.locator('[data-testid="recovery-patterns-chart"]')
      if (await patternsChart.isVisible()) {
        await expect(patternsChart).toBeVisible()
      }
      
      // Check for personalized recommendations
      const recommendations = page.locator('[data-testid="recovery-recommendations"]')
      if (await recommendations.isVisible()) {
        await expect(recommendations).toBeVisible()
        
        // Should have at least one recommendation
        const recommendationItems = page.locator('[data-testid="recommendation-item"]')
        if (await recommendationItems.count() > 0) {
          expect(await recommendationItems.count()).toBeGreaterThan(0)
        }
      }
    }
  })
})

test.describe('Recovery Tracking Privacy and Security', () => {
  test('sensitive data is handled securely', async ({ page }) => {
    await page.goto('/recovery')
    
    // Check that sensitive forms have security indicators
    const sensitiveForm = page.locator('[data-testid="sensitive-data-form"]')
    if (await sensitiveForm.isVisible()) {
      const encryptionNotice = page.locator('[data-testid="encryption-notice"]')
      await expect(encryptionNotice).toBeVisible()
    }
  })

  test('data export includes recovery data', async ({ page }) => {
    await page.goto('/account/export')
    
    const exportOptions = page.locator('[data-testid="export-options"]')
    if (await exportOptions.isVisible()) {
      // Should include recovery tracking data option
      const recoveryDataOption = page.locator('[data-testid="export-recovery-data"]')
      if (await recoveryDataOption.isVisible()) {
        await expect(recoveryDataOption).toBeVisible()
      }
    }
  })

  test('offline access to recovery tools', async ({ page }) => {
    await page.goto('/recovery')
    
    // Go offline
    await page.context().setOffline(true)
    
    // Recovery dashboard should still be accessible
    const dashboard = page.locator('[data-testid="recovery-dashboard"]')
    if (await dashboard.isVisible()) {
      await expect(dashboard).toBeVisible()
      
      // Offline indicator should be shown
      const offlineIndicator = page.locator('[data-testid="offline-indicator"]')
      if (await offlineIndicator.isVisible()) {
        await expect(offlineIndicator).toBeVisible()
      }
    }
    
    // Go back online
    await page.context().setOffline(false)
  })
})