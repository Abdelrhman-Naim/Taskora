import { test, expect } from '@playwright/test';

test.describe('Task Comments E2E (Task 57)', () => {
  const timestamp = Date.now();
  const userAEmail = `commenter_a_${timestamp}@example.test`;
  const userBEmail = `commenter_b_${timestamp}@example.test`;
  const password = 'Password123!';

  test('User A comments on a task; User B views it, replies, and deletes own comment but cannot delete A comment', async ({ browser }) => {
    // Context A (User A)
    const contextA = await browser.newContext();
    await contextA.addCookies([
      { name: 'tf-locale', value: 'en', url: 'http://localhost:3456' },
      { name: 'tf-theme', value: 'light', url: 'http://localhost:3456' },
    ]);
    const pageA = await contextA.newPage();

    // 1. Register User A
    await pageA.goto('/register');
    await pageA.getByLabel(/full name/i).fill('User Alpha');
    await pageA.getByLabel(/email/i).fill(userAEmail);
    await pageA.getByLabel(/password/i).fill(password);
    await pageA.getByRole('button', { name: /sign up|create account/i }).click();
    await expect(pageA).toHaveURL(/\/dashboard/, { timeout: 15000 });

    // 2. Register User B in Context B
    const contextB = await browser.newContext();
    await contextB.addCookies([
      { name: 'tf-locale', value: 'en', url: 'http://localhost:3456' },
      { name: 'tf-theme', value: 'light', url: 'http://localhost:3456' },
    ]);
    const pageB = await contextB.newPage();
    await pageB.goto('/register');
    await pageB.getByLabel(/full name/i).fill('User Bravo');
    await pageB.getByLabel(/email/i).fill(userBEmail);
    await pageB.getByLabel(/password/i).fill(password);
    await pageB.getByRole('button', { name: /sign up|create account/i }).click();
    await expect(pageB).toHaveURL(/\/dashboard/, { timeout: 15000 });

    // 3. User A creates a project
    await pageA.goto('/projects/new');
    await pageA.getByLabel(/name/i).fill('Comments Project');
    await pageA.getByLabel(/description/i).fill('Testing task comments');
    await pageA.getByRole('button', { name: /create project/i }).click();
    await expect(pageA).toHaveURL(/\/projects\/[a-zA-Z0-9_-]+$/, { timeout: 15000 });

    const projectUrl = pageA.url();
    const projectId = projectUrl.split('/').pop()!;

    // 4. User A invites User B to the project
    await pageA.goto(`/projects/${projectId}/settings`);
    await pageA.getByPlaceholder('colleague@example.test').fill(userBEmail);
    await pageA.getByRole('button', { name: /add member/i }).click();
    await expect(pageA.getByText('User Bravo')).toBeVisible({ timeout: 10000 });

    // 5. User A creates a task
    await pageA.goto(`/projects/${projectId}`);
    await pageA.getByTestId('project-new-task-btn').click();
    await pageA.getByLabel(/title/i).fill('Discussion Task');
    await pageA.getByTestId('save-task-btn').click();
    await expect(pageA.getByText('Discussion Task')).toBeVisible({ timeout: 10000 });

    // 6. User A clicks the task to open TaskDetailDialog
    await pageA.getByTestId('task-title').click();
    await expect(pageA.getByTestId('task-detail-dialog')).toBeVisible();

    // 7. User A posts a comment
    const commentInputA = pageA.getByTestId('comment-input');
    await commentInputA.fill('Hello from User Alpha');
    await pageA.getByTestId('comment-submit-btn').click();
    await expect(pageA.getByText('Hello from User Alpha')).toBeVisible({ timeout: 10000 });

    // 8. User B goes to the project and opens the task
    await pageB.goto(`/projects/${projectId}`);
    await expect(pageB.getByText('Discussion Task')).toBeVisible({ timeout: 10000 });
    await pageB.getByTestId('task-title').click();
    await expect(pageB.getByTestId('task-detail-dialog')).toBeVisible();

    // 9. User B sees User A's comment
    await expect(pageB.getByText('Hello from User Alpha')).toBeVisible({ timeout: 10000 });

    // User B cannot see delete button on User A's comment
    const commentItemA = pageB.locator('[data-testid^="comment-item-"]').filter({ hasText: 'Hello from User Alpha' });
    await expect(commentItemA.locator('[data-testid^="comment-delete-"]')).toHaveCount(0);

    // 10. User B replies with a comment
    const commentInputB = pageB.getByTestId('comment-input');
    await commentInputB.fill('Reply from User Bravo');
    await pageB.getByTestId('comment-submit-btn').click();
    await expect(pageB.getByText('Reply from User Bravo')).toBeVisible({ timeout: 10000 });

    // 11. User B can see delete button on their own comment and deletes it
    const commentItemB = pageB.locator('[data-testid^="comment-item-"]').filter({ hasText: 'Reply from User Bravo' });
    const deleteBtnB = commentItemB.locator('[data-testid^="comment-delete-"]');
    await expect(deleteBtnB).toBeVisible();
    await deleteBtnB.click();

    // Verify User B's comment is gone while User A's comment remains
    await expect(pageB.getByText('Reply from User Bravo')).toHaveCount(0);
    await expect(pageB.getByText('Hello from User Alpha')).toBeVisible();

    await contextA.close();
    await contextB.close();
  });
});
