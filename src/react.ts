import { register } from "./register";
import * as React from "react";
import { createComponent, type EventName } from "@lit/react";
import {
  ProofVerifyId as ProofVerifyIdElement,
  type ProofErrorEventDetail,
  type ProofNavigateEventDetail,
} from "./proof-verify-id";

/*
 * Register on import — the wrapper needs the element defined. A register() call
 * (not a bare side-effect import) survives tsdown's tree-shaking of dist/react.js.
 */
register();

/**
 * Typed React wrapper for `<proof-verify-id>`. Element properties become props;
 * the `proof-error` / `proof-navigate` events map to `onProofError` /
 * `onProofNavigate`. Importing also registers the element.
 */
export const ProofVerifyId = createComponent({
  tagName: "proof-verify-id",
  elementClass: ProofVerifyIdElement,
  react: React,
  events: {
    /* Cast so @lit/react types these props with the CustomEvent detail. */
    onProofError: "proof-error" as EventName<
      CustomEvent<ProofErrorEventDetail>
    >,
    onProofNavigate: "proof-navigate" as EventName<
      CustomEvent<ProofNavigateEventDetail>
    >,
  },
});

/* Re-export public types so React consumers import from one entry. */
export type {
  AuthorizationUrlResolver,
  ProofVerifyIdTheme,
  ProofVerifyIdSize,
  ProofErrorEventDetail,
  ProofNavigateEventDetail,
  ProofVerifyIdEventMap,
} from "./proof-verify-id";
