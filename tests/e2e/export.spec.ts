import { test, expect } from '@playwright/test';
import * as fs from 'fs';

test.describe('CSV Export E2E (Task 61)', () => {
  const timestamp = Date.now();
  const ownerEmail = `export_owner_${timestamp}@example.test`;
  const password = 'Password123!';

  test('Export button triggers file download with UTF-8 BOM and correct filtered row count', async ({ page }) => {
    await page.context().addCookies([
      { name: 'tf-locale', value: 'en', url: 'http://localhost:3456' },
      { name: 'tf-theme', value: 'light', url: 'http://localhost:3456' },
    ]);

    // 1. Register Owner
    await page.goto('/register');
    await page.getByLabel(/full name/i).fill('Export Tester');
    await page.getByLabel(/email/i).fill(ownerEmail);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /sign up|create account/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

    // 2. Create Project
    await page.goto('/projects/new');
    await page.getByLabel(/name/i).fill('CSV Project');
    await page.getByLabel(/description/i).fill('Testing export');
    await page.getByRole('button', { name: /create project/i }).click();
    await expect(page).toHaveURL(/\/projects\/(?!new(?:$|[?#]))[a-zA-Z0-9_-]+$/, { timeout: 15000 });

    const projectUrl = page.url();
    const projectId = projectUrl.split('/').pop()!;

    // 3. Create two tasks
    await page.goto(`/projects/${projectId}`);
    await page.getByTestId('project-new-task-btn').click();
    await page.getByLabel(/title/i).fill('First Exported Task');
    await page.getByTestId('save-task-btn').click();
    await expect(page.getByText('First Exported Task')).toBeVisible({ timeout: 10000 });

    await page.getByTestId('project-new-task-btn').click();
    await page.getByLabel(/title/i).fill('Second Exported Task');
    await page.getByTestId('save-task-btn').click();
    await expect(page.getByText('Second Exported Task')).toBeVisible({ timeout: 10000 });

    // 4. Verify Export button shows "Export (2)"
    const exportBtn = page.getByTestId('project-export-csv-btn');
    await expect(exportBtn).toBeVisible();
    await expect(exportBtn).toHaveText(/Export \(2\)/);

    // 5. Trigger download and inspect file
    const downloadPromise = page.waitForEvent('download');
    await exportBtn.click();
    const download = await downloadPromise;

    // Check filename
    expect(download.suggestedFilename()).toMatch(/^taskora-csv-project-\d{4}-\d{2}-\d{2}\.csv$/);

    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
    if (downloadPath) {
      const buffer = fs.readFileSync(downloadPath);
      // UTF-8 BOM is 0xEF, 0xBB, 0xBF
      expect(buffer[0]).toBe(0xef);
      expect(buffer[1]).toBe(0xbb);
      expect(buffer[2]).toBe(0xbf);

      const content = buffer.toString('utf-8');
      const lines = content.replace('\uFEFF', '').trim().split('\r\n');
      // 1 header row + 2 task rows = 3 lines
      expect(lines.length).toBe(3);
      expect(lines[0]).toContain('Title');
      expect(content).toContain('First Exported Task');
      expect(content).toContain('Second Exported Task');
    }
  });
});
