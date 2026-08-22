import { expect, test } from "@playwright/test";

const testEmail = "admin@example.com";
const testPassword = "password123";

test("logs in, visits the application center and can manage the profile", async ({ page }) => {
  await page.route("**/api/auth/email/login", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        access_token: "e2e-access-token",
        refresh_token: "e2e-refresh-token",
        token_type: "Bearer",
        expires_in: 3600
      })
    });
  });
  await page.route("**/api/auth/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ id: "e2e-user", username: testEmail, roles: ["admin"] })
    });
  });
  await page.route("**/api/auth/logout", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ message: "Logged out" })
    });
  });

  await page.goto("/login");

  await expect(page.getByLabel("邮箱")).toHaveValue(testEmail);
  await expect(page.locator("#password")).toHaveValue(testPassword);

  await page.getByRole("button", { name: /登\s*录/ }).click();

  await expect(page).toHaveURL(/\/apps$/);
  await expect(page.getByRole("heading", { name: "应用中心" })).toBeVisible();
  await expect(page.getByText("数据分析")).toBeVisible();
  await expect(page.getByText("权限管理")).toBeVisible();

  await page.getByRole("button", { name: `打开${testEmail}用户菜单` }).click();
  await page.getByText("个人中心").click();
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByRole("heading", { name: "个人中心" })).toBeVisible();
  await expect(page.getByRole("heading", { name: testEmail })).toBeVisible();

  await page.getByRole("button", { name: `打开${testEmail}用户菜单` }).click();
  await page.getByText("退出登录").click();
  await expect(page).toHaveURL(/\/login$/);
});

test("restores an unexpired session after reload without refreshing", async ({ page }) => {
  let refreshCalls = 0;

  await page.route("**/api/auth/refresh", async (route) => {
    refreshCalls += 1;
    await route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ message: "Unexpected refresh" }) });
  });

  await page.addInitScript(() => {
    window.sessionStorage.setItem(
      "tsuz.auth.session",
      JSON.stringify({
        accessToken: "e2e-access-token",
        refreshToken: "e2e-refresh-token",
        expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
        user: {
          id: "e2e-user",
          name: "admin@example.com",
          username: "admin@example.com",
          roles: ["admin"],
          permissions: []
        }
      })
    );
  });

  await page.goto("/apps");
  await expect(page.getByRole("heading", { name: "应用中心" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "应用中心" })).toBeVisible();

  expect(refreshCalls).toBe(0);
});
