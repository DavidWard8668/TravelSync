import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['allure-playwright', { outputFolder: 'allure-results' }]
  ],
  
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: process.env.CI ? 'https://second-chance-recovery.vercel.app' : 'http://localhost:5173',
    
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Video recording */
    video: 'retain-on-failure',
    
    /* Wait for network requests to settle */
    waitForLoadState: 'networkidle',
    
    /* Global timeout for each action */
    actionTimeout: 30000,
    
    /* Global timeout for navigation */
    navigationTimeout: 30000,
    
    /* Extra HTTP headers */
    extraHTTPHeaders: {
      'X-Test-Environment': 'automated'
    }
  },

  /* Configure projects for major browsers */
  projects: [
    // Desktop browsers for development
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Mobile devices - Critical for recovery support app accessibility */
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
        locale: 'en-US',
        timezoneId: 'America/New_York',
      },
    },
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12'],
        locale: 'en-US',
        timezoneId: 'America/New_York',
      },
    },
    {
      name: 'Mobile Safari Landscape',
      use: { 
        ...devices['iPhone 12 landscape'],
        locale: 'en-US',
        timezoneId: 'America/New_York',
      },
    },
    {
      name: 'Android Chrome',
      use: { 
        ...devices['Galaxy S21'],
        locale: 'en-US',
        timezoneId: 'America/New_York',
      },
    },

    /* Tablet devices for crisis intervention interface */
    {
      name: 'iPad',
      use: { 
        ...devices['iPad Pro'],
        locale: 'en-US',
        timezoneId: 'America/New_York',
      },
    },

    /* Additional accessibility testing devices */
    {
      name: 'iPhone SE',
      use: { 
        ...devices['iPhone SE'],
        locale: 'en-US',
        timezoneId: 'America/New_York',
      },
    },

    /* High contrast mode testing */
    {
      name: 'High Contrast Desktop',
      use: { 
        ...devices['Desktop Chrome'],
        colorScheme: 'dark',
        reducedMotion: 'reduce',
      },
    },
  ],

  /* Test timeout */
  timeout: 60000,
  expect: {
    /* Maximum time expect() should wait for the condition to be met */
    timeout: 10000,
    /* Take screenshots on assertion failures */
    toHaveScreenshot: { 
      mode: 'only-on-failure',
      threshold: 0.2,
      animations: 'disabled'
    },
    toMatchSnapshot: { 
      threshold: 0.2,
      animations: 'disabled'
    }
  },

  /* Configure test matching */
  testMatch: ['**/*.e2e.{ts,js}', '**/*.spec.{ts,js}'],
  
  /* Global setup and teardown */
  globalSetup: './tests/e2e/global-setup.ts',
  globalTeardown: './tests/e2e/global-teardown.ts',

  /* Run your local dev server before starting the tests */
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});