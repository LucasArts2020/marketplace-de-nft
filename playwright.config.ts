import { defineConfig, devices } from '@playwright/test'
import process from 'node:process'

const origin = 'http://127.0.0.1:4173'
const publishedOrigin = process.env.KURIO_E2E_URL

export default defineConfig({
  testDir: './tests',
  updateSnapshots: 'none',
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: publishedOrigin ?? origin, trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'], defaultBrowserType: 'chromium', viewport: { width: 390, height: 844 } } },
  ],
  webServer: publishedOrigin ? undefined : {
    command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4173 --strictPort',
    url: origin,
    reuseExistingServer: false,
  },
})
