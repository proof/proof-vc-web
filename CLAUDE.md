# Proof VC Web - AI Assistant Guide

Browser-only ESM TypeScript package `@proof.com/proof-vc-web`. Ships one Web Component, `<proof-verify-id>`, that consumers drop into any markup (React, Vue, Svelte, plain HTML) to start a Proof verifiable-credentials flow on click. The element is built with **Lit** (`LitElement`). Depends on `@proof.com/proof-vc-common` for `init`, `getAuthorizationRequestURL`, and the `transactionData` builder, and on `lit` (runtime).

## Hard Rules

1. **No `node:*` or Node-only imports under `src/`.** Browser-only package, no Node entry. Type-only imports (`import type` / `export type *`) are safe — `verbatimModuleSyntax: true` erases them at emit.
2. **Keep the SSR guard in `src/internal/custom-element.ts`.** The element self-registers via the `@customElement("proof-verify-id")` decorator from this file — a guarded replacement for Lit's `@customElement` (Lit's calls `customElements.define` unconditionally, which throws in Node). The guard (`typeof customElements !== "undefined"`) lets the module load under SSR. Importing `lit`/`LitElement` is itself Node-safe (Lit's `node` export condition; `isServer` is true) and Lit manages styles internally, so no other module-scope guards are needed. `yarn test:node` imports the built entry in Node to enforce this. Don't switch to Lit's own `@customElement` — it breaks SSR import.
3. **Keep React out of the element + main entry.** The `@lit/react` wrapper lives in per-component `*.react.ts` files (e.g. `src/components/verify-id/verify-id.react.ts`), barreled by `src/react.ts` (the `./react` sub-path). Never import a `.react.ts` (or `src/react.ts`) from the element module or `src/index.ts` — it would force every consumer (Vue, plain HTML, Node) to install `react`/`@lit/react` and would inline React into the CDN bundle. `yarn build` asserts nothing leaks by keeping the element/main entry React-free.
4. **Prompt before publishing.** Never bump the version, push tags, create a Release, or trigger the publish workflow without explicit confirmation — publishes are permanent.
5. **Run `yarn check-all` before any commit or push.** It runs the read-only checks (`format:check`, `lint:check`, `typecheck`, `publint`) — the same ones CI runs, so it never mutates the tree. It does **not** run the test suite: also run `yarn test` when you touch `src/` or `test/`.
6. **Keep `yarn publint` on `--pack npm`.** `--pack auto` picks yarn-1 mode and reports false-positive "file not published" errors.
7. **Pin the dev Node version via `.node-version`, not `package.json` `engines`.** This is a browser package — Node never runs the published code, so `engines.node` is intentionally omitted (a published `engines.node` would gate _consumers'_ installs with `EBADENGINE` for no runtime reason). The dev toolchain is pinned by `.node-version` (used by version managers locally and by CI's `node-version-file`); CI runs that Node.
8. **Never silence lint with `eslint-disable`.** Fix the underlying issue, not the warning. The only sanctioned exception is a reviewed rule change in `eslint.config.mjs` — not inline disable comments.

## Essential Commands

| Command             | Purpose                                                                       |
| ------------------- | ----------------------------------------------------------------------------- |
| `yarn check-all`    | Read-only checks: format:check, lint:check, typecheck, publint                |
| `yarn build`        | `tsdown` then `yarn analyze` → `dist/` (unbundled ESM + types + CDN bundle)   |
| `yarn analyze`      | regenerate `custom-elements.json` (Custom Elements Manifest)                  |
| `yarn test`         | all tests (`test:node` + `test:browser`)                                      |
| `yarn test:node`    | `node:test` — built-artifact + SSR checks (needs build)                       |
| `yarn test:browser` | `web-test-runner` (headless Chromium via Playwright)                          |
| `yarn typecheck`    | `tsc --noEmit` (src) + `tsconfig.test.json` (browser tests)                   |
| `yarn lint:check`   | eslint, no fix                                                                |
| `yarn lint`         | `eslint --fix`                                                                |
| `yarn format:check` | `prettier --check`                                                            |
| `yarn format`       | `prettier --write`                                                            |
| `yarn publint`      | `publint --pack npm` (keep the flag)                                          |
| `yarn dev`          | `@web/dev-server` — serves the `playground/` harness at http://localhost:8000 |

Run tooling through `yarn`, not `npx` — the binaries are local devDependencies. Use the script when one exists (`yarn format:check`); otherwise run the local binary directly (`yarn prettier --check <file>`).

Yarn (Berry) is committed under `.yarn/releases/` and pinned via `yarnPath` in `.yarnrc.yml`. Any `yarn` on PATH — a Corepack shim or a global yarn 1.x from Homebrew — reads `yarnPath` and re-execs the committed binary, so everyone runs the pinned version automatically (`packageManager` in `package.json` is kept in sync for Corepack's sake). You only need `corepack enable` if a machine has no `yarn` at all; it ships one with Node, and `yarnPath` takes over from there. CI still runs `corepack enable` before `setup-node` to guarantee a yarn binary on the runner, but ordering no longer matters now that the global yarn 1.x delegates through `yarnPath` too. To bump Yarn, run `yarn set version <version>` — with `yarnPath` already set it rewrites the committed release and `.yarnrc.yml`, so no doc edits are needed.

## Architecture

### Files

| File                                           | Role                                                                                                                      |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `src/index.ts`                                 | Package entry barrel. `export *` from each component (registers on import) + re-exports `init`, `transactionData`, types. |
| `src/components/verify-id/verify-id.ts`        | The `ProofVerifyId` `LitElement` class; self-registers `<proof-verify-id>` via `@customElement`.                          |
| `src/components/verify-id/verify-id.styles.ts` | Component CSS as a Lit `css` tagged template (`CSSResult`). No SCSS, no sass build step.                                  |
| `src/components/verify-id/verify-id.react.ts`  | `@lit/react` wrapper for the element (React-only; kept out of the element module).                                        |
| `src/internal/custom-element.ts`               | Guarded `@customElement` decorator (SSR-safe `customElements.define`). Write-once; each component self-registers via it.  |
| `src/react.ts`                                 | `./react` sub-path barrel: `export *` from each component's `*.react.ts` wrapper.                                         |
| `src/components/verify-id/verify-id.test.ts`   | Browser test, co-located with the component (web-test-runner). Excluded from the tarball.                                 |
| `test/`                                        | Package-level tests: `node/` (built-artifact + SSR via `node:test`), `types/` (type-tests).                               |
| `playground/`                                  | Dev harness (`yarn dev`). Served by `@web/dev-server`, imports `../src` directly (no build). Not published.               |
| `docs/`                                        | README assets (`button.svg`, `buttons.svg`).                                                                              |

### Element model

The element is authored with **Lit** (`LitElement`). Lit owns reactive properties, attribute reflection, pre-upgrade property recovery, and constructable-stylesheet adoption — replacing the hand-rolled machinery the element used to carry. `lit` is a runtime dependency: kept **external** in the npm build (apps dedupe it) and **inlined only** in the CDN bundle. `@lit/react` is the canonical React wrapper for a Lit element.

Open shadow root holding one `<button>`, the seal `<svg>`, and a `<span>` label (hidden when `size="icon"`).

- `static styles = styles` — a Lit `css` `CSSResult` from `verify-id.styles.ts`; Lit adopts it via constructable stylesheets, shared across instances. No manual `adoptedStyleSheets`.
- `theme`/`size`/`state`/`loginHint` are `@property({ reflect: true })` reactive properties (Lit reflects them to attributes; `loginHint` sets `attribute: "login-hint"` since Lit only lowercases, not kebab-cases). `size` drives `render()` (icon hides the label). `transactionData` and `resolveAuthorizationUrl` are `@property({ attribute: false })` (object/function props, no attribute). `nonce` (inherited IDL property) and `transaction-data` are read at click time.
- `render()` returns the button/seal/label/dots template; reactive property changes re-render automatically (no `observedAttributes`/`attributeChangedCallback`/`connectedCallback`). The seal is a module-scope `html` template (`SEAL`) interpolated into `render()`.
- `_pending` is `@state` — drives the busy UI (button `disabled`, `aria-busy`, `loading` class, dots) and the re-entry guard; the inner button carries `aria-busy` for assistive tech and `updated()` also reflects it onto the host (observable from the light DOM), gated on `_pending` changing.
- The `click` listener is on the **host** (`this`), not the inner `<button>`. A real button click bubbles up to the host (click is `composed`), and a programmatic `host.click()` fires on the host directly — so a consumer's form can trigger the flow with `el.querySelector("proof-verify-id").click()`, no shadow-root piercing. (Listening on the inner button would miss `host.click()`, since events don't propagate down into the shadow tree.)
- `#navigate()` resolves the redirect URL, dispatches a cancelable `proof-navigate` event, then sets `window.location.href` (a nullish URL, or a `preventDefault()`-ed event, aborts). The button stays `disabled` / busy while pending and **stays busy after a successful navigation** (only re-enabling on abort/cancel/error). The URL comes from either the `resolveAuthorizationUrl` property (if set) or `#buildAuthorizationUrl()` — see below.
- Two `CustomEvent`s, both `bubbles`+`composed`+`cancelable`: `proof-navigate` (detail `{ url }`, fired before redirect — `preventDefault()` to take over navigation) and `proof-error` (detail `{ error }` — normalized to an `Error`; on a missing nonce / throwing resolver. If no listener `preventDefault()`s it, `#navigate` also `console.error`s the cause so misconfiguration isn't a silent no-op), keyed by `ProofVerifyIdEventMap`. `addEventListener`/`removeEventListener` are typed against that map via `declare` overload fields on the class (so handlers get the typed `CustomEvent` detail with no cast) — `declare` keeps it type-only, and using fields (not a class/interface name merge) avoids the `no-unsafe-declaration-merging` lint. The React wrapper surfaces the events as `onProofNavigate` / `onProofError`. The module also augments `HTMLElementTagNameMap` so `document.querySelector("proof-verify-id")` is typed (the standard Lit pattern). The React wrapper's typed event props are guarded by `test/types/react-wrapper.types.ts`.
- Pre-upgrade properties (set before `customElements.define` runs) are recovered automatically by Lit — no manual upgrade step.

### resolveAuthorizationUrl — custom URL resolver

`resolveAuthorizationUrl?: () => string | null | undefined | Promise<...>` is a property-only escape hatch. When set, `#navigate()` awaits it and redirects to its result instead of calling `#buildAuthorizationUrl()`; the `nonce` / `state` / `login-hint` / `transaction-data` inputs are ignored and `nonce` is not required. A nullish return aborts the redirect (the button re-enables); a throw propagates with the button restored. Use it for flows where the URL is produced elsewhere (e.g. a pushed authorization request made by the consumer). Set it as a property in JS, or pass it as a prop through the React wrapper.

### nonce and transaction data — property vs attribute

Both are read property-first, attribute-fallback in `#buildAuthorizationUrl()`:

- **`nonce`** — read as `this.nonce || this.getAttribute("nonce")`. `nonce` is a built-in IDL property, so frameworks assign it as a property (never calling `setAttribute`); property-first is required, or `getAttribute` returns null.
- **`transaction_data`** (`AuthorizationRequestParams.transaction_data` accepts `TransactionData | string`):
  - **Property** `el.transactionData = transactionData.paymentMandate({...})` — structured, typed, from proof-vc-common factories. JS/JSX path.
  - **Attribute** `transaction-data="..."` — pre-encoded string, for HTML-only consumers.

### Styling — defaults and theming

Themes (`dark` / `gray` / `outline` / `primary`) and sizes (`small` / `medium` / `large` / `icon`) apply via `:host([theme="..."])` / `:host([size="..."])`. Grouped selectors make the unattributed element match the explicit default:

```css
:host(:not([theme])) button,
:host([theme="primary"]) button { ... }
```

Same pattern for size. Default theme `primary`, default size `medium`.

### React sub-path (`./react`)

`@proof.com/proof-vc-web/react` is a barrel (`src/react.ts`) that `export *`s each component's `*.react.ts` wrapper. Each wrapper (e.g. `verify-id.react.ts`) imports its element (which self-registers via `@customElement`) and calls `createComponent(...)` to export a typed `<ProofVerifyId>` component, then `export *`s the element's types (the local React `ProofVerifyId` shadows the element class, so `/react` consumers get the wrapper). Element properties become typed props; the `proof-error` / `proof-navigate` events map to `onProofError` / `onProofNavigate`. `react` / `@lit/react` / `@types/react` are **optional** peers so non-React consumers aren't forced to install them. The `./react` export carries both `types` and `default` (runtime) conditions. Both `src/index.ts` and `src/react.ts` `export *` from `src/common.ts` (the shared `init` / `transactionData` / proof-vc-common type re-exports), so `/react` is a superset of the main entry.

## TypeScript Conventions

- `verbatimModuleSyntax: true` — use `import type` / `export type`.
- `noUncheckedIndexedAccess: true` — indexing returns `T | undefined`; use `!` only when access is guaranteed safe.
- `exactOptionalPropertyTypes: true` — spread optional fields conditionally: `...(state !== null && { state })`.
- Local imports are written without a file extension (`import { css } from "./styles"`). `tsconfig.json` uses `moduleResolution: "bundler"`, and tsdown rewrites the specifiers to `./*.js` in the emitted output.
- DOM/JSX attribute names are kebab-case (`login-hint`, `transaction-data`); the typed transaction-data JS property is camelCase (`transactionData`).
- Test files use chai-style assertions; an ESLint override disables `@typescript-eslint/no-unused-expressions` under `test/**`.
- The element uses Lit decorators (`@property`, `@state`), so `tsconfig.json` sets `experimentalDecorators: true` + `useDefineForClassFields: false`. tsdown (oxc) transforms them; the test runner's and dev server's esbuild need the `tsconfig` option (`web-test-runner.config.mjs` / `web-dev-server.config.mjs`), since esbuild defaults to standard decorators otherwise.

## Recipes

### Add a theme

1. `src/components/verify-id/verify-id.styles.ts`: add `:host([theme="<name>"]) button { ... }` with `background-color`, `color`, optional `border`, and `&:hover`.
2. `src/components/verify-id/verify-id.ts`: add `<name>` to the `ProofVerifyIdTheme` union (the React wrapper types pick it up automatically).
3. `playground/index.html`: add a demo row (optional).

Themes are pure CSS — no change in `verify-id.ts`.

### Add a size

1. `src/components/verify-id/verify-id.styles.ts`: add `:host([size="<name>"]) button { ... }` with `height`, `padding`, `font-size`, `gap`, `border-radius`, `svg { width/height }`.
2. `src/components/verify-id/verify-id.ts`: extend the `ProofVerifyIdSize` union.
3. Only if the size needs special label behavior (e.g. icon-only): update the `iconOnly` logic in `render()`.

### Framework integration

React gets a typed wrapper via `@lit/react` (`src/react.ts` → `<ProofVerifyId>`). Other frameworks use `<proof-verify-id>` natively — Vue needs `compilerOptions.isCustomElement`, Svelte/Solid handle custom elements directly. No per-framework type files are generated.

### Adjust the seal icon

Replace the `SEAL` `html` template in `verify-id.ts` (interpolated into `render()`). It's `currentColor`-filled, so theming flows through. The same path is mirrored in `docs/button.svg` and `docs/buttons.svg` (`<symbol id="seal">`) — update those too or the docs drift.

## CI

`.github/workflows/ci.yml`, on push and PR to `main`. One job per check, run in parallel: `format`, `lint`, `typecheck`, `test`, `build`, `publint`.

- `build` runs `yarn build` then `yarn test:node` (built-artifact + SSR checks via `node:test`) and uploads `dist/` as an artifact; `publint` `needs: build` and downloads it (publint resolves `exports` against the packed tarball, so it needs the build output).
- `test` installs the Playwright Chromium browser (`node_modules/.bin/playwright install --with-deps chromium`), then runs `yarn test:browser` (`web-test-runner` headless).
- Workflow-level `permissions: contents: read`; the publish job adds `id-token: write` for OIDC.

Dependabot (`.github/dependabot.yml`, weekly) watches root npm and github-actions. Minor/patch updates are grouped into one PR per ecosystem; majors get individual PRs.

## Publishing

Prompt before publishing (Hard Rule 4).

- **Auth**: npm Trusted Publishing via OIDC (no `NPM_TOKEN`).
- **Trigger**: GitHub Release published → `.github/workflows/publish.yml`.
- **Registry**: https://www.npmjs.com/package/@proof.com/proof-vc-web

### Release flow (after user confirms)

`main` is branch-protected: direct pushes are rejected. Bump on a branch, merge the PR, then create the Release against the exact merged commit SHA.

1. Bump on a branch (no auto-tag from npm — the tag is created by `gh release create` in step 4):
   ```bash
   git switch -c release-X.Y.Z origin/main
   npm version patch --no-git-tag-version          # or minor / major; writes package.json only
   git commit -am "Release X.Y.Z"
   git push -u origin release-X.Y.Z
   ```
2. Open a PR. Approve and merge in the GitHub UI.
3. Locate the merged commit SHA on `main` by grepping for the release commit subject:
   ```bash
   git fetch origin main
   SHA=$(git log origin/main --grep='Release X.Y.Z' --format=%H -n 1)
   echo "$SHA"   # sanity-check before using
   ```
   Expect exactly one match. If zero matches, the PR isn't merged yet. If multiple, narrow the grep to the exact subject (e.g. `--grep='^Release X\.Y\.Z$'`).
4. Create the Release against that SHA — `gh release create` creates the tag automatically when it doesn't exist:
   ```bash
   gh release create vX.Y.Z --target "$SHA" --generate-notes
   ```

The Release triggers `publish.yml`: check suite → tag must match `package.json` → `npm publish --provenance --access public`.

Never `git push --follow-tags` to `main`: the commit is rejected but the tag still pushes, stranding it on an unmerged commit. Delete a stray tag with `git push --delete origin vX.Y.Z`.

### Troubleshooting 404 from `npm publish`

A 404 after a successful provenance step means npm rejected auth (it returns 404 instead of 403 to hide existence). Check the Trusted Publisher config at `https://www.npmjs.com/package/@proof.com/proof-vc-web/access`:

- Organization matches the GitHub org (case-sensitive)
- Repository: `proof-vc-web`
- Workflow filename: `publish.yml`
- Environment: empty (unless the workflow uses GitHub Environments)

## Notes

- `yarn.lock` is the only lockfile (no `package-lock.json`).
- Scope is `@proof.com` (with the dot), not `@proof`.
- CI runs on the Node version in `.node-version`.
- `@proof.com/proof-vc-common` is `yarn link`-ed during local dev to shadow the published version `package.json` depends on. Berry's `yarn link` mutates `package.json` (`resolutions`) and the lockfile, so under `enableImmutableInstalls` run it with `--no-immutable` and don't commit the resulting `resolutions`/`yarn.lock` changes.
- `.yarnrc.yml` hardens the toolchain: `enableScripts: false` (no dependency lifecycle scripts run — allow a specific package via `dependenciesMeta.<pkg>.built: true` if one ever legitimately needs a build step) and `npmMinimalAgeGate: 1w` (refuses npm versions younger than a week, mirroring the dependabot `cooldown`). The gate is overridden per-scope to `0` for first-party `@proof.com` packages (via `npmScopes`), so a freshly published `@proof.com/proof-vc-common` can be consumed immediately while third-party deps keep the week-long cooldown.
- `enableImmutableInstalls: true` makes every `yarn install` lockfile-strict (CI **and** local): it never writes `yarn.lock`, and aborts with `YN0028` if the committed lockfile is out of sync with `package.json`. To intentionally update the lockfile locally (bump a dep, re-link `proof-vc-common`), run `yarn install --no-immutable`, then commit the updated `yarn.lock`.
- `tsconfig.json` has no `include`; it typechecks everything except `exclude: ["node_modules", "dist", "test", "src/**/*.test.ts"]` — so `src/` and the `playground/` harness are both covered. This fails closed — a new `.ts` anywhere (root config, a new top-level dir) is typechecked automatically rather than silently missed. `test/` and the co-located `src/**/*.test.ts` are excluded because they need the `mocha` globals; `tsconfig.test.json` extends the base, adds those globals, and includes both `test` (the `test/node` + `test/types` package-level tests) and the co-located `src/**/*.test.ts` (its explicit `exclude: ["node_modules"]` overrides the base so those aren't skipped); `yarn typecheck` runs both projects. The `.mjs` config files (eslint, web-test-runner, web-dev-server, custom-elements-manifest) are plain JS — not typechecked by `tsc`, but linted by ESLint.
- ESLint (flat config, `eslint.config.mjs`) runs typescript-eslint + `eslint-plugin-unused-imports`, plus `eslint-plugin-lit` and `eslint-plugin-wc` (`flat/recommended`, scoped to `src/**/*.ts`) for Lit-template and web-component linting. This matches what reputable Lit libraries ship (Shoelace, Adobe Spectrum, Lion). These are **rule-based** (template syntax, binding positions, duplicate bindings, WC correctness) — not type-aware. A type-aware Lit template checker (lit-analyzer / ts-lit-plugin) is intentionally **not** used: the official package is stale (2024) and the maintained community fork has no adoption, and no major Lit library ships one — they rely on `tsc` + the eslint plugins + tests, as we do. Editor "unknown attribute" warnings from a stale lit-analyzer are false positives, not build errors.
- `dist/` is build output from `tsdown` (`yarn build`): unbundled ESM (`index.js` + per-module) + `.d.ts` + declaration maps, plus the self-contained CDN bundle `proof-verify-id.min.js` (deps inlined, for `<script type="module">` via jsdelivr/unpkg). tsdown's `clean: true` wipes `dist/` before each build. The package ships both `dist` and `src` (`files`): shipping `src` lets the `.js.map` / `.d.ts.map` resolve to real source for go-to-source. Co-located `*.test.ts` are kept out of the tarball via the `"!src/**/*.test.ts"` negation in `files`. `lit` stays **external** in the unbundled build (apps dedupe it) and is **inlined** into the CDN bundle (~9.5KB gz). The experimental-decorator helper is emitted as a local `dist/_virtual/…/decorate.js` chunk (no external runtime dep). `tsc` is typecheck-only (`--noEmit`). `yarn test:node` validates the built artifact (bundle self-containment, `dist` shape, SSR import) via `node:test`.
- `dist/custom-elements.json` is the Custom Elements Manifest (config: `custom-elements-manifest.config.mjs`), generated by `yarn analyze`. It is a **build artifact**, not committed — the serious WC libraries (Lion, Vaadin, MGT, Wokwi, Apollo) gitignore + generate the manifest rather than tracking it; we follow that, adapted to a single package by emitting into `dist/`. So it's gitignored (via `dist/`), prettier-ignored, shipped via `files: ["dist"]` + the `customElements` field, and travels with the uploaded `dist` artifact (so the `publint` job, which downloads `dist` without building, still has it). `yarn build` runs `tsdown` **then** `yarn analyze` — the analyzer must run after tsdown or tsdown's `clean` wipes the manifest. The `analyze` script passes `--litelement` so Lit's `@property` decorators are read into the manifest's attributes/properties (and lifecycle methods are filtered out); `nonce` and `transaction-data` (read at click time, not decorators) are documented via JSDoc `@attr` on the element.
