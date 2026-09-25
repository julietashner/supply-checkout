import { test, expect, openApp } from "./helpers.js";
import { usedState, fakeImage } from "./fixtures.js";

// The page body must never scroll sideways on a phone; only tables may, inside their own container.
async function expectNoSideways(page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, "horizontal overflow in px").toBeLessThanOrEqual(0);
}

for (const width of [320, 390]) {
  test.describe(`phone layout at ${width}px`, () => {
    test.use({ viewport: { width, height: 740 } });

    test("every screen fits the width", async ({ page }) => {
      await openApp(page, usedState);
      await expect(page.getByRole("button", { name: /Echo Studio/ })).toBeVisible();
      await expectNoSideways(page);

      await page.getByRole("button", { name: /Echo Studio/ }).click();
      await expect(page.locator("#sheetBody tbody tr")).toHaveCount(2);
      await expectNoSideways(page);

      await page.getByRole("button", { name: "Inventory" }).click();
      await expect(page.locator("#main tbody tr")).toHaveCount(2);
      await expectNoSideways(page);

      await page.getByRole("button", { name: "Sheets" }).click();
      await page.setInputFiles("#receiptFile", fakeImage);
      await expect(page.getByRole("heading", { name: "Review receipt" })).toBeVisible();
      await expectNoSideways(page);
    });
  });
}
