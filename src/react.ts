import type { HTMLAttributes } from "react";
import type {
  AuthorizationUrlResolver,
  ProofVerifyId,
} from "./proof_verify_id.ts";
import type { Environment, ResponseMode } from "@proof.com/proof-vc-common";

export interface ProofVerifyIdJSXAttributes extends HTMLAttributes<ProofVerifyId> {
  environment?: Environment;
  "client-id"?: string;
  "callback-uri"?: string;
  "response-mode"?: ResponseMode;
  nonce?: string;
  state?: string;
  theme?: "dark" | "gray" | "outline" | "primary";
  size?: "icon" | "small" | "medium" | "large";
  "login-hint"?: string;
  // Set as a property (React 19 assigns matching props on custom elements);
  // on React < 19 use a ref instead, as function props are stringified.
  resolveAuthorizationUrl?: AuthorizationUrlResolver;
}

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "proof-verify-id": ProofVerifyIdJSXAttributes;
    }
  }
}
