# Proof VC Web - AI Assistant Guide

A browser-only ESM TypeScript package: `@proof.com/proof-vc-web`. Ships a single Web Component, `<proof-verify-id>`, that consumers drop into any markup — React, Vue, Svelte, plain HTML — and that kicks off a Proof verifiable-credentials flow on click. Depends on `@proof.com/proof-vc-common` for `init`, `getAuthorizationRequestURL`, and the `transactionData` builder.

## Hard Rules

1. **Files under `src/` MUST NOT import `node:*` or any Node-only package.** This package runs in browsers only. There is no Node entry. Type-only imports (`import type`, `export type *`) are safe because `verbatimModuleSyntax: true` erases them at emit.

2. **The SSR guards in `src/proof_verify_id.ts` and `src/index.ts` MUST stay.** Three sites would otherwise throw when an SSR framework (Next, etc.) evaluates the imported module in Node:
   - `class extends HTMLElement` → guarded by a conditional `Base` constant.
   - `new CSSStyleSheet()` at module scope → guarded by `typeof CSSStyleSheet !== "undefined"`.
   - `customElements.define(...)` → guarded by `typeof customElements !== "undefined"`.

3. **`src/react.ts` MUST NOT be referenced from `src/index.ts`.** It is the sub-path types entry only (`@proof.com/proof-vc-web/react`). Importing it from the main entry would force every non-React consumer (Vue, Svelte, vanilla) to install `@types/react`.

4. **ALWAYS prompt the user before publishing to npm.** Never bump version, push tags, create a GitHub Release, or trigger the publish workflow without explicit confirmation. Publishes are effectively permanent.

5. **Run `yarn check-all` before any commit or push.** It composes format, lint, typecheck, publint. The global pre-commit rule applies; this repo's equivalent of "tests + lint" is the full check suite.

6. **Do not change `yarn publint` to use any flag other than `--pack npm`.** Default `--pack auto` selects yarn-1 mode and reports false-positive "file not published" errors.

7. **Do not widen `engines.node` below `>=22.0.0`.** Matches proof-vc-common.

## Essential Commands

| Command               | Purpose                                       |
| --------------------- | --------------------------------------------- |
| `yarn check-all`      | Full check: format, lint, typecheck, publint  |
| `yarn build`          | `tsc` emit to `dist/`                         |
| `yarn typecheck`      | `tsc --noEmit`                                |
| `yarn lint:check`     | eslint, no fix                                |
| `yarn lint`           | `eslint --fix`                                |
| `yarn format:check`   | `prettier --check`                            |
| `yarn format`         | `prettier --write`                            |
| `yarn publint`        | `publint --pack npm` — do not change the flag |
| `cd site && yarn dev` | Webpack dev server on http://localhost:4000   |

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

`<proof-verify-id>` attaches an open shadow root containing a single `<button>`, the seal `<svg>`, and (unless `size="icon"`) a `<span>` label.

- One module-scope `CSSStyleSheet` is built from `styles.ts` and adopted into every shadow root via `adoptedStyleSheets`.
- `static observedAttributes = ["size"]` — only `size` changes a structural state (label visibility + `aria-label`). `theme` is pure CSS. `nonce`, `state`, `login-hint`, `transaction-data` are read at click time, not observed.
- There is no `connectedCallback`. `attributeChangedCallback` fires during the parser upgrade for parsed HTML, on programmatic `setAttribute`, and on framework-driven attribute updates — that covers React/Vue/Svelte too.
- Click handler: read `nonce` (required, throws otherwise) plus optional `state`/`login-hint`/transaction data, call `getAuthorizationRequestURL(...)`, then `window.location.href = url`. The inner button's `disabled` is toggled during the pending request.

### Transaction data — property vs attribute

`AuthorizationRequestParams.transaction_data` accepts `TransactionData | string`. The component mirrors that:

- **Property**: `el.transactionData = transactionData.paymentMandate({...})` — structured, fully typed, returned from the proof-vc-common factories. JS/JSX entry point.
- **Attribute**: `transaction-data="..."` — the already-encoded string form, for HTML-only consumers.

`#onClick` prefers the property; the attribute is the fallback.

### Styling — defaults and theming

Themes (`dark` / `gray` / `outline` / `primary`) and sizes (`small` / `medium` / `large` / `icon`) are applied via `:host([theme="..."])` and `:host([size="..."])` selectors. Defaults are wired with grouped selectors so the unattributed element and the explicit-default attribute produce identical output:

```css
:host(:not([theme])) button,
:host([theme="primary"]) button { ... }
```

Same pattern for `:host(:not([size])) button, :host([size="medium"]) button`. The default theme is `primary`; the default size is `medium`.

### Sub-path types entry

`@proof.com/proof-vc-web/react` is a types-only entry. `dist/react.js` is an empty module — its purpose is to make the export valid. The `.d.ts` augments `React.JSX.IntrinsicElements` so `<proof-verify-id ...>` typechecks in TSX.

Consumers opt in:

```json
{ "compilerOptions": { "types": ["@proof.com/proof-vc-web/react"] } }
```

…or with a triple-slash reference, or a type-only side-effect import.

## TypeScript Conventions

- `verbatimModuleSyntax: true` — ALWAYS use `import type` / `export type` for types.
- `noUncheckedIndexedAccess: true` — array indexing returns `T | undefined`; use `!` only after guaranteed-safe access.
- `exactOptionalPropertyTypes: true` — use conditional spread for optional fields: `...(state !== null && { state })`.
- Local imports use the `.ts` extension (rewritten to `.js` on emit by `rewriteRelativeImportExtensions`).
- HTML attribute names use kebab-case in the DOM API and in JSX types (`"login-hint"`, `"transaction-data"`). The matching JS property for the typed transaction data is camelCase (`transactionData`).
- `src/react.ts` uses `namespace JSX` syntax — the only legal way to augment React's JSX. ESLint has a per-file override disabling `@typescript-eslint/no-namespace` for it.

## Recipes

### Add a new theme

In `src/styles.ts`:

1. Add a new `:host([theme="<name>"]) button { ... }` block with `background-color`, `color`, optional `border`, and a `&:hover` rule.

In `src/react.ts`:

2. Add `<name>` to the literal union on `theme?` in `ProofVerifyIdJSXAttributes`.

In `site/public/index.html`:

3. Add a demo row mirroring the existing themes if you want it visible in the test site.

No code change in `proof_verify_id.ts` — themes are pure CSS.

### Add a new size

Same shape as themes:

1. `src/styles.ts` — new `:host([size="<name>"]) button { ... }` rule with `height`, `padding`, `font-size`, `gap`, `border-radius`, and `svg { width/height }`.
2. `src/react.ts` — extend the `size?` literal union.
3. If the new size needs special label behavior (e.g. icon-only hides label and sets `aria-label`), update `#syncSize()` in `proof_verify_id.ts`. Otherwise no JS change.

### Add a JSX types entry for another framework

The pattern in `src/react.ts` is the template:

1. Create `src/<framework>.ts` (e.g. `src/vue.ts`) with the framework's module augmentation.
2. Add the sub-path to `package.json` `exports`: `"./<framework>": { "types": "./dist/<framework>.d.ts" }`.
3. If the framework's TS rules trip the `no-namespace` lint, add the file path to the per-file ESLint override in `eslint.config.js`.
4. If the framework's `@types/...` package is needed at build time, add it to `devDependencies` and as an optional peer.

### Adjust the seal icon

The SVG inline source is `SEAL_SVG` in `proof_verify_id.ts` (a string assigned to `button.innerHTML`). Replace the entire string. The icon is `currentColor`-filled, so theming flows through automatically.

The same path data is mirrored in `docs/button.svg` and `docs/buttons.svg` (inside a `<symbol id="seal">`). Update those too if you change the icon, or the docs drift.

## Publishing

ALWAYS prompt the user before publishing (see Hard Rules).

- **Auth**: npm Trusted Publishing via OIDC. No `NPM_TOKEN` in secrets.
- **Trigger**: GitHub Release published.
- **Workflow**: `.github/workflows/publish.yml`.
- **Registry page**: `https://www.npmjs.com/package/@proof.com/proof-vc-web`

### Release flow (after user confirms)

```bash
npm version patch                              # or minor / major
git push --follow-tags
gh release create vX.Y.Z --generate-notes
```

The workflow fires on release-published: full check suite → verifies the tag matches `package.json` → `npm publish --provenance --access public`.

### Troubleshooting 404 from `npm publish`

A 404 after the provenance step succeeded means npm rejected auth (returns 404 instead of 403 to hide existence). Check the Trusted Publisher config at `https://www.npmjs.com/package/@proof.com/proof-vc-web/access`:

- Organization matches the GitHub org owning the repo (case-sensitive)
- Repository: `proof-vc-web`
- Workflow filename: `publish.yml`
- Environment: empty (unless the workflow uses GitHub Environments)

## Notes

- `yarn.lock` is the only lockfile. No `package-lock.json`.
- Scope is `@proof.com` (with the dot), not `@proof`.
- CI uses Node 24 actions: `actions/checkout@v6` and `actions/setup-node@v6`.
- The local directory is still named `proof-vc-react/`; the npm package, GitHub URLs, and code all use `proof-vc-web`. A rename is pending.
- `@proof.com/proof-vc-common` is consumed via `yarn link` during local dev. The `dependencies` entry in `package.json` already points at the published version; the link just shadows it.
- `tsconfig.json` excludes `site`, `dist`, `node_modules`. Don't remove from `exclude` — the site's source imports from parent `src/` and pulling it into the parent's program causes `rootDir` failures.
- `dist/` is build output. `tsc` overwrites but won't delete stale files from prior layouts. Don't add a clean step without asking.
