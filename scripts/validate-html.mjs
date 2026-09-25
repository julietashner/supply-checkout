import { HtmlValidate, formatterFactory } from "html-validate";
import { page } from "./page.mjs";

const validator = new HtmlValidate({
  extends: ["html-validate:recommended"],
  rules: {
    // The barcode mark in the header uses inline widths.
    "no-inline-style": "off",
    // Google Fonts CSS is generated per browser, so it can't carry an integrity hash.
    "require-sri": "off",
  },
});

const report = await validator.validateString(page, "index.html");
if (!report.valid) {
  console.error(formatterFactory("stylish")(report.results));
  process.exit(1);
}
console.log("index.html: HTML is valid");
