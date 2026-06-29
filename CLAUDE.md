# Proof VC Web - AI Assistant Guide

Browser-only ESM TypeScript package `@proof.com/proof-vc-web`. Ships one Web Component, `<proof-verify-id>`, that consumers drop into any markup (React, Vue, Svelte, plain HTML) to start a Proof verifiable-credentials flow on click. Depends on `@proof.com/proof-vc-common` for `init`, `getAuthorizationRequestURL`, and the `transactionData` builder.

## Hard Rules

1. **No `node:*` or Node-only imports under `src/`.** Browser-only package, no Node entry. Type-only imports (`import type` / `export type *`) are safe — `verbatimModuleSyntax: true` erases them at emit.
2. **Keep the SSR guards in `src/proof-verify-id.ts` and `src/register.ts`.** Without them, three module-scope sites throw when an SSR framework evaluates the import in Node:
   - `class extends HTMLElement` → guarded by the conditional `Base` constant.
   - `new CSSStyleSheet()` → guarded by `typeof CSSStyleSheet !== "undefined"`.
   - `customElements.define(...)` → guarded by `typeof customElements !== "undefined"`.
3. **Never reference `src/react.ts` from `src/index.ts`.** It's the React wrapper sub-path entry (`@proof.com/proof-vc-web/react`, built on `@lit/react`); importing it from the main entry would force every consumer (Vue, plain HTML, Node) to install `react`/`@lit/react`.
4. **Prompt before publishing.** Never bump the version, push tags, create a Release, or trigger the publish workflow without explicit confirmation — publishes are permanent.
5. **Run `yarn check-all` before any commit or push.** It runs the read-only checks (`format:check`, `lint:check`, `typecheck`, `publint`) — the same ones CI runs, so it never mutates the tree. It does **not** run the test suite: also run `yarn test` when you touch `src/` or `test/`. And it does **not** cover `site/` (root `tsconfig.json` excludes it). Since `site/` imports parent `src/` and pulls `proof-vc-common`, changes to `src/`, dependencies, or `site/` can break the site's CI even when `check-all` passes — so also run the site's checks before commit: `cd site && yarn format:check && yarn lint:check && yarn typecheck && yarn build`.
6. **Keep `yarn publint` on `--pack npm`.** `--pack auto` picks yarn-1 mode and reports false-positive "file not published" errors.
7. **Don't lower `engines.node` below `>=24.0.0`.** Matches the repo's pinned Node toolchain (`.node-version`).
8. **Never silence lint with `eslint-disable`.** Fix the underlying issue, not the warning. The only sanctioned exception is a reviewed rule change in `eslint.config.mjs` — not inline disable comments.

## Essential Commands

| Command               | Purpose                                                                     |
| --------------------- | --------------------------------------------------------------------------- |
| `yarn check-all`      | Read-only checks: format:check, lint:check, typecheck, publint              |
| `yarn build`          | `yarn analyze` then `tsdown` → `dist/` (unbundled ESM + types + CDN bundle) |
| `yarn analyze`        | regenerate `custom-elements.json` (Custom Elements Manifest)                |
| `yarn test`           | all tests (`test:node` + `test:browser`)                                    |
| `yarn test:node`      | `node:test` — built-artifact + SSR checks (needs build)                     |
| `yarn test:browser`   | `web-test-runner` (headless Chromium via Playwright)                        |
| `yarn typecheck`      | `tsc --noEmit` (src) + `tsconfig.test.json` (browser tests)                 |
| `yarn lint:check`     | eslint, no fix                                                              |
| `yarn lint`           | `eslint --fix`                                                              |
| `yarn format:check`   | `prettier --check`                                                          |
| `yarn format`         | `prettier --write`                                                          |
| `yarn publint`        | `publint --pack npm` (keep the flag)                                        |
| `cd site && yarn dev` | Webpack dev server on http://localhost:4000                                 |

Run tooling through `yarn`, not `npx` — the binaries are local devDependencies. Use the script when one exists (`yarn format:check`); otherwise run the local binary directly (`yarn prettier --check <file>`).

Yarn (Berry) is committed under `.yarn/releases/` and pinned via `yarnPath` in `.yarnrc.yml`. Any `yarn` on PATH — a Corepack shim or a global yarn 1.x from Homebrew — reads `yarnPath` and re-execs the committed binary, so everyone runs the pinned version automatically (`packageManager` in `package.json` is kept in sync for Corepack's sake). You only need `corepack enable` if a machine has no `yarn` at all; it ships one with Node, and `yarnPath` takes over from there. CI still runs `corepack enable` before `setup-node` to guarantee a yarn binary on the runner, but ordering no longer matters now that the global yarn 1.x delegates through `yarnPath` too. To bump Yarn, run `yarn set version <version>` — with `yarnPath` already set it rewrites the committed release and `.yarnrc.yml`, so no doc edits are needed. `site/` needs no `.yarnrc.yml` of its own — `yarn` run there walks up to the root config and resolves `yarnPath` to the same committed binary.

## Architecture

### Files

| File                     | Role                                                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `src/index.ts`           | Public entry. Registers `<proof-verify-id>` as an import side effect; re-exports `init`, `transactionData`, types. |
| `src/proof-verify-id.ts` | The `ProofVerifyId` class extending `HTMLElement` (via guarded `Base`).                                            |
| `src/register.ts`        | Guarded `customElements.define`; called by `index.ts` and `react.ts`.                                              |
| `src/styles.ts`          | CSS as a tagged template literal. No SCSS, no sass build step.                                                     |
| `src/react.ts`           | `@lit/react` wrapper → typed `<ProofVerifyId>` component. Sub-path entry `./react`.                                |
| `site/`                  | Local test app. Webpack-served, imports parent source via `../../src/index.ts`. Not published, not a workspace.    |
| `docs/`                  | README assets (`button.svg`, `buttons.svg`).                                                                       |

### Element model

The element is authored as a **vanilla `HTMLElement`**, not Lit — deliberate. For one branded button with near-trivial templating (label visibility + a loading class + aria), Lit's value (reactive-property + templating boilerplate removal) doesn't justify adding a runtime dependency (~5KB), ~2×-ing the CDN bundle, and reversing the zero-runtime-dep brand identity. Note `@lit/react` does **not** require Lit — it wraps any custom element, so "vanilla element + `@lit/react` wrapper" is coherent and intentional. **Switch trigger:** adopt Lit (with `@lit/react`) if this grows into a component **set** (3+ components) or the element gains **real dynamic templating/state** (conditional subtrees, lists, frequent re-render) — at that scale the per-component boilerplate flips the math.

Open shadow root holding one `<button>`, the seal `<svg>`, and a `<span>` label (omitted when `size="icon"`).

- A single module-scope `CSSStyleSheet` built from `styles.ts` is adopted into every shadow root via `adoptedStyleSheets`.
- `observedAttributes = ["size"]` — only `size` drives structural state (label visibility + `aria-label`). `theme`/`size`/`state`/`loginHint` are reflecting properties (getter/setter ↔ attribute) so frameworks can set them as props and the React wrapper types pick them up; `theme` is otherwise pure CSS. `nonce` (built-in IDL property) and `transaction-data` are read at click time.
- No `connectedCallback`. `attributeChangedCallback` fires on parser upgrade, `setAttribute`, and framework attribute updates — covering React/Vue/Svelte.
- The `click` listener is on the **host** (`this`), not the inner `<button>`. A real button click bubbles up to the host (click is `composed`), and a programmatic `host.click()` fires on the host directly — so a consumer's form can trigger the flow with `el.querySelector("proof-verify-id").click()`, no shadow-root piercing. (Listening on the inner button would miss `host.click()`, since events don't propagate down into the shadow tree.)
- `#navigate()` resolves the redirect URL, dispatches a cancelable `proof-navigate` event, then sets `window.location.href` (a nullish URL, or a `preventDefault()`-ed event, aborts). The button stays `disabled` / busy while pending and **stays busy after a successful navigation** (only re-enabling on abort/cancel/error). The URL comes from either the `resolveAuthorizationUrl` property (if set) or `#buildAuthorizationUrl()` — see below.
- Two `CustomEvent`s, both `bubbles`+`composed`+`cancelable`, typed via `ProofVerifyIdEventMap` (so `addEventListener` needs no cast): `proof-navigate` (detail `{ url }`, fired before redirect — `preventDefault()` to take over navigation) and `proof-error` (detail `{ error }`, on a missing nonce / throwing resolver, instead of an unhandled rejection). The React wrapper surfaces them as `onProofNavigate` / `onProofError`.
- `aria-busy` is set on the **host** (observable from the light DOM); `disabled` + the `loading` class stay on the inner button.
- Object properties (`transactionData`, `resolveAuthorizationUrl`) set **before upgrade** are recovered by `#upgradeProperties()` in the constructor (frameworks/SSR can assign them before `customElements.define` runs).

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

`@proof.com/proof-vc-web/react` is a runtime `@lit/react` wrapper: `src/react.ts` calls `register()` then `createComponent(...)` to export a typed `<ProofVerifyId>` component, and re-exports the public types so React consumers import everything from one entry. Element properties become typed props; the `proof-error` / `proof-navigate` events map to `onProofError` / `onProofNavigate`. `react` / `@lit/react` / `@types/react` are **optional** peers so non-React consumers aren't forced to install them. The `./react` export carries both `types` and `default` (runtime) conditions.

## TypeScript Conventions

- `verbatimModuleSyntax: true` — use `import type` / `export type`.
- `noUncheckedIndexedAccess: true` — indexing returns `T | undefined`; use `!` only when access is guaranteed safe.
- `exactOptionalPropertyTypes: true` — spread optional fields conditionally: `...(state !== null && { state })`.
- Local imports are written without a file extension (`import { css } from "./styles"`). `tsconfig.json` uses `moduleResolution: "bundler"`, and tsdown rewrites the specifiers to `./*.js` in the emitted output.
- DOM/JSX attribute names are kebab-case (`login-hint`, `transaction-data`); the typed transaction-data JS property is camelCase (`transactionData`).
- Test files use chai-style assertions; an ESLint override disables `@typescript-eslint/no-unused-expressions` under `test/**`.

## Recipes

### Add a theme

1. `src/styles.ts`: add `:host([theme="<name>"]) button { ... }` with `background-color`, `color`, optional `border`, and `&:hover`.
2. `src/proof-verify-id.ts`: add `<name>` to the `ProofVerifyIdTheme` union (the React wrapper types pick it up automatically).
3. `site/public/index.html`: add a demo row (optional).

Themes are pure CSS — no change in `proof-verify-id.ts`.

### Add a size

1. `src/styles.ts`: add `:host([size="<name>"]) button { ... }` with `height`, `padding`, `font-size`, `gap`, `border-radius`, `svg { width/height }`.
2. `src/proof-verify-id.ts`: extend the `ProofVerifyIdSize` union.
3. Only if the size needs special label behavior (e.g. icon-only): update `#syncSize()` in `proof-verify-id.ts`.

### Framework integration

React gets a typed wrapper via `@lit/react` (`src/react.ts` → `<ProofVerifyId>`). Other frameworks use `<proof-verify-id>` natively — Vue needs `compilerOptions.isCustomElement`, Svelte/Solid handle custom elements directly. No per-framework type files are generated.

### Adjust the seal icon

Replace the `SEAL_SVG` string in `proof-verify-id.ts` (assigned to `button.innerHTML`). It's `currentColor`-filled, so theming flows through. The same path is mirrored in `docs/button.svg` and `docs/buttons.svg` (`<symbol id="seal">`) — update those too or the docs drift.

## CI

`.github/workflows/ci.yml`, on push and PR to `main`. One job per check, run in parallel: `format`, `lint`, `typecheck`, `test`, `build`, `publint`, `site`.

- `build` runs `yarn build` then `yarn test:node` (built-artifact + SSR checks via `node:test`) and uploads `dist/` as an artifact; `publint` `needs: build` and downloads it (publint resolves `exports` against the packed tarball, so it needs the build output).
- `test` installs the Playwright Chromium browser (`node_modules/.bin/playwright install --with-deps chromium`), then runs `yarn test:browser` (`web-test-runner` headless).
- `site` installs root deps then `site/` deps — `site/` imports parent `src/`, which pulls `proof-vc-common` from the root `node_modules` — then runs the site's `format:check`, `lint:check`, `typecheck`, `build`.
- Workflow-level `permissions: contents: read`; the publish job adds `id-token: write` for OIDC.

Dependabot (`.github/dependabot.yml`, weekly) watches root npm, `site/` npm, and github-actions. Minor/patch updates are grouped into one PR per ecosystem; majors get individual PRs.

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
- `tsconfig.json` has no `include`; it typechecks everything except `exclude: ["node_modules", "dist", "site", "test"]`. This fails closed — a new `.ts` anywhere (root config, a new top-level dir) is typechecked automatically rather than silently missed. `test/` and `site/` are excluded because they have their own configs (`tsconfig.test.json` re-includes `test/` with the `mocha` types; `site/` has its own `tsconfig.json`). `yarn typecheck` runs the root and test projects. The tests are typechecked separately by `tsconfig.test.json` (which extends the base, adds the `mocha` global types, and includes `test`); `yarn typecheck` runs both. `site/` has its own `tsconfig.json` (also bundler resolution) since it imports the parent `src/`. The `.mjs` config files (eslint, web-test-runner, custom-elements-manifest) are plain JS — not typechecked by `tsc`, but linted by ESLint.
- `dist/` is build output from `tsdown` (`yarn build`): unbundled ESM (`index.js` + per-module) + `.d.ts` + declaration maps, plus the self-contained CDN bundle `proof-verify-id.min.js` (deps inlined, for `<script type="module">` via jsdelivr/unpkg). tsdown's `clean: true` wipes `dist/` before each build. The package ships both `dist` and `src` (`files`): shipping `src` lets the `.js.map` / `.d.ts.map` resolve to real source for go-to-source. `tsc` is typecheck-only (`--noEmit`). `yarn test:node` validates the built artifact (bundle self-containment, `dist` shape, SSR import) via `node:test`.
- `dist/custom-elements.json` is the Custom Elements Manifest (config: `custom-elements-manifest.config.mjs`), generated by `yarn analyze`. It is a **build artifact**, not committed — the serious WC libraries (Lion, Vaadin, MGT, Wokwi, Apollo) gitignore + generate the manifest rather than tracking it; we follow that, adapted to a single package by emitting into `dist/`. So it's gitignored (via `dist/`), prettier-ignored, shipped via `files: ["dist"]` + the `customElements` field, and travels with the uploaded `dist` artifact (so the `publint` job, which downloads `dist` without building, still has it). `yarn build` runs `tsdown` **then** `yarn analyze` — the analyzer must run after tsdown or tsdown's `clean` wipes the manifest. The element's inner DOM is built with **method calls** (`setAttribute`/`classList.add`/`append`/`insertAdjacentHTML`) not property assignment — the analyzer otherwise mis-reads `this.#button.innerHTML = …` etc. as class fields. Private `#` members still appear in the manifest (`privacy:"private"`); that's spec-correct and every consumer tool ignores them, so no plugin strips them.
