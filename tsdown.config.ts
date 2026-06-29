import { defineConfig, type UserConfig } from "tsdown";

/* Browser-targeted ESM, shared by both outputs. */
const shared = {
  format: ["es"],
  platform: "browser",
  target: "es2022",
  sourcemap: true,
  treeshake: true,
  outDir: "dist",
} satisfies UserConfig;

export default defineConfig([
  /**
   * Library build: unbundled ESM + types for npm/bundler consumers. Deps stay
   * external so apps dedupe them. `src/react.ts` is the `./react` entry, not
   * imported by index, so non-React consumers skip react/@lit/react.
   */
  {
    ...shared,
    entry: ["src/index.ts", "src/react.ts"],
    unbundle: true,
    dts: { sourcemap: true },
    clean: true,
  },
  /**
   * CDN bundle: one minified, self-contained ESM file for `<script type="module">`.
   * tsdown keeps deps external by default, so force them all inline.
   */
  {
    ...shared,
    entry: { "proof-verify-id.min": "src/index.ts" },
    unbundle: false,
    minify: true,
    dts: false,
    deps: { alwaysBundle: () => true },
  },
]);
