# Proof Digital Credentials - Web Components

<img src="https://raw.githubusercontent.com/proof/proof-vc-web/main/docs/button.png" alt="Continue with Proof button" width="300"/>

_Web Components to harness Proof Digital Credentials built on top of [@proof.com/proof-vc-common](https://github.com/proof/proof-vc-common)._

Read our [documentation](https://dev.proof.com/docs/digital-credentials-overview) or [try them](https://demo.next.proof.com)!

## Table of Contents

- [Installation](#installation)
- [CDN](#cdn)
- [Getting Started](#getting-started)
  - [Transaction Templates](#transaction-templates)
  - [Custom authorization URL](#custom-authorization-url)
  - [Events](#events)
- [Styles](#styles)
- [TypeScript](#typescript)
  - [React](#react)
- [Documentation](#documentation)
- [Changelog](#changelog)
- [Contributing](#contributing)

## Installation

```
npm install @proof.com/proof-vc-web
```

## CDN

For no-build pages, load the self-contained bundle as a module script. It registers `<proof-verify-id>` as a side effect and also exports `init` / `transactionData`. **Pin an exact version** (and add [SRI](https://developer.mozilla.org/docs/Web/Security/Subresource_Integrity) in production):

```html
<script type="module">
  import { init } from "https://cdn.jsdelivr.net/npm/@proof.com/proof-vc-web@0.2.0/dist/proof-verify-id.min.js";

  init({
    environment: "sandbox",
    clientId: "<CLIENT_ID>",
    callbackUri: "<CALLBACK_URI>",
  });
</script>

<proof-verify-id nonce="3e8e4918-e9fb-453a-a538-81152be15c1b"></proof-verify-id>
```

To only register the element (and call `init` elsewhere), an external module script works too:

```html
<script
  type="module"
  src="https://cdn.jsdelivr.net/npm/@proof.com/proof-vc-web@0.2.0/dist/proof-verify-id.min.js"
></script>
```

The bundle inlines all dependencies, so it is the only file you need. [unpkg](https://unpkg.com) works the same way, and the bare `https://cdn.jsdelivr.net/npm/@proof.com/proof-vc-web` resolves to it via the package's `jsdelivr` field.

> For a security-sensitive flow, prefer self-hosting this file from your own origin (exact version pin + SRI) rather than depending on a public CDN at runtime.

## Getting Started

To request a Verifiable Presentation, `init` the client once at the start of your application:

```javascript
import { init } from "@proof.com/proof-vc-web";

init({
  environment: "sandbox",
  clientId: "<CLIENT_ID>",
  callbackUri: "<CALLBACK_URI>",
});
```

then use the `<proof-verify-id>` HTML tag anywhere:

```html
<proof-verify-id nonce="3e8e4918-e9fb-453a-a538-81152be15c1b"></proof-verify-id>
```

You can also provide a `login-hint` or `state`:

```html
<proof-verify-id
  nonce="3e8e4918-e9fb-453a-a538-81152be15c1b"
  state="6A2B4CD830"
  login-hint="frodo.baggins@theshire"
></proof-verify-id>
```

### Transaction Templates

You can use _Transaction Templates_ provided by [@proof.com/proof-vc-common](https://github.com/proof/proof-vc-common) via
the `transactionData` prop:

```javascript
import { transactionData } from "@proof.com/proof-vc-web";

const data = transactionData.paymentItemized({
  title: "Drive Shaft",
  description: "The Roadhouse (18+), May 6 2026",
  currency: "USD",
  items: [
    { quantity: 2, unit_cost: 40.0, label: "General Admission" },
    { quantity: 2, unit_cost: 11.4, label: "Fees" },
  ],
});

<proof-verify-id
  nonce="3e8e4918-e9fb-453a-a538-81152be15c1b"
  transactionData={data}
/>;
```

### Custom authorization URL

You can pass a `resolveAuthorizationUrl` property to create your own authorization request URL (e.g. a Pushed Authorization Request server-side).
When set, the element ignores the `nonce` / `state` / `login-hint` / `transactionData` attributes.

```javascript
<proof-verify-id
  resolveAuthorizationUrl={async () => await getAuthorizationRequestURL()}
/>
```

Return `null` (or `undefined`) to cancel the redirect.

### Events

The element dispatches two `CustomEvent`s. Both bubble and cross the shadow boundary (`composed`), so you can listen on the element or any ancestor:

- **`proof-error`** — starting the flow failed (e.g. a missing `nonce`, or a `resolveAuthorizationUrl` that threw). `event.detail.error` holds the cause.
- **`proof-navigate`** — fired just before the browser is redirected to the authorization URL. `event.detail.url` is the resolved URL; call `event.preventDefault()` to suppress the hard redirect and navigate yourself (e.g. through a SPA router).

```javascript
const el = document.querySelector("proof-verify-id");

el.addEventListener("proof-error", (e) => {
  console.error("Proof flow failed:", e.detail.error);
});

el.addEventListener("proof-navigate", (e) => {
  // e.preventDefault();        // opt out of the built-in redirect
  // myRouter.push(e.detail.url);
});
```

In React these are the `onProofError` and `onProofNavigate` props (see [React](#react)).

## Styles

You can customize your `<proof-verify-id>` with the following attributes:

- `theme`: `dark` | `gray` | `outline` | `primary` (default)
- `size`: `icon` | `small` | `medium` (default) | `large`

<img src="https://raw.githubusercontent.com/proof/proof-vc-web/main/docs/buttons.png" alt="Continue with Proof button — themes and sizes" width="800"/>

## TypeScript

The package ships its own type definitions; everything you import from `@proof.com/proof-vc-web` is fully typed by default.

### React

A typed React wrapper is published at `@proof.com/proof-vc-web/react`. Install its peers, then import the component:

```
npm install @proof.com/proof-vc-web @lit/react react
```

```tsx
import { ProofVerifyId } from "@proof.com/proof-vc-web/react";

<ProofVerifyId
  nonce="3e8e4918-e9fb-453a-a538-81152be15c1b"
  theme="primary"
  size="large"
  transactionData={data}
  onProofError={(e) => console.error(e.detail.error)}
/>;
```

Element properties (`theme`, `size`, `state`, `loginHint`, `transactionData`, `resolveAuthorizationUrl`) are typed props, `nonce` and standard DOM attributes/events come from React, and the element's [events](#events) are exposed as the `onProofError` and `onProofNavigate` props. Importing the wrapper also registers the element. Works with React 17, 18, and 19 (via `@lit/react`). For any other React version — or no React — use the framework-agnostic `<proof-verify-id>` element directly.

## Documentation

_Digital Credentials_ guides https://dev.proof.com/docs/digital-credentials-overview \
_API Documentation_ https://dev.proof.com/reference/authorizeverifiablecredentialpresentation

## Changelog

Release notes are published on the [GitHub Releases](https://github.com/proof/proof-vc-web/releases) page.

## Contributing

[Contribution guidelines for this project](CONTRIBUTING.md)
