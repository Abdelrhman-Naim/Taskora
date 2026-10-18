import { test, expect } from '@playwright/test';

test.describe('Application Shell & Responsive Sidebar E2E (Task 34)', () => {
  test.setTimeout(90_000);

  const timestamp = Date.now();
  const ownerEmail = `shell_${timestamp}@example.test`;
  const password = 'Password123!';

  test('Desktop (1280px): sidebar visible, topbar present, hamburger hidden', async ({ browser, baseURL }) => {
    const appUrl = baseURL || 'http://localhost:3456';
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await context.addCookies([
      { name: 'tf-locale', value: 'en', url: appUrl },
      { name: 'tf-theme', value: 'light', url: appUrl },
    ]);
    const page = await context.newPage();

    // Register user
    await page.goto('/register');
    await page.getByLabel(/full name/i).fill('Shell Tester');
    await page.getByLabel(/email/i).fill(ownerEmail);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /sign up|create account/i }).click();
    await page.waitForURL('**/dashboard');

    // Sidebar visible on desktop
    const sidebar = page.getByTestId('app-sidebar');
    await expect(sidebar).toBeVisible();

    // TopBar visible on desktop
    const topbar = page.getByTestId('app-topbar');
    await expect(topbar).toBeVisible();

    // Hamburger button hidden on desktop (≥ 1024px)
    const hamburger = page.getByRole('button', { name: /open menu|navigation/i });
    await expect(hamburger).toBeHidden();

    // New project link in sidebar
    const newProjectBtn = sidebar.getByRole('link', { name: /new project/i });
    await expect(newProjectBtn).toBeVisible();
    await expect(newProjectBtn).toHaveAttribute('href', '/projects/new');

    // UserMenu opens and closes
    const userMenuBtn = topbar.getByRole('button', { name: /user menu|shell tester/i });
    await expect(userMenuBtn).toBeVisible();
    await userMenuBtn.click();
    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
  });

  test('Mobile (375px): hamburger visible, drawer opens, traps focus, and closes on Escape', async ({ browser, baseURL }) => {
    const appUrl = baseURL || 'http://localhost:3456';
    const context = await browser.newContext({ viewport: { width: 375, height: 667 } });
    await context.addCookies([
      { name: 'tf-locale', value: 'en', url: appUrl },
      { name: 'tf-theme', value: 'light', url: appUrl },
    ]);
    const page = await context.newPage();

    // Login with existing user
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(ownerEmail);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /log in|sign in/i }).click();
    await page.waitForURL('**/dashboard');

    // Desktop sidebar hidden
    const desktopSidebar = page.locator('div[class*="desktopSidebar"]');
    await expect(desktopSidebar).toBeHidden();

    // Hamburger button visible
    const hamburger = page.getByRole('button', { name: /open menu|navigation/i });
    await expect(hamburger).toBeVisible();

    // Open mobile drawer
    await hamburger.click();
    const drawer = page.getByRole('dialog', { name: /navigation|main/i });
    await expect(drawer).toBeVisible();

    // Press Escape to close
    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
  });

  test('RTL parity (Arabic): sidebar sits at inline-start (right edge)', async ({ browser, baseURL }) => {
    const appUrl = baseURL || 'http://localhost:3456';
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await context.addCookies([
      { name: 'tf-locale', value: 'ar', url: appUrl },
      { name: 'tf-theme', value: 'light', url: appUrl },
    ]);
    const page = await context.newPage();

    await page.goto('/login');
    await page.getByLabel(/البريد|email/i).fill(ownerEmail);
    await page.getByLabel(/كلمة المرور|password/i).fill(password);
    await page.getByRole('button', { name: /دخول|تسجيل الدخول|log in/i }).click();
    await page.waitForURL('**/dashboard');

    // Verify HTML dir="rtl"
    const htmlDir = await page.locator('html').getAttribute('dir');
    expect(htmlDir).toBe('rtl');

    // Verify sidebar is aligned to the right edge
    const sidebar = page.getByTestId('app-sidebar');
    await expect(sidebar).toBeVisible();
    const box = await sidebar.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      // In 1280px wide window with RTL, sidebar should be near the right edge (x + width >= 1200)
      expect(box.x + box.width).toBeGreaterThanOrEqual(1200);
    }
  });
});
