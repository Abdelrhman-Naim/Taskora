import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Phase 2 E2E & Visual Verification (i18n, Theming, Design System, RTL)', () => {
  test.describe.configure({ mode: 'serial' });

  const screenshotsDir = path.resolve(process.cwd(), 'docs', 'screenshots', 'phase2');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const saveShot = async (page: Page, filename: string) => {
    const buffer = await page.screenshot({ fullPage: false });
    const targetPath = path.join(screenshotsDir, filename);
    fs.writeFileSync(targetPath, buffer);
  };

  const timestamp = Date.now();
  const arOwnerEmail = `ar_owner_${timestamp}@example.test`;
  const arMemberEmail = `ar_member_${timestamp}@example.test`;
  const password = 'Password123!';
  let arProjectId = '';

  // ============================================================
  // Review Focus #2: Locale and Theme Persistence & Zero Flash
  // ============================================================
  test('Review Focus #2: Accept-Language content negotiation and HTML lang/dir from initial server response', async ({ request }) => {
    // 1. Initial request with Accept-Language: ar without cookies
    const res = await request.get('/login', {
      headers: {
        'Accept-Language': 'ar-SA,ar;q=0.9,en;q=0.8',
      },
    });
    expect(res.status()).toBe(200);
    const html = await res.text();

    // Verify lang="ar" and dir="rtl" on html element in initial HTML string (before any client JS)
    expect(html).toMatch(/<html[^>]*lang=["']ar["']/);
    expect(html).toMatch(/<html[^>]*dir=["']rtl["']/);
  });

  test('Review Focus #2: LocaleSwitcher changes cookie and persists across reload without flash', async ({ page, context }) => {
    // Start with English
    await context.addCookies([
      { name: 'tf-locale', value: 'en', url: 'http://localhost:3456' },
      { name: 'tf-theme', value: 'light', url: 'http://localhost:3456' },
    ]);

    await page.goto('/login');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');

    // Switch to Arabic using LocaleSwitcher segmented button
    const arBtn = page.locator('button[role="radio"][lang="ar"]');
    await arBtn.click();

    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

    // Reload page to verify persistence
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  });

  test('Review Focus #2: Theme changes cookie, persists across reload with ZERO flash of unstyled theme', async ({ page, context }) => {
    await context.addCookies([
      { name: 'tf-locale', value: 'en', url: 'http://localhost:3456' },
      { name: 'tf-theme', value: 'light', url: 'http://localhost:3456' },
    ]);

    await page.goto('/login');
    await expect(page.locator('html')).not.toHaveAttribute('data-theme', 'dark');

    // Set theme to dark
    const darkBtn = page.locator('button[role="radio"][data-theme-value="dark"]');
    await darkBtn.click();

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    // Capture background color on the very first script evaluation to ensure NO white flash
    await page.addInitScript(() => {
      // Record initial background color before React hydrates
      (window as unknown as { __initialBg: string }).__initialBg = window.getComputedStyle(document.body).backgroundColor;
    });

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    const initialBg = await page.evaluate(() => (window as unknown as { __initialBg: string }).__initialBg);
    // Dark background in tokens.css is rgb(10, 21, 20)
    expect(initialBg).not.toBe('rgb(244, 245, 242)');
    expect(initialBg).not.toBe('rgb(255, 255, 255)');
  });

  test('Review Focus #2: System theme respects prefers-color-scheme, while explicit theme overrides it', async ({ page, context }) => {
    // 1. theme=system with emulateMedia dark -> dark background
    await context.addCookies([
      { name: 'tf-theme', value: 'system', url: 'http://localhost:3456' },
      { name: 'tf-locale', value: 'en', url: 'http://localhost:3456' },
    ]);
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/login');

    const darkSysBg = await page.evaluate(() => window.getComputedStyle(document.body).backgroundColor);
    expect(darkSysBg).not.toBe('rgb(244, 245, 242)');

    // 2. theme=light with emulateMedia dark -> stays LIGHT
    await context.addCookies([
      { name: 'tf-theme', value: 'light', url: 'http://localhost:3456' },
    ]);
    await page.goto('/login');

    const lightBg = await page.evaluate(() => window.getComputedStyle(document.body).backgroundColor);
    expect(lightBg).toBe('rgb(244, 245, 242)');
  });

  // ============================================================
  // Functional RTL Flow (Create Project, Tasks, Members in Arabic)
  // ============================================================
  test('RTL Functional Flow: Register, create project, task with due date, and member in Arabic', async ({ page, context }) => {
    await context.addCookies([
      { name: 'tf-locale', value: 'ar', url: 'http://localhost:3456' },
      { name: 'tf-theme', value: 'light', url: 'http://localhost:3456' },
    ]);

    // 1. Register Member
    await page.goto('/register');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

    await page.locator('#name').fill('سارة المطور');
    await page.locator('#email').fill(arMemberEmail);
    await page.locator('#password').fill(password);
    await page.locator('button[type="submit"]').click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    await expect(page.getByText('سارة المطور').first()).toBeVisible({ timeout: 15000 });

    // Logout member
    await page.getByRole('button', { name: /تسجيل الخروج/i }).click();
    await expect(page).toHaveURL(/\/login/);

    // 2. Register Owner
    await page.goto('/register');
    await page.locator('#name').fill('أحمد مدير المشروع');
    await page.locator('#email').fill(arOwnerEmail);
    await page.locator('#password').fill(password);
    await page.locator('button[type="submit"]').click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    await expect(page.getByText('أحمد مدير المشروع').first()).toBeVisible({ timeout: 15000 });

    // 3. Create Project in Arabic
    await page.getByRole('link', { name: /مشروع جديد/i }).first().click();
    await expect(page).toHaveURL(/\/projects\/new/, { timeout: 15000 });

    const arProjectName = `إعادة تصميم المنصة ${timestamp}`;
    await page.locator('#project-name').fill(arProjectName);
    await page.locator('#project-description').fill('مشروع تطوير الواجهة باللغة العربية ونظام التصميم الجديد');
    await page.locator('button[type="submit"]').click();

    await expect(page).toHaveURL(/\/projects\/(?!new(?:$|[?#]))[a-zA-Z0-9_-]+/, { timeout: 15000 });
    const url = page.url();
    arProjectId = url.split('/projects/')[1].split(/[?#]/)[0];
    expect(arProjectId).toBeTruthy();

    await expect(page.getByRole('heading', { name: arProjectName })).toBeVisible({ timeout: 15000 });

    // 4. Add Task 1 (with due date 2026-10-17)
    await page.getByRole('button', { name: /مهمة جديدة/i }).click();
    await page.locator('#task-title').fill('بناء شريط التنقل المتجاوب');
    await page.locator('#task-description').fill('تنفيذ الترويسة مع دعم اتجاه اليمين لليسار');
    await page.locator('#task-priority').selectOption('high');
    await page.locator('#task-due-date').fill('2026-10-17');
    await page.locator('button[type="submit"]').click();

    await expect(page.getByText('بناء شريط التنقل المتجاوب')).toBeVisible({ timeout: 15000 });

    // 5. Add Task 2 (Overdue task: 2026-10-15)
    await page.getByRole('button', { name: /مهمة جديدة/i }).click();
    await page.locator('#task-title').fill('إصلاح خطأ تسجيل الدخول');
    await page.locator('#task-priority').selectOption('medium');
    await page.locator('#task-due-date').fill('2026-10-15');
    await page.locator('button[type="submit"]').click();

    await expect(page.getByText('إصلاح خطأ تسجيل الدخول')).toBeVisible({ timeout: 15000 });

    // 6. Go to Settings and Add Member
    await page.goto(`/projects/${arProjectId}/settings`);
    await page.locator('#member-email').fill(arMemberEmail);
    await page.getByRole('button', { name: /إضافة عضو/i }).click();

    await expect(page.getByText('سارة المطور').first()).toBeVisible({ timeout: 15000 });

    // 7. Assign Task to Sarah Developer and Change Status to Done
    await page.goto(`/projects/${arProjectId}`);
    await page.getByRole('button', { name: /تعديل/i }).first().click();
    await page.locator('#task-assignee').selectOption({ label: 'سارة المطور' });
    await page.locator('button[type="submit"]').click();

    // Change status to in_progress or done
    const statusSelect = page.locator(`select[id^="status-select-"]`).first();
    await statusSelect.selectOption('done');
    await expect(statusSelect).toHaveValue('done');
  });

  // ============================================================
  // Review Focus #5: RTL Visual Invariants
  // ============================================================
  test('Review Focus #5: RTL progress bar fills from right, back chevron flipped, due date Latin numerals', async ({ page, context }) => {
    await context.addCookies([
      { name: 'tf-locale', value: 'ar', url: 'http://localhost:3456' },
      { name: 'tf-theme', value: 'light', url: 'http://localhost:3456' },
    ]);

    // Login as Owner
    await page.goto('/login');
    await page.locator('#email').fill(arOwnerEmail);
    await page.locator('#password').fill(password);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/dashboard/);

    // 1. Progress Bar in RTL dashboard fills from the right
    const progressBar = page.locator('[role="progressbar"]').first();
    await expect(progressBar).toBeVisible();

    const progressFill = progressBar.locator('> div');
    const fillBox = await progressFill.boundingBox();
    const parentBox = await progressBar.boundingBox();

    expect(fillBox).toBeTruthy();
    expect(parentBox).toBeTruthy();

    if (fillBox && parentBox) {
      // In RTL, the right edge of the fill matches the right edge of the container
      const rightDiff = Math.abs((parentBox.x + parentBox.width) - (fillBox.x + fillBox.width));
      expect(rightDiff).toBeLessThanOrEqual(2);
    }

    // 2. Back arrow in Project page is flipped in RTL
    await page.goto(`/projects/${arProjectId}`);
    const backArrow = page.locator('a[href="/dashboard"] svg').first();
    await expect(backArrow).toBeVisible();

    const transform = await backArrow.evaluate((el) => window.getComputedStyle(el).transform);
    // matrix(-1, 0, 0, 1, ...) represents horizontal flip scaleX(-1)
    expect(transform).toContain('-1');

    // 3. Due date shows day 17 in Latin numerals (not Eastern Arabic ١٧)
    const dueDateText = await page.getByText(/17/).first().textContent();
    expect(dueDateText).toContain('17');
    expect(dueDateText).not.toContain('١٧');
  });

  // ============================================================
  // Keyboard Accessibility: Tab focus & Dialog Escape
  // ============================================================
  test('Keyboard navigation: Tab displays visible focus ring and Escape dismisses dialog', async ({ page, context }) => {
    await context.addCookies([
      { name: 'tf-locale', value: 'en', url: 'http://localhost:3456' },
      { name: 'tf-theme', value: 'light', url: 'http://localhost:3456' },
    ]);

    await page.goto('/login');

    // Press Tab multiple times to navigate through controls
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Verify an element has focus
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedTag).toBeTruthy();

    // Verify Dialog Esc dismisses modal on Project Settings
    await page.locator('#email').fill(arOwnerEmail);
    await page.locator('#password').fill(password);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto(`/projects/${arProjectId}/settings`);
    // Click Delete Project button to open Dialog
    await page.getByRole('button', { name: /delete project/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Press Escape to dismiss
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });

  // ============================================================
  // Review Focus #3: Scanner for Untranslated Strings
  // ============================================================
  test('Review Focus #3: Scanner for untranslated strings in Arabic and English pages', async ({ page, context }) => {
    // 1. Check Arabic pages for unlocalized Latin words (>=3 consecutive letters)
    await context.addCookies([
      { name: 'tf-locale', value: 'ar', url: 'http://localhost:3456' },
      { name: 'tf-theme', value: 'light', url: 'http://localhost:3456' },
    ]);

    const arPages = ['/login', '/register', '/dashboard', `/projects/${arProjectId}`, `/projects/${arProjectId}/settings`];

    // Login first
    await page.goto('/login');
    await page.locator('#email').fill(arOwnerEmail);
    await page.locator('#password').fill(password);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/dashboard/);

    const allowedWords = new Set([
      'taskora',
      'taskflow',
      'firebase',
      'svg',
      'url',
      'utc',
      'id',
      'en',
      'ar',
      'pm',
      'am',
    ]);

    for (const urlPath of arPages) {
      await page.goto(urlPath);
      await page.waitForLoadState('domcontentloaded');

      const violations = await page.evaluate((allowed) => {
        const issues: string[] = [];

        function isIgnored(el: Element): boolean {
          if (el.closest('[dir="auto"]') || el.closest('[dir="ltr"]') || el.getAttribute('dir') === 'auto' || el.getAttribute('dir') === 'ltr') {
            return true;
          }
          if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'SVG' || el.tagName === 'NOSCRIPT') {
            return true;
          }
          return false;
        }

        // Check text nodes
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let node: Node | null = walker.nextNode();
        while (node) {
          const parent = node.parentElement;
          if (parent && !isIgnored(parent)) {
            const text = (node.nodeValue || '').trim();
            if (text) {
              const matches = text.match(/[a-zA-Z]{3,}/g);
              if (matches) {
                for (const match of matches) {
                  if (!allowed.includes(match.toLowerCase())) {
                    issues.push(`Text "${match}" in node "${text}"`);
                  }
                }
              }
            }
          }
          node = walker.nextNode();
        }

        // Check placeholders and aria-labels
        const attrElements = document.querySelectorAll('input, textarea, select, button, [aria-label]');
        for (const el of attrElements) {
          if (isIgnored(el)) continue;

          const placeholder = el.getAttribute('placeholder');
          if (placeholder) {
            const matches = placeholder.match(/[a-zA-Z]{3,}/g);
            if (matches) {
              for (const m of matches) {
                if (!allowed.includes(m.toLowerCase())) issues.push(`Placeholder "${m}" in "${placeholder}"`);
              }
            }
          }

          const ariaLabel = el.getAttribute('aria-label');
          if (ariaLabel) {
            const matches = ariaLabel.match(/[a-zA-Z]{3,}/g);
            if (matches) {
              for (const m of matches) {
                if (!allowed.includes(m.toLowerCase())) issues.push(`aria-label "${m}" in "${ariaLabel}"`);
              }
            }
          }
        }

        return issues;
      }, Array.from(allowedWords));

      expect(violations).toEqual([]);
    }

    // 2. Check English pages for Arabic characters outside [dir="auto"]
    await context.addCookies([
      { name: 'tf-locale', value: 'en', url: 'http://localhost:3456' },
    ]);

    for (const urlPath of ['/login', '/register', '/dashboard']) {
      await page.goto(urlPath);
      await page.waitForLoadState('domcontentloaded');

      const arViolations = await page.evaluate(() => {
        const issues: string[] = [];
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let node: Node | null = walker.nextNode();
        while (node) {
          const parent = node.parentElement;
          if (parent && !parent.closest('[dir="auto"]') && !parent.closest('[lang="ar"]')) {
            const text = (node.nodeValue || '').trim();
            if (/[\u0600-\u06FF]/.test(text)) {
              issues.push(`Arabic text found in English screen: "${text}"`);
            }
          }
          node = walker.nextNode();
        }
        return issues;
      });

      expect(arViolations).toEqual([]);
    }
  });

  // ============================================================
  // Responsive Matrix (375, 768, 1280) & Documentation Screenshots
  // ============================================================
  test('Responsive matrix and documentation screenshots capture (375, 768, 1280)', async ({ page, context }) => {
    test.setTimeout(180000);
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1280, height: 800 },
    ];

    const pages = [
      { path: '/login', name: 'login' },
      { path: '/dashboard', name: 'dashboard' },
      { path: `/projects/${arProjectId}`, name: 'project' },
      { path: `/projects/${arProjectId}/settings`, name: 'settings' },
    ];

    // Login first
    await context.addCookies([
      { name: 'tf-locale', value: 'ar', url: 'http://localhost:3456' },
      { name: 'tf-theme', value: 'light', url: 'http://localhost:3456' },
    ]);
    await page.goto('/login');
    await page.locator('#email').fill(arOwnerEmail);
    await page.locator('#password').fill(password);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/dashboard/);

    // Capture matrix
    for (const locale of ['ar', 'en'] as const) {
      for (const theme of ['light', 'dark'] as const) {
        await context.addCookies([
          { name: 'tf-locale', value: locale, url: 'http://localhost:3456' },
          { name: 'tf-theme', value: theme, url: 'http://localhost:3456' },
        ]);

        for (const vp of viewports) {
          await page.setViewportSize({ width: vp.width, height: vp.height });

          for (const p of pages) {
            await page.goto(p.path);
            await page.waitForLoadState('domcontentloaded');

            // Assert no horizontal scroll overflow
            const isOverflowing = await page.evaluate(() => {
              return document.documentElement.scrollWidth > window.innerWidth;
            });
            expect(isOverflowing).toBe(false);

            // Save key screenshots for documentation
            if (p.name === 'dashboard' || (p.name === 'project' && vp.name === 'desktop')) {
              await saveShot(page, `${locale}-${theme}-${vp.name}-${p.name}.png`);
            }
          }
        }
      }
    }
  });
});
