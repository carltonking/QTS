import { test, expect } from "@playwright/test";

test.describe("Smoke tests", () => {
  test("home page loads and shows navigation", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("nav")).toBeVisible();
    await expect(
      page
        .locator(
          'a[href*="chess"], a[href*="poker"], a[href*="math"], a[href*="quant"], a[href*="leetcode"]',
        )
        .first(),
    ).toBeVisible();
  });

  test("login page has email and password fields", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("register page has required fields", async ({ page }) => {
    await page.goto("/register");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(
      page.getByRole("button", { name: /register|sign up/i }),
    ).toBeVisible();
  });

  test("chess module page loads", async ({ page }) => {
    await page.goto("/chess");
    await expect(
      page
        .locator("h2, h1")
        .filter({ hasText: /chess|puzzle/i })
        .first(),
    ).toBeVisible();
  });

  test("poker module page loads", async ({ page }) => {
    await page.goto("/poker");
    await expect(
      page
        .locator("h2, h1")
        .filter({ hasText: /poker|simulator/i })
        .first(),
    ).toBeVisible();
  });

  test("math module page loads", async ({ page }) => {
    await page.goto("/math");
    await expect(
      page.locator("h2, h1").filter({ hasText: /math/i }).first(),
    ).toBeVisible();
  });

  test("quant module page loads", async ({ page }) => {
    await page.goto("/quant");
    await expect(
      page
        .locator("h2, h1, .category, button")
        .filter({ hasText: /math|probability|finance/i })
        .first(),
    ).toBeVisible();
  });

  test("leetcode problem browser page loads", async ({ page }) => {
    await page.goto("/leetcode");
    await expect(
      page
        .locator("h2, h1")
        .filter({ hasText: /problems|neetcode|leetcode|roadmap/i })
        .first(),
    ).toBeVisible();
  });

  test("404 page shows for unknown routes", async ({ page }) => {
    await page.goto("/this-does-not-exist");
    await expect(
      page
        .locator("h2, h1, p")
        .filter({ hasText: /not found|404/i })
        .first(),
    ).toBeVisible();
  });
});
