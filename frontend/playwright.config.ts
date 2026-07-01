import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',
    viewport: { width: 1280, height: 720 },
    screenshot: 'only-on-failure',
  },
  /* Run `docker compose up -d backend` before running E2E */
  webServer: [
    {
      command: 'cd ../backend && uv run uvicorn app.main:app --port 8000',
      port: 8000,
      reuseExistingServer: true,
      timeout: 15000,
      env: {
        ADMIN_TOKEN: process.env.ADMIN_TOKEN || 'e2e-admin-2026',
        DATABASE_URL: 'sqlite+aiosqlite:///./e2e-mao-na-massa.db',
        ENVIRONMENT: 'development',
        CORS_ORIGINS: 'http://localhost:5173,http://localhost:3000',
        ALLOWED_HOSTS: '*',
      },
    },
    {
      command: 'npm run dev',
      port: 5173,
      reuseExistingServer: true,
      timeout: 15000,
    },
  ],
})
