/* Package entry. `export *` from each component registers it on import (via the
 * `@customElement` decorator) and re-exports its public API. Add a line per
 * component. */
export * from "./components/verify-id/verify-id";
export {
  init,
  transactionData,
  type Environment,
  type ResponseMode,
  type TransactionData,
  type WireInstructionsPayload,
  type PaymentMandatePayload,
  type PaymentItemizedPayload,
  type SessionDataPayload,
} from "@proof.com/proof-vc-common";
