import { esbuildPlugin } from "@web/dev-server-esbuild";
import { playwrightLauncher } from "@web/test-runner-playwright";

export default {
  files: "src/**/*.test.ts",
  nodeResolve: { browser: true, exportConditions: ["browser"] },
  /* Point esbuild at the tsconfig so it transforms Lit's experimental decorators
     (esbuild otherwise defaults to standard decorators and rejects field ones). */
  plugins: [
    esbuildPlugin({ ts: true, target: "es2022", tsconfig: "tsconfig.json" }),
  ],
  browsers: [playwrightLauncher({ product: "chromium" })],
};
