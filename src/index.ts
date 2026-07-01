import { ProofVerifyId } from "./proof_verify_id.ts";

if (
  typeof customElements !== "undefined" &&
  !customElements.get("proof-verify-id")
) {
  customElements.define("proof-verify-id", ProofVerifyId);
}

export { ProofVerifyId };
export {
  buildAuthorizationUrl,
  parseAuthorizationResponse,
  type Environment,
  type ResponseMode,
} from "@proof.com/proof-vc-common";
