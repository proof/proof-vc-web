# Contributing

## Requirements

- `node` >= 24.0.0 (CI and local dev use the version pinned in `.node-version`, currently 24.14.1)
- `yarn` (Berry) — pinned by the committed release under `.yarn/releases/`, referenced by `yarnPath`. Any `yarn` on your PATH delegates to it, so Homebrew's yarn 1.x works fine. If you have no `yarn` at all, run `corepack enable` once to get one — it ships with Node, and the pinned release takes over from there.

Installs are immutable: a plain `yarn install` never modifies `yarn.lock` and fails if it is out of sync with `package.json`. After adding or bumping a dependency, run `yarn install --no-immutable` and commit the updated `yarn.lock`.

## Design Principles

The package ships a Web Component (`<proof-verify-id>`) and is browser-only. It must not import Node-specific modules.

Server-side rendering is supported through guards that make the module load safely in non-DOM environments, the element only works in the browser.

A dev harness lives in `playground/` and exists to exercise the component in a real browser; it is not published.
To run it just `yarn dev` (serves the playground at http://localhost:8000 via `@web/dev-server`).

## Commands

- `yarn build` — `tsdown`: unbundled ESM + types for npm, plus the self-contained `dist/proof-verify-id.min.js` CDN bundle (ES2022)
- `yarn test` — all tests: `yarn test:node` (`node:test` — built artifact + SSR) and `yarn test:browser` (`@web/test-runner` + Playwright, headless Chromium)
- `yarn format`
- `yarn lint`
- `yarn typecheck`
- `yarn publint`

## Pull Requests

To submit a pull request:

- Start by forking the repo and branching off of `main`.
- Include a clear title and description explaining what changed and why.
- Keep changes focused, try to limit one issue or feature per PR.

## Code of conduct

This project follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). By participating, you are expected to uphold this standard.
