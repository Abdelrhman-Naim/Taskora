import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('A11y & Contrast Audits (Task 21 Step 5)', () => {
  // Give ample timeout for 7 pages * 4 combos
  test.setTimeout(180_000);

  test('Zero WCAG AA color-contrast, label, and aria violations across all 7 views in 4 combos', async ({ browser, baseURL }) => {
    const timestamp = Date.now();
    const ownerEmail = `a11y_owner_${timestamp}@example.test`;
    const password = 'Password123!';
    const appUrl = baseURL || 'http://localhost:3456';

    // Seed: Register user and create a project with tasks
    const seedContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await seedContext.addCookies([
      { name: 'tf-locale', value: 'en', url: appUrl },
      { name: 'tf-theme', value: 'light', url: appUrl },
    ]);
    const seedPage = await seedContext.newPage();

    await seedPage.goto('/register');
    await seedPage.getByLabel(/full name/i).fill('A11y Lead');
    await seedPage.getByLabel(/email/i).fill(ownerEmail);
    await seedPage.getByLabel(/password/i).fill(password);
    await seedPage.getByRole('button', { name: /sign up|create account/i }).click();
    await seedPage.waitForURL('**/dashboard');

    // Create a project
    await seedPage.getByRole('link', { name: /\+? ?new project/i }).first().click();
    await seedPage.waitForURL('**/projects/new');
    await seedPage.getByLabel(/project name/i).fill('Core Platform');
    await seedPage.getByLabel(/description/i).fill('Design system and token contrast audit project');
    await seedPage.getByRole('button', { name: /create project|save project/i }).click();
    await seedPage.waitForURL(/\/projects\/(?!new(?:$|[?#]))[a-zA-Z0-9_-]+/);

    const projectId = seedPage.url().split('/projects/')[1].split(/[?#]/)[0];

    // Create a task in the project
    await seedPage.getByTestId('project-new-task-btn').click();
    await seedPage.getByTestId('task-title-input').fill('Fix color tokens');
    await seedPage.getByTestId('save-task-btn').click();
    await seedPage.locator('text=Fix color tokens').waitFor({ state: 'visible' });

    // Extract storage state so subsequent authenticated views can reuse auth
    const storageState = await seedContext.storageState();
    await seedContext.close();

    const combos = [
      { locale: 'en', theme: 'light' },
      { locale: 'en', theme: 'dark' },
      { locale: 'ar', theme: 'light' },
      { locale: 'ar', theme: 'dark' },
    ];

    const unauthPages = ['/login', '/register'];
    const authPages = [
      '/dashboard',
      `/projects/${projectId}`,
      `/projects/${projectId}/settings`,
      '/projects/new',
      '/design-system',
    ];

    for (const { locale, theme } of combos) {
      // Test unauth pages
      const unauthContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
      await unauthContext.addCookies([
        { name: 'tf-locale', value: locale, url: appUrl },
        { name: 'tf-theme', value: theme, url: appUrl },
      ]);
      const unauthPage = await unauthContext.newPage();

      for (const path of unauthPages) {
        await unauthPage.goto(path);
        await unauthPage.waitForLoadState('domcontentloaded');
        // Ensure no loading spinner
        const spinner = unauthPage.locator('[role="status"]');
        if (await spinner.count() > 0) {
          await spinner.first().waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});
        }

        const accessibilityScanResults = await new AxeBuilder({ page: unauthPage })
          .withTags(['wcag2a', 'wcag2aa'])
          .analyze();

        const targetedViolations = accessibilityScanResults.violations.filter(v =>
          v.id === 'color-contrast' || v.id === 'label' || v.id.startsWith('aria-')
        );

        expect(
          targetedViolations,
          `Accessibility violations on ${path} [${locale}/${theme}]:\n${JSON.stringify(targetedViolations, null, 2)}`
        ).toEqual([]);
      }
      await unauthContext.close();

      // Test auth pages
      const authContext = await browser.newContext({
        storageState,
        viewport: { width: 1280, height: 800 },
      });
      await authContext.addCookies([
        { name: 'tf-locale', value: locale, url: appUrl },
        { name: 'tf-theme', value: theme, url: appUrl },
      ]);
      const authPage = await authContext.newPage();

      for (const path of authPages) {
        await authPage.goto(path);
        await authPage.waitForLoadState('domcontentloaded');

        // Wait for page content to settle (no spinners)
        const spinner = authPage.locator('[role="status"]');
        if (await spinner.count() > 0) {
          await spinner.first().waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});
        }

        const accessibilityScanResults = await new AxeBuilder({ page: authPage })
          .withTags(['wcag2a', 'wcag2aa'])
          .analyze();

        const targetedViolations = accessibilityScanResults.violations.filter(v =>
          v.id === 'color-contrast' || v.id === 'label' || v.id.startsWith('aria-')
        );

        expect(
          targetedViolations,
          `Accessibility violations on ${path} [${locale}/${theme}]:\n${JSON.stringify(targetedViolations, null, 2)}`
        ).toEqual([]);
      }
      await authContext.close();
    }
  });
});
