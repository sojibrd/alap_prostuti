// Runs after `next build`. GitHub Pages can't send headers, so each exported
// page gets a Content-Security-Policy <meta>. Next.js writes a few inline
// <script>s into every page; instead of 'unsafe-inline', each one is allowed by
// its sha256 hash, so no other inline script can run.
import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const OUT = new URL("../out/", import.meta.url);
// Keep in step with apiBase in app/site.ts
const API_ORIGIN = new URL(process.env.NEXT_PUBLIC_API_BASE ?? "https://alap-prostuti-api.onrender.com").origin;
// Google Identity Services, as listed in Google's own CSP guidance
const GSI = "https://accounts.google.com/gsi/";

const INLINE_SCRIPT = /<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g;
const CHARSET_META = /<meta charSet="utf-8"\s*\/?>/i;

function policy(hashes) {
  return [
    "default-src 'self'",
    `script-src 'self' ${GSI}client ${hashes.join(" ")}`,
    // The sign-in button sets inline styles; style injection can't run code
    `style-src 'self' 'unsafe-inline' ${GSI}style`,
    "img-src 'self' data:",
    "font-src 'self'",
    `connect-src 'self' ${API_ORIGIN} ${GSI}`,
    `frame-src ${GSI}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

async function htmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return htmlFiles(path);
      return entry.name.endsWith(".html") ? [path] : [];
    }),
  );
  return nested.flat();
}

const files = await htmlFiles(OUT.pathname.replace(/^\/([A-Za-z]:)/, "$1"));
for (const file of files) {
  const html = await readFile(file, "utf8");
  if (html.includes('http-equiv="Content-Security-Policy"')) {
    throw new Error(`${file} already has a CSP meta; run on a fresh build`);
  }
  if (!CHARSET_META.test(html)) {
    throw new Error(`${file}: no charset meta to place the CSP after`);
  }
  const hashes = [...new Set([...html.matchAll(INLINE_SCRIPT)].map(([, body]) => `'sha256-${createHash("sha256").update(body, "utf8").digest("base64")}'`))];
  const meta = `<meta http-equiv="Content-Security-Policy" content="${policy(hashes)}"/>`;
  // Right after the charset: a meta CSP only governs what comes after it
  await writeFile(file, html.replace(CHARSET_META, (charset) => charset + meta));
  console.log(`CSP: ${file.slice(file.indexOf("out"))} (${hashes.length} inline script hashes)`);
}
