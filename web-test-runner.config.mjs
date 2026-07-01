import { playwrightLauncher } from "@web/test-runner-playwright";
import { nodeResolve, tsPlugin } from "./web-dev.shared.mjs";

export default {
  files: "src/**/*.test.ts",
  nodeResolve,
  plugins: [tsPlugin],
  browsers: [playwrightLauncher({ product: "chromium" })],
};
