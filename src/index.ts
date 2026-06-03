import { ProofVerifyId } from "./proof_verify_id.ts";

if (
  typeof customElements !== "undefined" &&
  !customElements.get("proof-verify-id")
) {
  customElements.define("proof-verify-id", ProofVerifyId);
}

export { ProofVerifyId };
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
