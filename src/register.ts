import { ProofVerifyId } from "./proof-verify-id";

/**
 * Define `<proof-verify-id>` once. Guarded for SSR (no `customElements`) and
 * idempotent — both the main entry and the React wrapper call it.
 */
export function register(): void {
  if (
    typeof customElements !== "undefined" &&
    !customElements.get("proof-verify-id")
  ) {
    customElements.define("proof-verify-id", ProofVerifyId);
  }
}
