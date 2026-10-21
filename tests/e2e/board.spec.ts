import { test, expect } from '@playwright/test';

test.describe('Task Board E2E (Task 59)', () => {
  const timestamp = Date.now();
  const ownerEmail = `board_owner_${timestamp}@example.test`;
  const memberEmail = `board_member_${timestamp}@example.test`;
  const password = 'Password123!';

  test('Board view drag-and-drop status update, persistence, and permission check', async ({ browser }) => {
    // Context Owner
    const contextOwner = await browser.newContext();
    await contextOwner.addCookies([
      { name: 'tf-locale', value: 'en', url: 'http://localhost:3456' },
      { name: 'tf-theme', value: 'light', url: 'http://localhost:3456' },
    ]);
    const pageOwner = await contextOwner.newPage();

    // 1. Register Owner
    await pageOwner.goto('/register');
    await pageOwner.getByLabel(/full name/i).fill('Board Owner');
    await pageOwner.getByLabel(/email/i).fill(ownerEmail);
    await pageOwner.getByLabel(/password/i).fill(password);
    await pageOwner.getByRole('button', { name: /sign up|create account/i }).click();
    await expect(pageOwner).toHaveURL(/\/dashboard/, { timeout: 15000 });

    // 2. Create Project
    await pageOwner.goto('/projects/new');
    await pageOwner.getByLabel(/name/i).fill('Kanban Project');
    await pageOwner.getByLabel(/description/i).fill('Testing board drag and drop');
    await pageOwner.getByRole('button', { name: /create project/i }).click();
    await expect(pageOwner).toHaveURL(/\/projects\/[a-zA-Z0-9_-]+$/, { timeout: 15000 });

    const projectUrl = pageOwner.url();
    const projectId = projectUrl.split('/').pop()!;

    // 3. Register Member (Context Member)
    const contextMember = await browser.newContext();
    await contextMember.addCookies([
      { name: 'tf-locale', value: 'en', url: 'http://localhost:3456' },
      { name: 'tf-theme', value: 'light', url: 'http://localhost:3456' },
    ]);
    const pageMember = await contextMember.newPage();

    await pageMember.goto('/register');
    await pageMember.getByLabel(/full name/i).fill('Board Member');
    await pageMember.getByLabel(/email/i).fill(memberEmail);
    await pageMember.getByLabel(/password/i).fill(password);
    await pageMember.getByRole('button', { name: /sign up|create account/i }).click();
    await expect(pageMember).toHaveURL(/\/dashboard/, { timeout: 15000 });

    // 4. Owner adds Member to Project
    await pageOwner.goto(`/projects/${projectId}/settings`);
    await pageOwner.getByPlaceholder('colleague@example.test').fill(memberEmail);
    await pageOwner.getByRole('button', { name: /add member/i }).click();
    await expect(pageOwner.getByText('Board Member')).toBeVisible({ timeout: 10000 });

    // 5. Owner creates a task in To do (assigned to Owner)
    await pageOwner.goto(`/projects/${projectId}`);
    await pageOwner.getByTestId('project-new-task-btn').click();
    await pageOwner.getByLabel(/title/i).fill('Card to Drag');
    await pageOwner.getByTestId('save-task-btn').click();
    await expect(pageOwner.getByText('Card to Drag')).toBeVisible({ timeout: 10000 });

    // 6. Switch to Board view
    const boardSwitchBtn = pageOwner.getByTestId('view-switch-board');
    await expect(boardSwitchBtn).toBeVisible();
    await boardSwitchBtn.click();
    await expect(pageOwner.getByTestId('task-board-view')).toBeVisible();

    // 7. Verify view preference persists after reload
    await pageOwner.reload();
    await expect(pageOwner.getByTestId('task-board-view')).toBeVisible();

    // 8. Drag card from To do column to Done column
    const todoColumn = pageOwner.getByTestId('board-column-todo');
    const doneDropzone = pageOwner.getByTestId('board-column-dropzone-done');
    const taskCard = todoColumn.locator('[data-testid^="board-task-card-"]').first();

    await taskCard.dragTo(doneDropzone);

    // Verify task is now in Done column
    const doneColumn = pageOwner.getByTestId('board-column-done');
    await expect(doneColumn.getByText('Card to Drag')).toBeVisible({ timeout: 10000 });

    // Verify status persists after page reload
    await pageOwner.reload();
    await expect(pageOwner.getByTestId('board-column-done').getByText('Card to Drag')).toBeVisible({ timeout: 10000 });

    // 9. Member visits project: Member is neither owner nor assignee of this task
    await pageMember.goto(`/projects/${projectId}`);
    await pageMember.getByTestId('view-switch-board').click();
    const memberCard = pageMember.getByTestId('board-column-done').locator('[data-testid^="board-task-card-"]').first();
    await expect(memberCard).toHaveAttribute('draggable', 'false');
    await expect(memberCard).toHaveAttribute('aria-disabled', 'true');

    // Clean up
    await contextOwner.close();
    await contextMember.close();
  });
});
