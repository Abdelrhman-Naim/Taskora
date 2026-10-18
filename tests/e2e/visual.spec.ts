import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Visual Regression & Comprehensive Baseline Verification (Task 38)', () => {
  test.setTimeout(240_000);

  const timestamp = Date.now();
  const ownerEmail = `visual_owner_${timestamp}@example.test`;
  const memberEmail = `visual_member_${timestamp}@example.test`;
  const password = 'Password123!';

  let storageState: Awaited<ReturnType<import('@playwright/test').BrowserContext['storageState']>> | undefined;
  let projectId: string;

  test.beforeAll(async ({ browser, baseURL }) => {
    const appUrl = baseURL || 'http://localhost:3456';

    // Register Member in separate context
    const memberContext = await browser.newContext();
    const memberPage = await memberContext.newPage();
    await memberPage.goto('/register');
    await memberPage.getByLabel(/full name|name/i).fill('Sam Partner');
    await memberPage.getByLabel(/email/i).fill(memberEmail);
    await memberPage.getByLabel(/password/i).fill(password);
    await memberPage.getByRole('button', { name: /sign up|register|create account/i }).click();
    await memberPage.waitForURL('**/dashboard');
    await memberContext.close();

    // Register Owner in main context
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await context.addCookies([
      { name: 'tf-locale', value: 'en', url: appUrl },
      { name: 'tf-theme', value: 'light', url: appUrl },
    ]);
    const page = await context.newPage();

    await page.goto('/register');
    await page.getByLabel(/full name|name/i).fill('Sara Executive');
    await page.getByLabel(/email/i).fill(ownerEmail);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /sign up|register|create account/i }).click();
    await page.waitForURL('**/dashboard');

    // Create Sample Project
    await page.getByRole('link', { name: /\+? ?new project/i }).first().click();
    await page.waitForURL('**/projects/new');
    await page.getByLabel(/project name/i).fill('Enterprise Architecture');
    await page.getByLabel(/description/i).fill('Infrastructure modernization and governance workspace');
    await page.getByRole('button', { name: /create project|save project/i }).click();
    await page.waitForURL(/\/projects\/(?!new(?:$|[?#]))[a-zA-Z0-9_-]+/);

    projectId = page.url().split('/projects/')[1].split(/[?#]/)[0];

    // Add Member to Project
    await page.goto(`/projects/${projectId}/settings`);
    await page.getByLabel(/email/i).fill(memberEmail);
    await page.getByRole('button', { name: /add member/i }).click();
    await page.locator('text=Sam Partner').waitFor({ state: 'visible' });

    // Add 2 Tasks (one regular, one overdue)
    await page.goto(`/projects/${projectId}`);
    await page.getByTestId('project-new-task-btn').click();
    await page.getByLabel(/title/i).fill('Define Core Schema');
    await page.getByTestId('save-task-btn').click();
    await page.locator('text=Define Core Schema').waitFor({ state: 'visible' });

    await page.getByTestId('project-new-task-btn').click();
    await page.getByLabel(/title/i).fill('System Security Audit');
    await page.getByTestId('task-due-date-input').fill('2026-10-10');
    await page.getByTestId('save-task-btn').click();
    await page.locator('text=System Security Audit').waitFor({ state: 'visible' });

    storageState = await context.storageState();
    await context.close();
  });

  const combos = [
    { locale: 'en', theme: 'light' },
    { locale: 'en', theme: 'dark' },
    { locale: 'ar', theme: 'light' },
    { locale: 'ar', theme: 'dark' },
  ];

  const viewports = [
    { name: 'desktop', width: 1280, height: 800 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 375, height: 667 },
  ];

  for (const { locale, theme } of combos) {
    for (const vp of viewports) {
      test(`Visual & A11y verification: [${locale}] [${theme}] [${vp.name} ${vp.width}px]`, async ({ browser, baseURL }) => {
        const appUrl = baseURL || 'http://localhost:3456';
        const context = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
          storageState,
        });

        await context.addCookies([
          { name: 'tf-locale', value: locale, url: appUrl },
          { name: 'tf-theme', value: theme, url: appUrl },
        ]);

        const page = await context.newPage();
        await page.clock.setFixedTime(new Date('2026-10-18T12:00:00Z'));

        const pagesToVerify = [
          { name: 'dashboard', url: '/dashboard' },
          { name: 'project', url: `/projects/${projectId}` },
          { name: 'settings', url: `/projects/${projectId}/settings` },
        ];

        for (const target of pagesToVerify) {
          await page.goto(target.url);
          await page.waitForLoadState('domcontentloaded');
          await page.waitForSelector('[data-testid="page-ready"]');
          await page.evaluate(() => document.fonts.ready);

          // 1. Verify ZERO horizontal overflow
          const hasHorizontalOverflow = await page.evaluate(() => {
            return document.documentElement.scrollWidth > document.documentElement.clientWidth;
          });
          expect(
            hasHorizontalOverflow,
            `Horizontal overflow on ${target.name} [${locale}/${theme}] at ${vp.width}px`
          ).toBe(false);

          // 2. In Arabic (RTL), verify RTL direction and sidebar alignment
          if (locale === 'ar') {
            const htmlDir = await page.getAttribute('html', 'dir');
            expect(htmlDir).toBe('rtl');

            if (vp.width >= 1024) {
              const sidebar = page.locator('[data-testid="app-sidebar"]');
              if (await sidebar.count() > 0) {
                const box = await sidebar.boundingBox();
                if (box) {
                  // Sidebar right boundary must align with window viewport width
                  expect(Math.round(box.x + box.width)).toBe(vp.width);
                }
              }
            }
          }

          // 3. Axe A11y & Contrast Audit (zero critical violations)
          const axeResults = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa'])
            .analyze();

          const violations = axeResults.violations.filter((v) =>
            v.id === 'color-contrast' || v.id === 'label' || v.id.startsWith('aria-')
          );

          expect(
            violations,
            `Accessibility violations on ${target.name} [${locale}/${theme}]:\n${JSON.stringify(violations, null, 2)}`
          ).toEqual([]);
        }

        await context.close();
      });
    }
  }

  // Visual snapshot baseline for login page
  for (const { locale, theme } of combos) {
    for (const width of [1280, 375]) {
      test(`Login page baseline [${locale}] [${theme}] [${width}px]`, async ({ browser, baseURL }) => {
        const appUrl = baseURL || 'http://localhost:3456';
        const context = await browser.newContext({
          viewport: { width, height: 800 },
        });

        await context.addCookies([
          { name: 'tf-locale', value: locale, url: appUrl },
          { name: 'tf-theme', value: theme, url: appUrl },
        ]);

        const page = await context.newPage();
        await page.clock.setFixedTime(new Date('2026-10-18T12:00:00Z'));
        await page.goto('/login');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForSelector('[data-testid="page-ready"]');
        await page.evaluate(() => document.fonts.ready);

        // Verify zero horizontal overflow
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
        expect(overflow).toBe(false);

        // Axe audit
        const axeResults = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa'])
          .analyze();
        const violations = axeResults.violations.filter((v) =>
          v.id === 'color-contrast' || v.id === 'label' || v.id.startsWith('aria-')
        );
        expect(violations).toEqual([]);

        await context.close();
      });
    }
  }
});
