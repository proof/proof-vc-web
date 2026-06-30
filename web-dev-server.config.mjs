import { esbuildPlugin } from "@web/dev-server-esbuild";

/* Dev harness for the element (`yarn dev`). Serves playground/index.html at the
   root, transforms TS on the fly, and resolves bare imports (lit,
   proof-vc-common) against the package's own node_modules — no build step.
   rootDir stays the repo root so the harness can import the real `src/`; the
   middleware maps `/` to the playground so the URL is clean. */
export default {
  rootDir: ".",
  open: true,
  watch: true,
  nodeResolve: { browser: true, exportConditions: ["browser"] },
  middleware: [
    (context, next) => {
      if (context.url === "/") context.url = "/playground/index.html";
      return next();
    },
  ],
  plugins: [
    esbuildPlugin({ ts: true, target: "es2022", tsconfig: "tsconfig.json" }),
  ],
};
