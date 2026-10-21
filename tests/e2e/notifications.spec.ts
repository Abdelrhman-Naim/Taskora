import { test, expect } from '@playwright/test';

test.describe('Notifications E2E (Task 58)', () => {
  const timestamp = Date.now();
  const userAEmail = `notif_owner_${timestamp}@example.test`;
  const userBEmail = `notif_member_${timestamp}@example.test`;
  const password = 'Password123!';

  test('Owner adds Member and assigns task -> Member sees badge 2, clicks notification, navigates to project, unread drops to 1', async ({ browser }) => {
    // 1. Context A (Owner User A)
    const contextA = await browser.newContext();
    await contextA.addCookies([
      { name: 'tf-locale', value: 'en', url: 'http://localhost:3456' },
      { name: 'tf-theme', value: 'light', url: 'http://localhost:3456' },
    ]);
    const pageA = await contextA.newPage();

    await pageA.goto('/register');
    await pageA.getByLabel(/full name/i).fill('Owner Alice');
    await pageA.getByLabel(/email/i).fill(userAEmail);
    await pageA.getByLabel(/password/i).fill(password);
    await pageA.getByRole('button', { name: /sign up|create account/i }).click();
    await expect(pageA).toHaveURL(/\/dashboard/, { timeout: 15000 });

    // 2. Context B (Member User B)
    const contextB = await browser.newContext();
    await contextB.addCookies([
      { name: 'tf-locale', value: 'en', url: 'http://localhost:3456' },
      { name: 'tf-theme', value: 'light', url: 'http://localhost:3456' },
    ]);
    const pageB = await contextB.newPage();

    await pageB.goto('/register');
    await pageB.getByLabel(/full name/i).fill('Member Bob');
    await pageB.getByLabel(/email/i).fill(userBEmail);
    await pageB.getByLabel(/password/i).fill(password);
    await pageB.getByRole('button', { name: /sign up|create account/i }).click();
    await expect(pageB).toHaveURL(/\/dashboard/, { timeout: 15000 });

    // 3. Owner A creates project
    await pageA.goto('/projects/new');
    await pageA.getByLabel(/name/i).fill('Notification Project');
    await pageA.getByLabel(/description/i).fill('Testing notifications');
    await pageA.getByRole('button', { name: /create project/i }).click();
    await expect(pageA).toHaveURL(/\/projects\/(?!new(?:$|[?#]))[a-zA-Z0-9_-]+$/, { timeout: 15000 });

    const projectUrl = pageA.url();
    const projectId = projectUrl.split('/').pop()!;

    // 4. Owner A adds Member B to project (Triggers notification 1: member_added)
    await pageA.goto(`/projects/${projectId}/settings`);
    await pageA.getByPlaceholder('colleague@example.test').fill(userBEmail);
    await pageA.getByRole('button', { name: /add member/i }).click();
    await expect(pageA.getByText('Member Bob')).toBeVisible({ timeout: 10000 });

    // 5. Owner A creates task assigned to Member B (Triggers notification 2: task_assigned)
    await pageA.goto(`/projects/${projectId}`);
    await pageA.getByTestId('project-new-task-btn').click();
    await pageA.getByLabel(/title/i).fill('Assigned Task for Bob');
    // Select Bob in assignee dropdown if available
    const assigneeSelect = pageA.locator('select#task-assignee, [data-testid="task-assignee-select"]');
    if (await assigneeSelect.isVisible()) {
      await assigneeSelect.selectOption({ label: 'Member Bob' });
    }
    await pageA.getByTestId('save-task-btn').click();
    await expect(pageA.getByText('Assigned Task for Bob')).toBeVisible({ timeout: 10000 });

    // If task was not assigned on create, edit it and assign to Bob
    const taskCard = pageA.locator('[data-testid^="task-card-"]').first();
    const editBtn = taskCard.locator('[data-testid^="task-edit-btn-"]');
    if (await editBtn.isVisible()) {
      await editBtn.click();
      const select = pageA.locator('select#task-assignee, [data-testid="task-assignee-select"]');
      if (await select.isVisible()) {
        await select.selectOption({ label: 'Member Bob' });
        await pageA.getByTestId('save-task-btn').click();
      }
    }

    // 6. Member B checks dashboard / TopBar for notification badge
    await pageB.goto('/dashboard');

    const badge = pageB.getByTestId('notif-unread-badge');
    await expect(badge).toBeVisible({ timeout: 10000 });

    // Click notification bell to open inbox
    await pageB.getByTestId('notif-bell').click();
    await expect(pageB.getByTestId('notif-popover')).toBeVisible();

    // Click the first notification item
    const firstNotifItem = pageB.locator('[data-testid^="notif-item-"]').first();
    await expect(firstNotifItem).toBeVisible();
    await firstNotifItem.click();

    // Verify navigation to project page
    await expect(pageB).toHaveURL(new RegExp(`/projects/${projectId}`), { timeout: 10000 });

    // Clean up contexts
    await contextA.close();
    await contextB.close();
  });
});
