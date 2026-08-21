import { expect, test } from "@playwright/test";

test("logs in, visits the application center and can manage the profile", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByText("演示账号")).toBeVisible();
  await expect(page.locator("#username")).toHaveValue("admin");
  await expect(page.locator("#password")).toHaveValue("password123");

  await page.getByRole("button", { name: /登\s*录/ }).click();

  await expect(page).toHaveURL(/\/apps$/);
  await expect(page.getByRole("heading", { name: "应用中心" })).toBeVisible();
  await expect(page.getByText("数据分析")).toBeVisible();
  await expect(page.getByText("权限管理")).toBeVisible();

  await page.getByRole("button", { name: "打开admin用户菜单" }).click();
  await page.getByText("个人中心").click();
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByRole("heading", { name: "个人中心" })).toBeVisible();
  await expect(page.getByText("Demo Admin")).toBeVisible();

  await page.getByRole("button", { name: "打开admin用户菜单" }).click();
  await page.getByText("退出登录").click();
  await expect(page).toHaveURL(/\/login$/);
});
