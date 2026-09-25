// index.html is a page fragment: claude.ai wraps it in a document skeleton at
// publish time. This builds the same full document for validation and tests.
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const split = source.indexOf('<div class="wrap">');
if (split < 0) throw new Error('index.html is missing <div class="wrap">');

export const page = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
${source.slice(0, split).trim()}
</head>
<body>
${source.slice(split).trim()}
</body>
</html>
`;
