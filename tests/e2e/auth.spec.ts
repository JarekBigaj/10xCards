import { test, expect } from "@playwright/test";
import { AuthPage } from "./page-objects/auth.page";

test.describe("Authentication", () => {
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    await authPage.goto();
  });

  test("should display login form", async () => {
    await expect(authPage.emailInput).toBeVisible();
    await expect(authPage.passwordInput).toBeVisible();
    await expect(authPage.loginButton).toBeVisible();
  });

  test("should show error for invalid credentials", async () => {
    await authPage.login("invalid@example.com", "wrongpassword");

    await authPage.expectErrorMessage("Invalid login credentials");
  });

  test("should redirect to dashboard after successful login", async () => {
    // Note: This test would need proper test user setup
    await authPage.login("test@example.com", "password123");

    await authPage.expectLoginSuccess();
  });

  test("should allow user to navigate between login and register", async ({ page }) => {
    await page.getByRole("link", { name: /register/i }).click();
    await expect(page).toHaveURL("/auth/register");

    await page.getByRole("link", { name: /login/i }).click();
    await expect(page).toHaveURL("/auth/login");
  });
});
