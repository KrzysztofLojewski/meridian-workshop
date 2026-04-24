const { defineConfig } = require('@playwright/test')

module.exports = defineConfig({
  testDir: './specs',
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    browserName: 'chromium',
    executablePath: process.env.CHROMIUM_PATH || undefined,
  },
  timeout: 15000,
  retries: 1,
})
