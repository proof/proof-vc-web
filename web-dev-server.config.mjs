import { nodeResolve, tsPlugin } from "./web-dev.shared.mjs";

/* Dev harness for the element (`yarn dev`). Serves playground/index.html at the
   root, transforms TS on the fly, and resolves bare imports (lit,
   proof-vc-common) against the package's own node_modules — no build step.
   rootDir stays the repo root so the harness can import the real `src/`; the
   middleware maps `/` to the playground so the URL is clean. */
export default {
  rootDir: ".",
  port: 8000,
  open: true,
  watch: true,
  nodeResolve,
  middleware: [
    (context, next) => {
      /* context.path is query-stripped, so `/?foo=bar` still matches. */
      if (context.path === "/") context.url = "/playground/index.html";
      return next();
    },
  ],
  plugins: [tsPlugin],
};
