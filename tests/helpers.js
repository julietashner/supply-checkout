import { expect } from "@playwright/test";
import { page as document } from "../scripts/page.mjs";
import { installMockClaude } from "./mock-claude.js";

const ORIGIN = "https://supply-checkout.test/";

export async function openApp(page, opts = {}) {
  // Keep tests hermetic: no fonts or CDN scripts. The app works without ZXing.
  await page.route(/fonts\.(googleapis|gstatic)\.com|cdn\.jsdelivr\.net/, (r) => r.abort());
  await page.route(ORIGIN, (r) => r.fulfill({ contentType: "text/html", body: document }));
  await page.addInitScript(installMockClaude, opts);
  await page.goto(ORIGIN);
}

export async function createSheet(page, client) {
  await page.getByRole("button", { name: "+ New sheet" }).click();
  await page.getByLabel("Client", { exact: true }).fill(client);
  await page.getByRole("button", { name: "Create sheet" }).click();
  await expect(page.getByRole("heading", { name: client })).toBeVisible();
}

export async function enterBarcode(page, code) {
  await page.getByPlaceholder("Or type the barcode").fill(code);
  await page.getByPlaceholder("Or type the barcode").press("Enter");
}

export const modal = (page) => page.locator("#modal");
export const lineRow = (page, name) => page.locator("#sheetBody tbody tr", { hasText: name });
export const inventoryRow = (page, name) => page.locator("#main tbody tr", { hasText: name });
