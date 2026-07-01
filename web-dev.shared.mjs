import { esbuildPlugin } from "@web/dev-server-esbuild";

/* Browser settings shared by the dev server and the test runner, so both
   transform TS identically. The `tsconfig` option is load-bearing: it makes
   esbuild use experimental decorators (it defaults to standard decorators,
   which reject Lit's field decorators). */
export const nodeResolve = { browser: true, exportConditions: ["browser"] };
export const tsPlugin = esbuildPlugin({
  ts: true,
  target: "es2022",
  tsconfig: "tsconfig.json",
});
