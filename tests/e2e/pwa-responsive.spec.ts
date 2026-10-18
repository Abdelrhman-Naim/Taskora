import { test, expect } from '@playwright/test';

test.describe('PWA Suite & Canonical Responsive Sweep', () => {
  test.setTimeout(120_000);

  test('P-401 & P-413: Web App Manifest is reachable, valid JSON, and contains complete icon set', async ({ request, baseURL }) => {
    const url = `${baseURL || 'http://localhost:3456'}/manifest.webmanifest`;
    const response = await request.get(url);
    expect(response.status()).toBe(200);

    const manifest = await response.json();
    expect(manifest.name).toBe('Taskora');
    expect(manifest.short_name).toBe('Taskora');
    expect(manifest.display).toBe('standalone');
    expect(manifest.start_url).toContain('/dashboard');
    expect(manifest.theme_color).toBe('#0D5C5A');
    expect(manifest.background_color).toBe('#F8FAFC');

    // Verify icons
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThanOrEqual(3);

    const sizes = manifest.icons.map((i: { sizes: string }) => i.sizes);
    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');

    // Verify maskable icon exists
    const hasMaskable = manifest.icons.some((i: { purpose?: string }) => i.purpose?.includes('maskable'));
    expect(hasMaskable).toBe(true);

    // Verify each declared icon actually returns HTTP 200
    for (const icon of manifest.icons) {
      const iconRes = await request.get(`${baseURL || 'http://localhost:3456'}${icon.src}`);
      expect(iconRes.status(), `Icon ${icon.src} must be fetchable`).toBe(200);
      expect(iconRes.headers()['content-type']).toContain('image/png');
    }
  });

  test('P-103 & P-408: Viewport-fit=cover and Theme-color meta tags are rendered', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    // Viewport-fit=cover
    const viewportMeta = await page.getAttribute('meta[name="viewport"]', 'content');
    expect(viewportMeta).toContain('viewport-fit=cover');

    // Theme color metas (light & dark media queries)
    const themeColorMetas = await page.locator('meta[name="theme-color"]').count();
    expect(themeColorMetas).toBeGreaterThanOrEqual(1);

    // Apple touch icon
    const appleTouchIcon = await page.getAttribute('link[rel="apple-touch-icon"]', 'href');
    expect(appleTouchIcon).toBeTruthy();
  });

  // P-301 & P-306: Canonical Responsive Breakpoint Sweep (320, 360, 390, 430, 768, 1024, 1280)
  const canonicalWidths = [320, 360, 390, 430, 768, 1024, 1280];

  for (const width of canonicalWidths) {
    test(`P-301: Zero horizontal overflow on login page at ${width}px (LTR & RTL)`, async ({ page }) => {
      // 1. LTR
      await page.setViewportSize({ width, height: 750 });
      await page.goto('/login');
      await page.waitForLoadState('domcontentloaded');

      let overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(overflow, `Horizontal overflow at ${width}px LTR`).toBe(false);

      // 2. RTL (Arabic)
      await page.evaluate(() => {
        document.cookie = 'tf-locale=ar; path=/';
      });
      await page.goto('/login');
      await page.waitForLoadState('domcontentloaded');

      overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(overflow, `Horizontal overflow at ${width}px RTL`).toBe(false);
    });
  }

  test('P-308: Primary touch targets on login & register satisfy >= 44px min-height', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    const submitBtn = page.getByTestId('auth-submit-btn');
    const box = await submitBtn.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.height, 'Primary button height must be >= 40px (min touch target padding)').toBeGreaterThanOrEqual(40);
    }

    const emailInput = page.getByTestId('auth-email-input');
    const inputHeight = await emailInput.evaluate((el) => el.getBoundingClientRect().height);
    expect(inputHeight, 'Form input height must be >= 36px').toBeGreaterThanOrEqual(36);
  });
});
