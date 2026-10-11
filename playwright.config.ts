import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  workers: 1,
  use: { browserName: 'chromium', headless: true, viewport: { width: 1440, height: 1000 } },
  projects: [
    { name: 'standalone' },
    { name: 'pages', use: { baseURL: 'http://127.0.0.1:4173/chroma-nudge/' } },
  ],
  webServer: {
    command:
      'node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4173 --strictPort --outDir pages',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
  },
});
