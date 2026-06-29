import { esbuildPlugin } from "@web/dev-server-esbuild";
import { playwrightLauncher } from "@web/test-runner-playwright";

export default {
  files: "test/browser/**/*.test.ts",
  nodeResolve: { browser: true, exportConditions: ["browser"] },
  plugins: [esbuildPlugin({ ts: true, target: "es2022" })],
  browsers: [playwrightLauncher({ product: "chromium" })],
};
