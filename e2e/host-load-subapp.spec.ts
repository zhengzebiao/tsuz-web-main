import { expect, test, type Page } from "@playwright/test";

test.skip(
  process.env.MFE_INTEGRATION_E2E !== "true",
  "Run this spec through validate-generated-apps after starting both generated MFE dev servers."
);

test("loads the generated sub application through qiankun", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /登\s*录/ }).click();

  await navigateSpa(page, "/app/admin");
  await expect(page).toHaveURL(/\/app\/admin$/);
  await expect(page.getByRole("heading", { name: "Business home" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Mounted by host")).toBeVisible();
  await expect(page.getByText("qiankun mount")).toBeVisible();
  await expect(page.getByText("Auth bridge: provided")).toBeVisible();
  await expect(page.getByText("Current user: Demo Admin")).toBeVisible();

  await page.getByRole("link", { name: "About" }).click();

  await expect(page).toHaveURL(/\/app\/admin\/about$/);
  await expect(page.getByText("Integration notes")).toBeVisible();
  await expect(page.getByText("Router basename: /app/admin")).toBeVisible();

  await page.goto("/app/admin-legacy");

  await expect(page.getByText("qiankun mount")).toHaveCount(0);
  await expect(page.getByText("Business home")).toHaveCount(0);
});

async function navigateSpa(page: Page, path: string) {
  await page.evaluate((nextPath) => {
    window.history.pushState({}, "", nextPath);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, path);
}
