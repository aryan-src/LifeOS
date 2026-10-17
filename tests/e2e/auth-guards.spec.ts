import { test, expect } from '@playwright/test';

const PROTECTED_ROUTES = [
  '/dashboard',
  '/tasks',
  '/projects',
  '/finances',
  '/notes',
  '/assignments',
  '/habits',
  '/settings',
];

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/privacy',
  '/license',
  '/changelog',
  '/robots.txt',
  '/sitemap.xml',
];

test.describe('Unauthenticated Route Guards (E2E)', () => {
  for (const route of PROTECTED_ROUTES) {
    test(`visiting protected route "${route}" redirects to /login?redirectTo=...`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(new RegExp(`/login\\?redirectTo=${encodeURIComponent(route)}`));
    });
  }

  for (const route of PUBLIC_ROUTES) {
    test(`visiting public route "${route}" renders with 200 OK`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
      expect(page.url()).not.toContain('/login?redirectTo');
    });
  }
});
