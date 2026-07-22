# Contributing

## Requirements

- `node` >= 22.0.0 (minimum supported, the `engines.node` floor). Develop on Node 24 (active LTS), pinned in `.node-version`.
- `yarn` (Berry) — pinned by the committed release under `.yarn/releases/`, referenced by `yarnPath`. Any `yarn` on your PATH delegates to it, so Homebrew's yarn 1.x works fine. If you have no `yarn` at all, run `corepack enable` once to get one — it ships with Node, and the pinned release takes over from there.

Installs are immutable: a plain `yarn install` never modifies `yarn.lock` and fails if it is out of sync with `package.json`. After adding or bumping a dependency, run `yarn install --no-immutable` and commit the updated `yarn.lock`.

## Design Principles

The package ships a Web Component (`<proof-verify-id>`) and is browser-only. It must not import Node-specific modules.

Server-side rendering is supported through guards that make the module load safely in non-DOM environments, the element only works in the browser.

A test site lives in `site/` and exists to exercise the component in a real browser; it is not published.
To run it just `cd site && yarn dev`.

## Commands

- `yarn build`
- `yarn format`
- `yarn lint`
- `yarn typecheck`
- `yarn publint`

## Pull Requests

To submit a pull request:

- Start by forking the repo and branching off of `main`.
- Include a clear title and description explaining what changed and why.
- Keep changes focused, try to limit one issue or feature per PR.

CI runs `typecheck` and `build` on a matrix of Node 22 (the `engines.node` floor) and Node 24 (active LTS, from `.node-version`). The other jobs (`format`, `lint`, `publint`, `site`) run on Node 24.

## Code of conduct

This project follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). By participating, you are expected to uphold this standard.
