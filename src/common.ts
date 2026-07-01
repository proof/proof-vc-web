/* Re-exports from @proof.com/proof-vc-common shared by both the main entry and
   the ./react sub-path, so /react is a superset (a React consumer can import
   `init` / `transactionData` from the same entry as the component). No React or
   element code here — safe for the main entry to pull in. */
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
