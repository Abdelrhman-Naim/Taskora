import { test, expect } from '@playwright/test';

test.describe('Keyboard Shortcuts E2E (Task 62)', () => {
  const timestamp = Date.now();
  const ownerEmail = `shortcuts_owner_${timestamp}@example.test`;
  const password = 'Password123!';

  test('hotkeys N opens task form, / focuses search, ? opens shortcuts dialog', async ({ page }) => {
    await page.context().addCookies([
      { name: 'tf-locale', value: 'en', url: 'http://localhost:3456' },
      { name: 'tf-theme', value: 'light', url: 'http://localhost:3456' },
    ]);

    // 1. Register Owner
    await page.goto('/register');
    await page.getByLabel(/full name/i).fill('Shortcuts Tester');
    await page.getByLabel(/email/i).fill(ownerEmail);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /sign up|create account/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

    // 2. Create Project
    await page.goto('/projects/new');
    await page.getByLabel(/name/i).fill('Hotkeys Project');
    await page.getByLabel(/description/i).fill('Testing shortcuts');
    await page.getByRole('button', { name: /create project/i }).click();
    await expect(page).toHaveURL(/\/projects\/[a-zA-Z0-9_-]+$/, { timeout: 15000 });

    const projectUrl = page.url();
    const projectId = projectUrl.split('/').pop()!;
    await page.goto(`/projects/${projectId}`);

    // Wait until project view is loaded and filter bar is present
    await expect(page.getByTestId('filter-bar')).toBeVisible({ timeout: 10000 });

    // 3. Test 'N' hotkey: opens new task dialog
    await page.keyboard.press('n');
    await expect(page.getByTestId('save-task-btn')).toBeVisible({ timeout: 5000 });

    // Close dialog with Escape
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('save-task-btn')).not.toBeVisible();

    // 4. Test '/' hotkey: focuses filter search input
    await page.keyboard.press('/');
    await expect(page.locator('#filter-search')).toBeFocused();

    // Blur search so hotkeys work again
    await page.locator('#filter-search').blur();

    // 5. Test '?' (Shift+Slash) hotkey: opens shortcuts dialog
    await page.keyboard.press('?');
    await expect(page.getByTestId('shortcuts-dialog')).toBeVisible({ timeout: 5000 });

    // Close shortcuts dialog with Escape
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('shortcuts-dialog')).not.toBeVisible();
  });
});
