import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/* Checks on the built output that publint doesn't cover: the CDN bundle is
   self-contained, and the entry imports without a DOM. Run `yarn build` first. */
const root = fileURLToPath(new URL("../../", import.meta.url));

test("the CDN bundle is self-contained (no external imports)", () => {
  const src = readFileSync(`${root}dist/proof-verify-id.min.js`, "utf8");
  /* Catch every form a bundler can leave external: static `from "x"`,
     side-effect `import "x"`, dynamic `import("x")`, and `require("x")`.
     Relative specifiers (./ ../) are fine. */
  const bare = String.raw`["'](?![./])[^"']+["']`;
  const leftovers = [
    new RegExp(String.raw`\bfrom\s*${bare}`, "g"),
    new RegExp(String.raw`\bimport\s*${bare}`, "g"),
    new RegExp(String.raw`\bimport\s*\(\s*${bare}`, "g"),
    new RegExp(String.raw`\brequire\s*\(\s*${bare}`, "g"),
  ].flatMap((re) => src.match(re) ?? []);
  assert.deepEqual(
    leftovers,
    [],
    `external specifiers remain in the bundle: ${leftovers.join(", ")}`,
  );
});

test("the entry imports in Node (SSR-safe) and exposes the public API", async () => {
  /* A throw here is the failure — the element must import without a DOM. */
  const mod = await import(`${root}dist/index.js`);
  assert.equal(typeof mod.ProofVerifyId, "function", "ProofVerifyId class");
  assert.equal(typeof mod.init, "function", "init()");
  assert.ok(mod.transactionData, "transactionData builder");
});
