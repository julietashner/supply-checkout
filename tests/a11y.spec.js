import AxeBuilder from "@axe-core/playwright";
import { test, expect, openApp, modal } from "./helpers.js";
import { usedState, fakeImage } from "./fixtures.js";

async function expectAccessible(page) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const summary = violations.map((v) => `${v.id}: ${v.help} → ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
  expect(summary).toEqual([]);
}

for (const colorScheme of ["light", "dark"]) {
  test.describe(`accessibility (${colorScheme})`, () => {
    // Reduced motion: check the dialog at rest, not mid fade-in
    test.use({ colorScheme, reducedMotion: "reduce" });

    test("sheet list", async ({ page }) => {
      await openApp(page, usedState);
      await expect(page.getByRole("button", { name: /Echo Studio/ })).toBeVisible();
      await expectAccessible(page);
    });

    test("sheet detail and checkout dialog", async ({ page }) => {
      await openApp(page, usedState);
      await page.getByRole("button", { name: /Echo Studio/ }).click();
      await expect(page.locator("#sheetBody tbody tr")).toHaveCount(2);
      await expectAccessible(page);

      await page.getByPlaceholder("Or type the barcode").fill("SKU1");
      await page.getByPlaceholder("Or type the barcode").press("Enter");
      await expect(modal(page).getByRole("heading", { name: "Check out" })).toBeVisible();
      await expectAccessible(page);
    });

    test("inventory", async ({ page }) => {
      await openApp(page, usedState);
      await page.getByRole("button", { name: "Inventory" }).click();
      await expect(page.locator("#main tbody tr")).toHaveCount(2);
      await expectAccessible(page);
    });

    test("receipt review", async ({ page }) => {
      await openApp(page, usedState);
      await page.setInputFiles("#receiptFile", fakeImage);
      await expect(page.getByRole("heading", { name: "Review receipt" })).toBeVisible();
      await expectAccessible(page);
    });
  });
}
