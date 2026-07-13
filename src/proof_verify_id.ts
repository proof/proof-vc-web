import {
  buildAuthorizationUrl,
  type Environment,
  type ResponseMode,
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

export type AuthorizationUrlResolver = () =>
  string | null | undefined | Promise<string | null | undefined>;

export class ProofVerifyId extends Base {
  static readonly observedAttributes = ["size"] as const;

  readonly #button: HTMLButtonElement;
  readonly #label: HTMLSpanElement;
  #pending = false;
  #resolveAuthorizationUrl: AuthorizationUrlResolver | undefined;

  get resolveAuthorizationUrl(): AuthorizationUrlResolver | undefined {
    return this.#resolveAuthorizationUrl;
  }
  set resolveAuthorizationUrl(value: AuthorizationUrlResolver | undefined) {
    this.#resolveAuthorizationUrl = value;
  }

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    if (sheet) shadow.adoptedStyleSheets = [sheet];

    this.#button = document.createElement("button");
    this.#button.type = "button";
    this.#button.innerHTML = SEAL_SVG;

    this.#label = document.createElement("span");
    this.#label.className = "label";
    this.#label.textContent = LABEL;

    const dots = document.createElement("span");
    dots.className = "dots";
    dots.setAttribute("aria-hidden", "true");
    for (let i = 0; i < 3; i++) {
      dots.appendChild(document.createElement("span")).className = "dot";
    }

    const content = document.createElement("span");
    content.className = "content";
    content.append(this.#label, dots);

    this.#button.append(content);

    // Listen on the host, not the inner button, so a programmatic
    // `host.click()` (e.g. a form's submit handler) triggers the flow.
    // A real click on the inner button bubbles up to the host too.
    this.addEventListener("click", () => {
      void this.#navigate();
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

  async #navigate() {
    if (this.#pending) return;

    this.#pending = true;
    this.#setBusy(true);
    try {
      const url = this.#resolveAuthorizationUrl
        ? await this.#resolveAuthorizationUrl()
        : this.#buildAuthorizationUrl();

      // A nullish result aborts the redirect (e.g. the resolver cancelled).
      if (url) window.location.href = url;
    } finally {
      this.#pending = false;
      this.#setBusy(false);
    }
  }

  #buildAuthorizationUrl(): string {
    const environment = this.getAttribute("environment");
    const clientId = this.getAttribute("client-id");
    const callbackUri = this.getAttribute("callback-uri");
    const nonce = this.nonce || this.getAttribute("nonce");

    const missing = [
      ["environment", environment],
      ["client-id", clientId],
      ["callback-uri", callbackUri],
      ["nonce", nonce],
    ]
      .filter(([, value]) => !value)
      .map(([name]) => name);
    if (missing.length) {
      throw new Error(
        `<proof-verify-id>: missing required attribute(s): ${missing.join(", ")}`,
      );
    }

    const state = this.getAttribute("state");
    const login_hint = this.getAttribute("login-hint");
    const response_mode = this.getAttribute("response-mode");

    return buildAuthorizationUrl({
      environment: environment as Environment,
      clientId: clientId!,
      callbackUri: callbackUri!,
      nonce: nonce!,
      scope: "urn:proof:params:scope:verifiable-credentials:basic",
      ...(response_mode !== null && {
        responseMode: response_mode as ResponseMode,
      }),
      ...(state !== null && { state }),
      ...(login_hint !== null && { loginHint: login_hint }),
    });
  }

  #setBusy(busy: boolean) {
    this.#button.disabled = busy;
    this.#button.classList.toggle("loading", busy);
    this.#button.setAttribute("aria-busy", busy ? "true" : "false");
  }
}
