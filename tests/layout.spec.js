import { test, expect, openApp } from "./helpers.js";
import { usedState, fakeImage } from "./fixtures.js";

// The page body must never scroll sideways on a phone; only tables may, inside their own container.
async function expectNoSideways(page) {
  const { overflow, culprits } = await page.evaluate(() => {
    const width = window.innerWidth;
    const culprits = [...document.querySelectorAll("body *")]
      .filter((el) => el.getBoundingClientRect().right > width + 0.5 && !el.closest(".table-wrap, [hidden]"))
      .slice(-5)
      .map((el) => `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}${el.className ? "." + String(el.className).trim().replace(/\s+/g, ".") : ""}`);
    return { overflow: document.documentElement.scrollWidth - width, culprits };
  });
  expect(overflow, `horizontal overflow in px; elements past the edge: ${culprits.join(", ")}`).toBeLessThanOrEqual(0);
}

// Fallback fonts differ by OS and some are much wider (Linux CI uses DejaVu).
// Force a wide font so the check doesn't depend on which machine runs it.
const wideFont = "*{font-family:Verdana,'DejaVu Sans',sans-serif !important}";

for (const width of [320, 390]) {
  test.describe(`phone layout at ${width}px`, () => {
    test.use({ viewport: { width, height: 740 } });

    test("every screen fits the width", async ({ page }) => {
      await openApp(page, usedState);
      await page.addStyleTag({ content: wideFont });
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
