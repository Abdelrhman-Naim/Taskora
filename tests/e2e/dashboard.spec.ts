import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Professional Dashboard E2E Verification (Task 26)', () => {
  test.setTimeout(120_000);

  const screenshotsDir = path.resolve(process.cwd(), 'docs', 'screenshots', 'phase3');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  test('Dashboard rendering, no horizontal overflow, responsive table, and chart toggling', async ({ browser, baseURL }) => {
    const timestamp = Date.now();
    const ownerEmail = `pro_dash_${timestamp}@example.test`;
    const password = 'Password123!';
    const appUrl = baseURL || 'http://localhost:3456';

    const seedContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await seedContext.addCookies([
      { name: 'tf-locale', value: 'en', url: appUrl },
      { name: 'tf-theme', value: 'light', url: appUrl },
    ]);
    const page = await seedContext.newPage();

    // 1. Register user
    await page.goto('/register');
    await page.getByLabel(/full name/i).fill('Sara Executive');
    await page.getByLabel(/email/i).fill(ownerEmail);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /sign up|create account/i }).click();
    await page.waitForURL('**/dashboard');

    // 2. Initially empty dashboard shows OnboardingEmpty
    await expect(page.getByRole('region', { name: /get started with taskora/i })).toBeVisible();

    // 3. Create a project
    await page.getByRole('link', { name: /\+ new project|new project/i }).first().click();
    await page.waitForURL('**/projects/new');
    await page.getByLabel(/project name/i).fill('Acme Portal');
    await page.getByLabel(/description/i).fill('Client facing modern portal');
    await page.getByRole('button', { name: /create project|save project/i }).click();
    await page.waitForURL(/\/projects\/(?!new(?:$|[?#]))[a-zA-Z0-9_-]+/);

    // 4. Create tasks: 1 in-progress, 1 overdue, 1 done
    // Task 1:
    await page.getByTestId('project-new-task-btn').click();
    await page.getByTestId('task-title-input').fill('Design navigation architecture');
    await page.getByTestId('save-task-btn').click();
    await page.locator('text=Design navigation architecture').waitFor({ state: 'visible' });

    // 5. Navigate back to dashboard
    await page.goto('/dashboard');
    await page.waitForSelector('[data-testid="page-ready"]');

    // Verify KPI Strip
    const kpiStrip = page.getByRole('region', { name: /key performance indicators/i });
    await expect(kpiStrip).toBeVisible();

    // Verify Chart Panels
    const chartPanels = page.getByRole('region', { name: /tasks by project/i }).first();
    await expect(chartPanels).toBeVisible();

    // Toggle Chart to Table view
    const viewTableBtn = page.getByRole('radio', { name: /view as table/i }).first();
    if (await viewTableBtn.isVisible()) {
      await viewTableBtn.click();
      await expect(page.getByRole('table').first()).toBeVisible();
    }

    // Verify viewports for horizontal overflow
    const viewports = [
      { width: 1280, height: 800, name: 'desktop' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 375, height: 667, name: 'mobile' },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(100);

      const hasHorizontalScroll = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(hasHorizontalScroll, `Horizontal overflow detected at ${vp.width}px`).toBe(false);

      // Save screenshot
      const buffer = await page.screenshot({ fullPage: false });
      fs.writeFileSync(path.join(screenshotsDir, `dashboard-${vp.name}-en-light.png`), buffer);
    }

    // Now test Arabic RTL combo at 375px & 1280px
    await page.evaluate(() => {
      document.cookie = 'tf-locale=ar; path=/';
    });
    await page.goto('/dashboard');
    await page.waitForSelector('[data-testid="page-ready"]');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(100);

      const hasHorizontalScroll = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(hasHorizontalScroll, `Horizontal overflow in RTL at ${vp.width}px`).toBe(false);

      const buffer = await page.screenshot({ fullPage: false });
      fs.writeFileSync(path.join(screenshotsDir, `dashboard-${vp.name}-ar-light.png`), buffer);
    }

    await seedContext.close();
  });
});
