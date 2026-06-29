/*
 * Type-level test for the React wrapper (typechecked, not run). Guards that
 * `onProofError` / `onProofNavigate` carry the CustomEvent detail rather than a
 * bare Event; without the EventName casts in src/react.ts, `e.detail` wouldn't
 * compile. Runtime behavior is covered by the element's browser tests.
 */
import * as React from "react";
import { ProofVerifyId } from "../../src/react";

/* e.detail.* only compiles if `e` is the typed CustomEvent. */
const _element = React.createElement(ProofVerifyId, {
  theme: "dark",
  size: "large",
  nonce: "abc",
  onProofError: (e) => {
    const error: unknown = e.detail.error;
    void error;
  },
  onProofNavigate: (e) => {
    const url: string = e.detail.url;
    void url;
  },
});
void _element;

/* @ts-expect-error - `theme` is a constrained union; an unknown value is rejected. */
const _bad = React.createElement(ProofVerifyId, { theme: "rainbow" });
void _bad;
