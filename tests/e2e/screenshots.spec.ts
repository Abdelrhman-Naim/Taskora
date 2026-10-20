import { test, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Documentation Screenshots Capture', () => {
  const screenshotsDir = path.resolve(process.cwd(), 'docs', 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const saveShot = async (targetPage: Page, filename: string) => {
    const buffer = await targetPage.screenshot({ fullPage: false });
    const targetPath = path.join(screenshotsDir, filename);
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        fs.writeFileSync(targetPath, buffer);
        break;
      } catch (err) {
        if (attempt === 2) throw err;
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  };

  test('Capture all required product screenshots (>= 5 screens)', async ({ browser }) => {
    const timestamp = Date.now();
    const ownerEmail = `screen_owner_${timestamp}@example.test`;
    const memberEmail = `screen_member_${timestamp}@example.test`;
    const password = 'Password123!';

    // 1. Desktop context
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    await context.addCookies([
      { name: 'tf-locale', value: 'en', url: 'http://localhost:3456' },
      { name: 'tf-theme', value: 'light', url: 'http://localhost:3456' },
    ]);
    const page = await context.newPage();

    // Screen 1: Login Page
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    await saveShot(page, '01-login.png');

    // Register Member
    const memberContext = await browser.newContext();
    const memberPage = await memberContext.newPage();
    await memberPage.goto('/register');
    await memberPage.getByLabel(/full name/i).fill('Sarah Developer');
    await memberPage.getByLabel(/email/i).fill(memberEmail);
    await memberPage.getByLabel(/password/i).fill(password);
    await memberPage.getByRole('button', { name: /sign up|create account/i }).click();
    await memberPage.waitForURL('**/dashboard');
    await memberContext.close();

    // Register Owner
    await page.goto('/register');
    await page.getByLabel(/full name/i).fill('Alex Product Lead');
    await page.getByLabel(/email/i).fill(ownerEmail);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /sign up|create account/i }).click();
    await page.waitForURL('**/dashboard');

    // Create Demo Project
    await page.getByRole('link', { name: /\+? ?new project/i }).first().click();
    await page.waitForURL('**/projects/new');
    await page.getByLabel(/project name/i).fill('Website Redesign');
    await page.getByLabel(/description/i).fill('Company website overhaul with responsive design and modern UX');
    await page.getByRole('button', { name: /create project|save project/i }).click();
    await page.waitForURL(/\/projects\/(?!new(?:$|[?#]))[a-zA-Z0-9_-]+/);

    const projectId = page.url().split('/projects/')[1].split(/[?#]/)[0];

    // Add Member
    await page.goto(`/projects/${projectId}/settings`);
    await page.getByLabel(/member email/i).fill(memberEmail);
    await page.getByRole('button', { name: /add member/i }).click();
    await page.locator(`text=Sarah Developer`).waitFor({ state: 'visible' });

    // Screen 2: Project Settings & Team Members
    await saveShot(page, '05-project-settings.png');

    // Go to project and create 4 tasks (Appendix A)
    await page.goto(`/projects/${projectId}`);

    // Task 1: Build navbar
    await page.getByTestId('project-new-task-btn').click();
    await page.getByLabel(/title/i).fill('Build navbar');
    await page.getByLabel(/description/i).fill('Create responsive top navigation component');
    await page.locator('#task-priority').selectOption('high');
    await page.locator('#task-assignee').selectOption({ label: 'Sarah Developer' });
    await page.getByTestId('save-task-btn').click();
    await page.locator('text=Build navbar').waitFor({ state: 'visible' });

    // Task 2: Fix overdue bug
    await page.getByTestId('project-new-task-btn').click();
    await page.getByLabel(/title/i).fill('Fix overdue bug');
    await page.getByLabel(/description/i).fill('Critical authentication bug in navigation bar');
    await page.locator('#task-priority').selectOption('high');
    await page.locator('#task-assignee').selectOption({ label: 'Sarah Developer' });
    await page.locator('#task-due-date').fill('2026-10-16');
    await page.getByTestId('save-task-btn').click();
    await page.locator('text=Fix overdue bug').waitFor({ state: 'visible' });

    // Task 3: Setup Database
    await page.getByTestId('project-new-task-btn').click();
    await page.getByLabel(/title/i).fill('Setup Database');
    await page.getByLabel(/description/i).fill('Configure Firestore collections and security rules');
    await page.locator('#task-priority').selectOption('medium');
    await page.locator('#task-assignee').selectOption({ label: 'Sarah Developer' });
    await page.getByTestId('save-task-btn').click();
    await page.locator('text=Setup Database').waitFor({ state: 'visible' });

    // Task 4: Write Documentation
    await page.getByTestId('project-new-task-btn').click();
    await page.getByLabel(/title/i).fill('Write Documentation');
    await page.getByLabel(/description/i).fill('API architecture and deployment guidelines');
    await page.locator('#task-priority').selectOption('low');
    await page.getByTestId('save-task-btn').click();
    await page.locator('text=Write Documentation').waitFor({ state: 'visible' });

    // Screen 3: Project Detail & Task Board
    await saveShot(page, '03-project-tasks.png');

    // Screen 4: Task Filtering & Search
    await page.locator('#filter-search').fill('navbar');
    await page.waitForTimeout(400);
    await saveShot(page, '04-task-filters.png');
    await page.locator('#filter-search').fill('');

    // Screen 5: Dashboard with statistics and overdue tasks
    await page.goto('/dashboard');
    await page.getByText('Website Redesign').first().waitFor({ state: 'visible' });
    await saveShot(page, '02-dashboard.png');

    // Screen 6: Mobile Responsive view (375px)
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 667 },
      isMobile: true,
    });
    await mobileContext.addCookies([
      { name: 'tf-locale', value: 'en', url: 'http://localhost:3456' },
      { name: 'tf-theme', value: 'light', url: 'http://localhost:3456' },
    ]);
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto('/login');
    await mobilePage.getByLabel(/email/i).fill(ownerEmail);
    await mobilePage.getByLabel(/password/i).fill(password);
    await mobilePage.getByRole('button', { name: /log in|sign in/i }).click();
    await mobilePage.waitForURL('**/dashboard');
    await mobilePage.goto(`/projects/${projectId}`);
    await mobilePage.locator('text=Build navbar').waitFor({ state: 'visible' });
    await saveShot(mobilePage, '06-mobile-375px.png');

    await context.close();
    await mobileContext.close();
  });
});
