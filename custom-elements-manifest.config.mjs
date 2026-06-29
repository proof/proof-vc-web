/*
 * Generates dist/custom-elements.json (attributes, properties, events) for IDE
 * autocomplete and catalogs. It lands in dist/ as a build artifact: gitignored,
 * shipped via `files`, and carried with the dist artifact. `yarn build` runs
 * this after tsdown so its `clean` doesn't wipe it.
 */
export default {
  globs: ["src/proof-verify-id.ts"],
  outdir: "dist",
};
