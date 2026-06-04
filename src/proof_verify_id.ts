import {
  getAuthorizationRequestURL,
  type TransactionData,
} from "@proof.com/proof-vc-common";
import { css } from "./styles.ts";

const SEAL_SVG = `<svg viewBox="0 0 155 158" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g clip-path="url(#proof-seal-clip)" fill="currentColor"><path d="M78.6 23.5V0C35.2 0 0 35.2 0 78.6c0 43.4 35.2 78.6 78.6 78.6v-23.4c-30.5 0-55.2-24.7-55.2-55.2 0-30.5 24.8-55.1 55.2-55.1Zm55.2 55.1c0 30.5-24.7 55.2-55.2 55.2v-23.4c17.5 0 31.7-14.2 31.7-31.7S96.1 46.9 78.6 46.9V23.5c30.5 0 55.2 24.7 55.2 55.1Z"/><path d="M78.6 46.9v63.5c-17.5 0-31.7-14.2-31.7-31.7s14.2-31.8 31.7-31.8Zm61.6 78.5c-.1-.6-.3-1-.8-1.3-.5-.3-1.1-.5-1.7-.5-.5 0-.9.1-1.3.2-.4.2-.7.4-.8.7-.2.2-.3.6-.3 1 0 .3.1.6.2.7.2.2.3.4.6.5.2.2.5.2.7.3.2.1.5.2.7.2l1.1.3c.3.1.7.2 1 .3.3.2.7.3 1 .6.3.2.6.5.8.9.2.4.3.8.3 1.3 0 .6-.2 1.1-.5 1.6s-.7.9-1.4 1.1c-.7.2-1.3.4-2.2.4-.8 0-1.5-.2-2.1-.4-.6-.2-1.1-.7-1.4-1.1-.3-.4-.5-1-.6-1.6h1.4c0 .4.2.7.4 1.1.2.3.6.5.9.6.3.1.8.2 1.2.2.5 0 1-.1 1.4-.2.4-.2.7-.4 1-.7.3-.3.3-.7.3-1.1 0-.3-.1-.7-.3-.9-.2-.2-.5-.4-.8-.6-.3-.2-.7-.2-1.1-.4l-1.4-.4c-.9-.2-1.6-.6-2.1-1.1-.5-.5-.7-1.1-.7-1.8s.2-1.1.5-1.6.8-.8 1.4-1.1c.6-.3 1.2-.4 2-.4.7 0 1.3.2 1.9.4.6.2 1 .6 1.3 1.1.3.5.5 1 .5 1.5l-1.1.2Zm3.7-2.8h1.6l3.8 9.3h.2l3.8-9.3h1.6v11.2h-1.2v-8.5h-.1l-3.4 8.5H149l-3.4-8.5h-.1v8.5h-1.2l-.4-11.2Z"/></g><defs><clipPath id="proof-seal-clip"><path fill="#fff" d="M0 0h154.9v157.2H0z"/></clipPath></defs></svg>`;

const sheet: CSSStyleSheet | null =
  typeof CSSStyleSheet !== "undefined"
    ? (() => {
        const s = new CSSStyleSheet();
        s.replaceSync(css);
        return s;
      })()
    : null;

const Base: typeof HTMLElement =
  typeof HTMLElement !== "undefined"
    ? HTMLElement
    : (class {} as unknown as typeof HTMLElement);

const LABEL = "Continue with Proof";

export class ProofVerifyId extends Base {
  static readonly observedAttributes = ["size"] as const;

  readonly #button: HTMLButtonElement;
  readonly #label: HTMLSpanElement;
  #pending = false;
  #transactionData: TransactionData | undefined;

  get transactionData(): TransactionData | undefined {
    return this.#transactionData;
  }
  set transactionData(value: TransactionData | undefined) {
    this.#transactionData = value;
  }

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    if (sheet) shadow.adoptedStyleSheets = [sheet];

    this.#button = document.createElement("button");
    this.#button.type = "button";
    this.#button.innerHTML = SEAL_SVG;

    this.#label = document.createElement("span");
    this.#label.textContent = LABEL;
    this.#button.appendChild(this.#label);

    this.#button.addEventListener("click", () => {
      void this.#onClick();
    });

    shadow.appendChild(this.#button);
  }

  attributeChangedCallback(name: string) {
    if (name === "size") this.#syncSize();
  }

  #syncSize() {
    const iconOnly = this.getAttribute("size") === "icon";
    this.#label.hidden = iconOnly;
    if (iconOnly) {
      this.#button.setAttribute("aria-label", LABEL);
    } else {
      this.#button.removeAttribute("aria-label");
    }
  }

  async #onClick() {
    if (this.#pending) return;
    const nonce = this.nonce || this.getAttribute("nonce");
    if (!nonce) {
      throw new Error("<proof-verify-id>: 'nonce' is required");
    }

    this.#pending = true;
    this.#button.disabled = true;
    try {
      const state = this.getAttribute("state");
      const login_hint = this.getAttribute("login-hint");
      const transaction_data =
        this.#transactionData ?? this.getAttribute("transaction-data");

      window.location.href = await getAuthorizationRequestURL({
        nonce,
        scope: "urn:proof:params:scope:verifiable-credentials:basic",
        ...(state !== null && { state }),
        ...(login_hint !== null && { login_hint }),
        ...(transaction_data !== null && { transaction_data }),
      });
    } finally {
      this.#pending = false;
      this.#button.disabled = false;
    }
  }
}
