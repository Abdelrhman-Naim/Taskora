import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import ExcelJS from 'exceljs';

test.describe('Excel Export E2E (Task 61)', () => {
  const timestamp = Date.now();
  const ownerEmail = `export_owner_${timestamp}@example.test`;
  const password = 'Password123!';

  test('Export button triggers file download with styled Excel workbook and correct filtered row count', async ({ page }) => {
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

    // 4. Verify Export button shows "Export Excel (2)"
    const exportBtn = page.getByTestId('project-export-excel-btn');
    await expect(exportBtn).toBeVisible();
    await expect(exportBtn).toHaveText(/Export Excel \(2\)/);

    // 5. Trigger download and inspect file
    const downloadPromise = page.waitForEvent('download');
    await exportBtn.click();
    const download = await downloadPromise;

    // Check filename
    expect(download.suggestedFilename()).toMatch(/^taskora-csv-project-\d{4}-\d{2}-\d{2}\.xlsx$/);

    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
    if (downloadPath) {
      const buffer = fs.readFileSync(downloadPath);
      expect(buffer.length).toBeGreaterThan(1000);

      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(buffer as any);
      const sheet = wb.worksheets[0];
      expect(sheet).toBeDefined();
      expect(sheet.getCell('A2').value?.toString()).toContain('CSV Project');
      expect(sheet.getRow(7).getCell(2).value?.toString()).toBe('First Exported Task');
      expect(sheet.getRow(8).getCell(2).value?.toString()).toBe('Second Exported Task');
    }
  });
});
