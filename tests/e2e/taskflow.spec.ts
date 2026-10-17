import { test, expect } from '@playwright/test';

test.describe('TaskFlow Acceptance & E2E Test Suite (TC-01…TC-16)', () => {
  test.describe.configure({ mode: 'serial' });

  const timestamp = Date.now();
  const ownerEmail = `owner_${timestamp}@example.test`;
  const memberEmail = `member_${timestamp}@example.test`;
  const strangerEmail = `stranger_${timestamp}@example.test`;
  const password = 'Password123!';

  let sharedProjectId = '';

  test.beforeEach(async ({ page, context }) => {
    await context.addCookies([
      { name: 'tf-locale', value: 'en', url: 'http://localhost:3456' },
      { name: 'tf-theme', value: 'light', url: 'http://localhost:3456' },
    ]);
    page.on('console', (msg) => console.log(`[BROWSER LOG] ${msg.type()}: ${msg.text()}`));
    page.on('pageerror', (err) => console.log(`[BROWSER ERROR]: ${err.message}`));
  });

  test('TC-04: Unauthenticated redirect to /login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: /log in/i })).toBeVisible();
  });

  test('TC-01 & TC-03: User registration, logout, and login', async ({ page }) => {
    // 1. Register Member
    await page.goto('/register');
    await page.getByLabel(/full name/i).fill('Test Member');
    await page.getByLabel(/email/i).fill(memberEmail);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /sign up|create account/i }).click();

    const alert = page.getByRole('alert');
    if (await alert.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('REGISTRATION ERROR ALERT:', await alert.textContent());
    }

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    await expect(page.getByText('Test Member').first()).toBeVisible({ timeout: 15000 });

    // 2. Logout Member
    await page.getByRole('button', { name: /log out/i }).click();
    await expect(page).toHaveURL(/\/login/);

    // 3. Register Owner
    await page.goto('/register');
    await page.getByLabel(/full name/i).fill('Test Owner');
    await page.getByLabel(/email/i).fill(ownerEmail);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /sign up|create account/i }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    await expect(page.getByText('Test Owner').first()).toBeVisible({ timeout: 15000 });

    // 4. Logout Owner and Login back
    await page.getByRole('button', { name: /log out/i }).click();
    await expect(page).toHaveURL(/\/login/);

    await page.getByLabel(/email/i).fill(ownerEmail);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /log in|sign in/i }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText('Test Owner').first()).toBeVisible();
  });

  test('TC-05 & TC-09: Project and Task Creation with persistence across reload', async ({ page }) => {
    // Login as Owner
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(ownerEmail);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /log in|sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // Create Project
    await page.getByRole('link', { name: /\+ new project/i }).first().click();
    await expect(page).toHaveURL(/\/projects\/new/);

    const projectName = `Website Redesign ${timestamp}`;
    await page.getByLabel(/project name/i).fill(projectName);
    await page.getByLabel(/description/i).fill('E2E Project Description');
    await page.getByRole('button', { name: /create project|save project/i }).click();

    // Should redirect to the new project page (exclude /projects/new)
    await expect(page).toHaveURL(/\/projects\/(?!new(?:$|[?#]))[a-zA-Z0-9_-]+/, { timeout: 15000 });
    const url = page.url();
    sharedProjectId = url.split('/projects/')[1].split(/[?#]/)[0];
    expect(sharedProjectId).toBeTruthy();
    expect(sharedProjectId).not.toBe('new');

    await expect(page.getByRole('heading', { name: projectName })).toBeVisible({ timeout: 15000 });

    // Reload page to verify persistence (TC-05)
    await page.reload();
    await expect(page.getByRole('heading', { name: projectName })).toBeVisible();

    // Create Task (TC-09)
    await page.getByRole('button', { name: /\+ new task/i }).click();
    await page.getByLabel(/title/i).fill('Build navbar');
    await page.getByLabel(/description/i).fill('Top header navigation');
    await page.locator('#task-priority').selectOption('high');
    await page.locator('form').getByRole('button', { name: /create task|save/i }).click();

    await expect(page.getByText('Build navbar')).toBeVisible({ timeout: 15000 });

    // Create another task for filtering & search tests
    await page.getByRole('button', { name: /\+ new task/i }).click();
    await page.getByLabel(/title/i).fill('Fix overdue bug');
    await page.locator('#task-priority').selectOption('high');
    await page.locator('form').getByRole('button', { name: /create task|save/i }).click();

    await expect(page.getByText('Fix overdue bug')).toBeVisible({ timeout: 15000 });
  });

  test('TC-07 & TC-10: Owner adds member, member sees project and updates task status', async ({ browser }) => {
    const ownerContext = await browser.newContext();
    await ownerContext.addCookies([
      { name: 'tf-locale', value: 'en', url: 'http://localhost:3456' },
      { name: 'tf-theme', value: 'light', url: 'http://localhost:3456' },
    ]);
    const ownerPage = await ownerContext.newPage();

    // Login as Owner
    await ownerPage.goto('/login');
    await ownerPage.getByLabel(/email/i).fill(ownerEmail);
    await ownerPage.getByLabel(/password/i).fill(password);
    await ownerPage.getByRole('button', { name: /log in|sign in/i }).click();
    await expect(ownerPage).toHaveURL(/\/dashboard/);

    // Go to project settings
    await ownerPage.goto(`/projects/${sharedProjectId}/settings`);
    await expect(ownerPage.getByRole('heading', { name: /project settings/i }).first()).toBeVisible();

    // Add Member by email (TC-07)
    await ownerPage.getByLabel(/member email/i).fill(memberEmail);
    await ownerPage.getByRole('button', { name: /add member/i }).click();

    await expect(ownerPage.getByText('Test Member')).toBeVisible();

    // Assign "Build navbar" task to Test Member
    await ownerPage.goto(`/projects/${sharedProjectId}`);
    await expect(ownerPage.getByText('Build navbar')).toBeVisible();
    await ownerPage.getByRole('button', { name: /edit/i }).first().click();
    await ownerPage.locator('#task-assignee').selectOption({ label: 'Test Member' });
    await ownerPage.locator('form').getByRole('button', { name: /save changes|update task|save/i }).click();

    // Now member checks dashboard in a separate context
    const memberContext = await browser.newContext();
    await memberContext.addCookies([
      { name: 'tf-locale', value: 'en', url: 'http://localhost:3456' },
      { name: 'tf-theme', value: 'light', url: 'http://localhost:3456' },
    ]);
    const memberPage = await memberContext.newPage();

    await memberPage.goto('/login');
    await memberPage.getByLabel(/email/i).fill(memberEmail);
    await memberPage.getByLabel(/password/i).fill(password);
    await memberPage.getByRole('button', { name: /log in|sign in/i }).click();
    await expect(memberPage).toHaveURL(/\/dashboard/);

    // Member sees the project
    await expect(memberPage.getByText(`Website Redesign ${timestamp}`)).toBeVisible();

    // Member visits project and updates assigned task status (TC-10)
    await memberPage.goto(`/projects/${sharedProjectId}`);
    await expect(memberPage.getByText('Build navbar')).toBeVisible();

    const statusSelect = memberPage.locator('select[id^="status-select-"]').first();
    await statusSelect.selectOption('done');
    await expect(statusSelect).toHaveValue('done');
    await memberPage.waitForTimeout(1000);

    // Verify it stays done after reload
    await memberPage.reload();
    await expect(statusSelect).toHaveValue('done');

    await ownerContext.close();
    await memberContext.close();
  });

  test('TC-11 & TC-12: Filter and search tasks', async ({ page }) => {
    // Login as Owner and go to project
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(ownerEmail);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /log in|sign in/i }).click();

    await page.goto(`/projects/${sharedProjectId}`);
    await expect(page.getByText('Build navbar')).toBeVisible();
    await expect(page.getByText('Fix overdue bug')).toBeVisible();

    // Search for navbar (case insensitive)
    await page.locator('#filter-search').fill('NAVBAR');
    await expect(page.getByText('Build navbar')).toBeVisible();
    await expect(page.getByText('Fix overdue bug')).not.toBeVisible();

    // Clear search
    await page.locator('#filter-search').fill('');
    await expect(page.getByText('Fix overdue bug')).toBeVisible();

    // Filter by priority
    await page.locator('#filter-priority').selectOption('low');
    await expect(page.getByText(/no tasks match your filters/i)).toBeVisible();

    // Reset filters
    await page.getByRole('button', { name: /reset/i }).first().click();
    await expect(page.getByText('Build navbar')).toBeVisible();
  });

  test('TC-13: Access control on non-member project and not-found project', async ({ browser }) => {
    const strangerContext = await browser.newContext();
    await strangerContext.addCookies([
      { name: 'tf-locale', value: 'en', url: 'http://localhost:3456' },
      { name: 'tf-theme', value: 'light', url: 'http://localhost:3456' },
    ]);
    const strangerPage = await strangerContext.newPage();

    // Register a stranger who is not a member of the project
    await strangerPage.goto('/register');
    await strangerPage.getByLabel(/full name/i).fill('Stranger User');
    await strangerPage.getByLabel(/email/i).fill(strangerEmail);
    await strangerPage.getByLabel(/password/i).fill(password);
    await strangerPage.getByRole('button', { name: /sign up|create account/i }).click();
    await expect(strangerPage).toHaveURL(/\/dashboard/, { timeout: 15000 });

    // Try accessing owner's project
    await strangerPage.goto(`/projects/${sharedProjectId}`);
    await expect(strangerPage.getByRole('heading', { name: /access denied/i })).toBeVisible({ timeout: 15000 });
    // Project title must NOT be visible
    await expect(strangerPage.getByRole('heading', { name: `Website Redesign ${timestamp}` })).not.toBeVisible();

    // Try accessing a completely nonexistent project
    await strangerPage.goto('/projects/nonexistent-project-id-9999');
    await expect(strangerPage.getByRole('heading', { name: /project not found/i })).toBeVisible({ timeout: 15000 });

    await strangerContext.close();
  });

  test('TC-15: Responsive layout and no horizontal overflow at 375, 768, 1280 viewports', async ({ page }) => {
    // Login as Owner
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(ownerEmail);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /log in|sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    const viewports = [
      { width: 375, height: 667 },
      { width: 768, height: 1024 },
      { width: 1280, height: 800 },
    ];

    const pagesToTest = [
      '/dashboard',
      `/projects/${sharedProjectId}`,
      `/projects/${sharedProjectId}/settings`,
    ];

    for (const vp of viewports) {
      await page.setViewportSize(vp);
      for (const path of pagesToTest) {
        await page.goto(path);
        await page.waitForLoadState('domcontentloaded');
        await page.locator('main').waitFor({ state: 'visible' });

        // Verify document scrollWidth <= window innerWidth (no horizontal scrollbar)
        const isOverflowing = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });
        expect(isOverflowing).toBe(false);
      }
    }
  });

  test('TC-16: Offline error resilience on task creation', async ({ page, context }) => {
    // Login as Owner
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(ownerEmail);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /log in|sign in/i }).click();

    await page.goto(`/projects/${sharedProjectId}`);
    await expect(page.getByText('Build navbar')).toBeVisible();

    await page.getByRole('button', { name: /\+ new task/i }).click();

    const titleField = page.locator('#task-title');
    await titleField.fill('Offline Task Failure Test');

    // Simulate offline
    await context.setOffline(true);

    const submitBtn = page.locator('form').getByRole('button', { name: /create task|save/i });
    await submitBtn.click();

    // Expect error within <= 10 seconds
    const errorAlert = page.locator('form').getByRole('alert');
    await expect(errorAlert).toBeVisible({ timeout: 10000 });
    await expect(errorAlert).toContainText(/offline/i);

    // Re-enable online
    await context.setOffline(false);

    // Cancel form and verify task was not added
    await page.locator('form').getByRole('button', { name: /cancel/i }).click();
    await expect(page.getByText('Offline Task Failure Test')).not.toBeVisible();
  });
});
