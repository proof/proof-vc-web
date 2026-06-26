# Contributing

## Requirements

- `node` >= 24.0.0 (CI and local dev use the version pinned in `.node-version`, currently 24.14.1)
- `yarn` 4.x — managed by [Corepack](https://nodejs.org/api/corepack.html). Run `corepack enable` once; the version pinned by `packageManager` in `package.json` is then used automatically.

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

## Code of conduct

This project follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). By participating, you are expected to uphold this standard.
