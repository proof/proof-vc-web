# Proof VC Web - AI Assistant Guide

Browser-only ESM TypeScript package `@proof.com/proof-vc-web`. Ships one Web Component, `<proof-verify-id>`, that consumers drop into any markup (React, Vue, Svelte, plain HTML) to start a Proof verifiable-credentials flow on click. Depends on `@proof.com/proof-vc-common` for `init`, `getAuthorizationRequestURL`, and the `transactionData` builder.

## Hard Rules

1. **No `node:*` or Node-only imports under `src/`.** Browser-only package, no Node entry. Type-only imports (`import type` / `export type *`) are safe — `verbatimModuleSyntax: true` erases them at emit.
2. **Keep the SSR guards in `src/proof_verify_id.ts` and `src/index.ts`.** Without them, three module-scope sites throw when an SSR framework evaluates the import in Node:
   - `class extends HTMLElement` → guarded by the conditional `Base` constant.
   - `new CSSStyleSheet()` → guarded by `typeof CSSStyleSheet !== "undefined"`.
   - `customElements.define(...)` → guarded by `typeof customElements !== "undefined"`.
3. **Never reference `src/react.ts` from `src/index.ts`.** It's the types-only sub-path entry (`@proof.com/proof-vc-web/react`); importing it from the main entry forces every non-React consumer to install `@types/react`.
4. **Prompt before publishing.** Never bump the version, push tags, create a Release, or trigger the publish workflow without explicit confirmation — publishes are permanent.
5. **Run `yarn check-all` before any commit or push.** It's this repo's "tests + lint": format, lint, typecheck, publint.
6. **Keep `yarn publint` on `--pack npm`.** `--pack auto` picks yarn-1 mode and reports false-positive "file not published" errors.
7. **Don't lower `engines.node` below `>=22.0.0`.** Matches proof-vc-common.

## Essential Commands

| Command               | Purpose                                      |
| --------------------- | -------------------------------------------- |
| `yarn check-all`      | Full check: format, lint, typecheck, publint |
| `yarn build`          | `tsc` emit to `dist/`                        |
| `yarn typecheck`      | `tsc --noEmit`                               |
| `yarn lint:check`     | eslint, no fix                               |
| `yarn lint`           | `eslint --fix`                               |
| `yarn format:check`   | `prettier --check`                           |
| `yarn format`         | `prettier --write`                           |
| `yarn publint`        | `publint --pack npm` (keep the flag)         |
| `cd site && yarn dev` | Webpack dev server on http://localhost:4000  |

Run tooling through `yarn`, not `npx` — the binaries are local devDependencies. Use the script when one exists (`yarn format:check`); otherwise run the local binary directly (`yarn prettier --check <file>`).

## Architecture

### Files

| File                     | Role                                                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `src/index.ts`           | Public entry. Registers `<proof-verify-id>` as an import side effect; re-exports `init`, `transactionData`, types. |
| `src/proof_verify_id.ts` | The `ProofVerifyId` class extending `HTMLElement` (via guarded `Base`).                                            |
| `src/styles.ts`          | CSS as a tagged template literal. No SCSS, no sass build step.                                                     |
| `src/react.ts`           | `declare module "react"` JSX augmentation. Sub-path types entry only.                                              |
| `site/`                  | Local test app. Webpack-served, imports parent source via `../../src/index.ts`. Not published, not a workspace.    |
| `docs/`                  | README assets (`button.svg`, `buttons.svg`).                                                                       |

### Element model

Open shadow root holding one `<button>`, the seal `<svg>`, and a `<span>` label (omitted when `size="icon"`).

- A single module-scope `CSSStyleSheet` built from `styles.ts` is adopted into every shadow root via `adoptedStyleSheets`.
- `observedAttributes = ["size"]` — only `size` drives structural state (label visibility + `aria-label`). `theme` is pure CSS. `nonce`, `state`, `login-hint`, `transaction-data` are read at click time, not observed.
- No `connectedCallback`. `attributeChangedCallback` fires on parser upgrade, `setAttribute`, and framework attribute updates — covering React/Vue/Svelte.
- Click handler: resolve `nonce` (required, throws if missing), plus optional `state` / `login-hint` / transaction data; call `getAuthorizationRequestURL(...)`; set `window.location.href`. The button is `disabled` while the request is pending.

### nonce and transaction data — property vs attribute

Both are read property-first, attribute-fallback in `#onClick`:

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

### Sub-path types entry

`@proof.com/proof-vc-web/react` is types-only: `dist/react.js` is an empty module (it only makes the export valid); the `.d.ts` augments `React.JSX.IntrinsicElements` so `<proof-verify-id ...>` typechecks in TSX. Consumers opt in via `"types": ["@proof.com/proof-vc-web/react"]`, a triple-slash reference, or a type-only side-effect import.

## TypeScript Conventions

- `verbatimModuleSyntax: true` — use `import type` / `export type`.
- `noUncheckedIndexedAccess: true` — indexing returns `T | undefined`; use `!` only when access is guaranteed safe.
- `exactOptionalPropertyTypes: true` — spread optional fields conditionally: `...(state !== null && { state })`.
- Local imports use the `.ts` extension (`rewriteRelativeImportExtensions` rewrites to `.js` on emit).
- DOM/JSX attribute names are kebab-case (`login-hint`, `transaction-data`); the typed transaction-data JS property is camelCase (`transactionData`).
- `src/react.ts` uses `namespace JSX` (the only legal React JSX augmentation); an ESLint per-file override disables `@typescript-eslint/no-namespace` there.

## Recipes

### Add a theme

1. `src/styles.ts`: add `:host([theme="<name>"]) button { ... }` with `background-color`, `color`, optional `border`, and `&:hover`.
2. `src/react.ts`: add `<name>` to the `theme?` union in `ProofVerifyIdJSXAttributes`.
3. `site/public/index.html`: add a demo row (optional).

Themes are pure CSS — no change in `proof_verify_id.ts`.

### Add a size

1. `src/styles.ts`: add `:host([size="<name>"]) button { ... }` with `height`, `padding`, `font-size`, `gap`, `border-radius`, `svg { width/height }`.
2. `src/react.ts`: extend the `size?` union.
3. Only if the size needs special label behavior (e.g. icon-only): update `#syncSize()` in `proof_verify_id.ts`.

### Add a JSX types entry for another framework

Use `src/react.ts` as the template:

1. Create `src/<framework>.ts` with the framework's module augmentation.
2. Add to `package.json` `exports`: `"./<framework>": { "types": "./dist/<framework>.d.ts" }`.
3. If its TS rules trip `no-namespace`, add the file to the per-file ESLint override in `eslint.config.js`.
4. If a `@types/...` package is needed at build, add it to `devDependencies` and as an optional peer.

### Adjust the seal icon

Replace the `SEAL_SVG` string in `proof_verify_id.ts` (assigned to `button.innerHTML`). It's `currentColor`-filled, so theming flows through. The same path is mirrored in `docs/button.svg` and `docs/buttons.svg` (`<symbol id="seal">`) — update those too or the docs drift.

## CI

`.github/workflows/ci.yml`, on push and PR to `main`. One job per check, run in parallel: `format`, `lint`, `typecheck`, `build`, `publint`, `site`.

- `build` uploads `dist/` as an artifact; `publint` `needs: build` and downloads it (publint resolves `exports` against the packed tarball, so it needs the build output).
- `site` installs root deps then `site/` deps — `site/` imports parent `src/`, which pulls `proof-vc-common` from the root `node_modules` — then runs the site's `format:check`, `lint:check`, `typecheck`, `build`.
- Workflow-level `permissions: contents: read`; the publish job adds `id-token: write` for OIDC.

Dependabot (`.github/dependabot.yml`, weekly) watches root npm, `site/` npm, and github-actions. Minor/patch updates are grouped into one PR per ecosystem; majors get individual PRs.

## Publishing

Prompt before publishing (Hard Rule 4).

- **Auth**: npm Trusted Publishing via OIDC (no `NPM_TOKEN`).
- **Trigger**: GitHub Release published → `.github/workflows/publish.yml`.
- **Registry**: https://www.npmjs.com/package/@proof.com/proof-vc-web

### Release flow (after user confirms)

`main` is branch-protected: direct pushes are rejected. The version bump goes through a PR, and the tag is pushed only after merge so it points at the commit on `main`.

1. Bump on a branch:
   ```bash
   git switch -c release-X.Y.Z origin/main
   npm version patch          # or minor / major
   git tag -d vX.Y.Z          # discard npm's local tag; recreated in step 3
   git push -u origin release-X.Y.Z
   ```
2. Open a PR. Approve and merge it in the GitHub UI.
3. Tag the merged commit and create the Release:
   ```bash
   git switch main && git pull --ff-only origin main
   git tag vX.Y.Z && git push origin vX.Y.Z
   gh release create vX.Y.Z --generate-notes
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
- `@proof.com/proof-vc-common` is `yarn link`-ed during local dev; `package.json` already depends on the published version, the link just shadows it.
- `tsconfig.json` excludes `site`, `dist`, `node_modules` — don't remove from `exclude`; the site imports parent `src/`, which would otherwise cause `rootDir` failures.
- `dist/` is build output; `tsc` overwrites but doesn't delete stale files. Don't add a clean step without asking.
