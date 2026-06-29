import { register } from "./register";

register();

export { ProofVerifyId } from "./proof-verify-id";
export type {
  AuthorizationUrlResolver,
  ProofVerifyIdTheme,
  ProofVerifyIdSize,
  ProofErrorEventDetail,
  ProofNavigateEventDetail,
  ProofVerifyIdEventMap,
} from "./proof-verify-id";
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
