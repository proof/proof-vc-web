/*
 * Generates dist/custom-elements.json (attributes, properties, events) for IDE
 * autocomplete and catalogs. The `analyze` script passes --litelement so the
 * @property decorators are read; nonce / transaction-data are documented via
 * JSDoc @attr on the element. It lands in dist/ as a build artifact: gitignored,
 * shipped via `files`, and carried with the dist artifact. `yarn build` runs
 * this after tsdown so its `clean` doesn't wipe it.
 */
export default {
  globs: ["src/components/verify-id/verify-id.ts"],
  outdir: "dist",
};
