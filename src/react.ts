/* React sub-path barrel (`@proof.com/proof-vc-web/react`): each component's
   `@lit/react` wrapper, plus the shared proof-vc-common surface so `/react` is a
   superset of the main entry (init / transactionData import from here too). */
export * from "./components/verify-id/verify-id.react";
export * from "./common";
