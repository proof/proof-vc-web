# Proof Digital Credentials - Web Components

<img src="docs/button.png" alt="drawing" width="300"/>

_Web Components to harness Proof Digital Credentials built on top of [@proof.com/proof-vc-common](https://github.com/proof/proof-vc-common)._

Read our [documentation](https://dev.proof.com/docs/digital-credentials-overview) or [try them](https://demo.next.proof.com)!

## Table of Contents

- [Installation](#installation)
- [Getting Started](#getting-started)
  - [Custom authorization URL](#custom-authorization-url)
- [Styles](#styles)
- [TypeScript](#typescript)
  - [React](#react)
- [Documentation](#documentation)
- [Contributing](#contributing)

## Installation

```
npm install @proof.com/proof-vc-web
```

## Getting Started

To request a Verifiable Presentation, drop the `<proof-verify-id />` HTML tag anywhere and give it your verifier config:

```html
<proof-verify-id
  environment="sandbox"
  client-id="<CLIENT_ID>"
  callback-uri="<CALLBACK_URI>"
  nonce="3e8e4918-e9fb-453a-a538-81152be15c1b"
/>
```

You can also provide a `login-hint`, `state`, or `response-mode` (`fragment` (default) | `direct_post`):

```html
<proof-verify-id
  environment="sandbox"
  client-id="<CLIENT_ID>"
  callback-uri="<CALLBACK_URI>"
  nonce="3e8e4918-e9fb-453a-a538-81152be15c1b"
  state="6A2B4CD830"
  login-hint="frodo.baggins@theshire"
  response-mode="direct_post"
/>
```

### Custom authorization URL

You can pass a `resolveAuthorizationUrl` property to create your own authorization request URL (e.g. a Pushed Authorization Request server-side).
When set, the element ignores the `environment` / `client-id` / `callback-uri` / `response-mode` / `nonce` / `state` / `login-hint` attributes.

```javascript
import { buildAuthorizationUrl } from "@proof.com/proof-vc-web";

<proof-verify-id
  resolveAuthorizationUrl={() =>
    buildAuthorizationUrl({
      environment: "sandbox",
      clientId: "<CLIENT_ID>",
      callbackUri: "<CALLBACK_URI>",
      nonce: "3e8e4918-e9fb-453a-a538-81152be15c1b",
      scope: "urn:proof:params:scope:verifiable-credentials:basic",
    })
  }
/>;
```

Return `null` (or `undefined`) to cancel the redirect.

## Styles

You can customize your `<proof-verify-id />` with the following attributes:

- `theme`: `dark` | `gray` | `outline` | `primary` (default)
- `size`: `icon` | `small` | `medium` (default) | `large`

<img src="docs/buttons.png" alt="drawing" width="800"/>

## TypeScript

The package ships its own type definitions; everything you import from `@proof.com/proof-vc-web` is fully typed by default.

### React

`<proof-verify-id />` works in React 19+ JSX. To get type checking and prop autocomplete in TSX, opt in to the React types subpath in your project's `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["@proof.com/proof-vc-web/react"]
  }
}
```

Or, drop a triple-slash reference in any `.d.ts` file in your project:

```ts
/// <reference types="@proof.com/proof-vc-web/react" />
```

Both forms activate the `React.JSX.IntrinsicElements` augmentation that types `environment`, `client-id`, `callback-uri`, `nonce`, `theme`, `size`, and the other attributes.

## Documentation

_Digital Credentials_ guides https://dev.proof.com/docs/digital-credentials-overview \
_API Documentation_ https://dev.proof.com/reference/authorizeverifiablecredentialpresentation

## Contributing

[Contribution guidelines for this project](CONTRIBUTING.md)
