import * as React from "react";
import { createComponent, type EventName } from "@lit/react";
import * as element from "./verify-id";

export const ProofVerifyId = createComponent({
  tagName: "proof-verify-id",
  elementClass: element.ProofVerifyId,
  react: React,
  events: {
    onProofError: "proof-error" as EventName<
      CustomEvent<element.ProofErrorEventDetail>
    >,
    onProofNavigate: "proof-navigate" as EventName<
      CustomEvent<element.ProofNavigateEventDetail>
    >,
  },
});

export * from "./verify-id";
