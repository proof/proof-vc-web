import {
  getAuthorizationRequestURL,
  type TransactionData,
} from "@proof.com/proof-vc-common";
import { css } from "./styles";

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
  | string
  | null
  | undefined
  | Promise<string | null | undefined>;

export type ProofVerifyIdTheme = "dark" | "gray" | "outline" | "primary";
export type ProofVerifyIdSize = "icon" | "small" | "medium" | "large";

/** Detail of the `proof-error` event dispatched when starting the flow fails. */
export type ProofErrorEventDetail = { error: unknown };

/** Detail of the `proof-navigate` event. Cancelable; `preventDefault()` to handle the redirect yourself. */
export type ProofNavigateEventDetail = { url: string };

/** Custom events dispatched by `<proof-verify-id>`, keyed by type. */
export interface ProofVerifyIdEventMap extends HTMLElementEventMap {
  "proof-error": CustomEvent<ProofErrorEventDetail>;
  "proof-navigate": CustomEvent<ProofNavigateEventDetail>;
}

/**
 * A branded "Continue with Proof" button that starts a Proof verifiable-
 * credentials flow on click.
 *
 * @element proof-verify-id
 *
 * @attr {primary|dark|gray|outline} theme - Visual theme. Defaults to `primary`.
 * @attr {medium|small|large|icon} size - Button size. Defaults to `medium`; `icon` hides the label.
 * @attr {string} nonce - Verification nonce. Required unless `resolveAuthorizationUrl` is set.
 * @attr {string} state - OAuth `state` echoed back on the redirect.
 * @attr {string} login-hint - Pre-fills the authorization login hint.
 * @attr {string} transaction-data - Pre-encoded transaction-data string (HTML-only consumers).
 *
 * @prop {AuthorizationUrlResolver} resolveAuthorizationUrl - Escape hatch returning the redirect URL; bypasses the built-in URL builder.
 * @prop {TransactionData} transactionData - Structured transaction data from the proof-vc-common factories.
 *
 * @fires {CustomEvent<ProofNavigateEventDetail>} proof-navigate - Cancelable; dispatched before the redirect. `preventDefault()` to take over navigation.
 * @fires {CustomEvent<ProofErrorEventDetail>} proof-error - Dispatched when starting the flow fails (missing nonce, throwing resolver).
 */
export class ProofVerifyId extends Base {
  static readonly observedAttributes = ["size"] as const;

  readonly #button: HTMLButtonElement;
  readonly #label: HTMLSpanElement;
  #pending = false;
  #transactionData: TransactionData | undefined;
  #resolveAuthorizationUrl: AuthorizationUrlResolver | undefined;

  get transactionData(): TransactionData | undefined {
    return this.#transactionData;
  }
  set transactionData(value: TransactionData | undefined) {
    this.#transactionData = value;
  }

  get resolveAuthorizationUrl(): AuthorizationUrlResolver | undefined {
    return this.#resolveAuthorizationUrl;
  }
  set resolveAuthorizationUrl(value: AuthorizationUrlResolver | undefined) {
    this.#resolveAuthorizationUrl = value;
  }

  /*
   * Reflected to attributes so frameworks can set them as props while plain HTML
   * uses the attributes. `nonce` stays on the inherited IDL property: browsers
   * blank the nonce attribute after parse, so the property is the reliable read.
   */
  get theme(): ProofVerifyIdTheme | null {
    return this.getAttribute("theme") as ProofVerifyIdTheme | null;
  }
  set theme(value: ProofVerifyIdTheme | null) {
    this.#reflect("theme", value);
  }

  get size(): ProofVerifyIdSize | null {
    return this.getAttribute("size") as ProofVerifyIdSize | null;
  }
  set size(value: ProofVerifyIdSize | null) {
    this.#reflect("size", value);
  }

  get state(): string | null {
    return this.getAttribute("state");
  }
  set state(value: string | null) {
    this.#reflect("state", value);
  }

  get loginHint(): string | null {
    return this.getAttribute("login-hint");
  }
  set loginHint(value: string | null) {
    this.#reflect("login-hint", value);
  }

  #reflect(name: string, value: string | null): void {
    if (value == null) this.removeAttribute(name);
    else this.setAttribute(name, value);
  }

  /**
   * Recover props set before the element upgraded. A prop assigned before
   * `customElements.define` runs becomes an own data-property that shadows the
   * accessor, so the setter never fires. Delete and re-assign to route it back
   * through the setter. Only runs on the upgrade path, so setAttribute is safe.
   */
  #upgradeProperties(): void {
    const props = [
      "theme",
      "size",
      "state",
      "loginHint",
      "transactionData",
      "resolveAuthorizationUrl",
    ] as const;
    for (const prop of props) {
      if (!Object.prototype.hasOwnProperty.call(this, prop)) continue;
      const value = this[prop];
      delete (this as Partial<this>)[prop];
      (this as Record<(typeof props)[number], unknown>)[prop] = value;
    }
  }

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    if (sheet) shadow.adoptedStyleSheets = [sheet];

    this.#button = document.createElement("button");
    /* Method calls, not property assignment: the CEM analyzer mis-reads
       `this.#button.innerHTML = …` and friends as class fields. */
    this.#button.setAttribute("type", "button");
    this.#button.insertAdjacentHTML("afterbegin", SEAL_SVG);

    this.#label = document.createElement("span");
    this.#label.classList.add("label");
    this.#label.append(LABEL);

    const dots = document.createElement("span");
    dots.classList.add("dots");
    dots.setAttribute("aria-hidden", "true");
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement("span");
      dot.classList.add("dot");
      dots.append(dot);
    }

    const content = document.createElement("span");
    content.classList.add("content");
    content.append(this.#label, dots);

    this.#button.append(content);

    /* Listen on the host so host.click() (e.g. a form submit) triggers the flow;
       a real button click bubbles up to the host anyway. */
    this.addEventListener("click", () => {
      void this.#navigate();
    });

    shadow.appendChild(this.#button);

    this.#upgradeProperties();
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

  /**
   * Resolve the URL, dispatch a cancelable `proof-navigate`, then redirect.
   * A nullish URL or a prevented event aborts; failures fire `proof-error`.
   * Stays busy while the page unloads, restoring only if navigation didn't happen.
   */
  async #navigate() {
    if (this.#pending) return;

    this.#pending = true;
    this.#setBusy(true);
    let navigating = false;
    try {
      const url = this.#resolveAuthorizationUrl
        ? await this.#resolveAuthorizationUrl()
        : await this.#buildAuthorizationUrl();

      if (url) {
        const proceed = this.dispatchEvent(
          new CustomEvent<ProofNavigateEventDetail>("proof-navigate", {
            detail: { url },
            bubbles: true,
            composed: true,
            cancelable: true,
          }),
        );
        if (proceed) {
          window.location.href = url;
          /* Set after the assignment, so a throw (e.g. blocked navigation) lets
             finally restore the button. */
          navigating = true;
        }
      }
    } catch (error) {
      this.dispatchEvent(
        new CustomEvent<ProofErrorEventDetail>("proof-error", {
          detail: { error },
          bubbles: true,
          composed: true,
          cancelable: true,
        }),
      );
    } finally {
      if (!navigating) {
        this.#pending = false;
        this.#setBusy(false);
      }
    }
  }

  async #buildAuthorizationUrl(): Promise<string> {
    const nonce = this.nonce || this.getAttribute("nonce");
    if (!nonce) {
      throw new Error("<proof-verify-id>: 'nonce' is required");
    }

    const state = this.state;
    const login_hint = this.loginHint;
    /* Property wins over attribute; empty string counts as absent. */
    const transaction_data =
      this.#transactionData ?? this.getAttribute("transaction-data") ?? null;

    return getAuthorizationRequestURL({
      nonce,
      scope: "urn:proof:params:scope:verifiable-credentials:basic",
      ...(state !== null && { state }),
      ...(login_hint !== null && { loginHint: login_hint }),
      ...(transaction_data && { transactionData: transaction_data }),
    });
  }

  /**
   * Toggle the pending state. `aria-busy` on the host; `disabled` and `loading`
   * on the button. Loading hides the label (and its accessible name), so set an
   * aria-label while busy and let #syncSize restore it after.
   */
  #setBusy(busy: boolean) {
    this.#button.disabled = busy;
    this.#button.classList.toggle("loading", busy);
    this.setAttribute("aria-busy", busy ? "true" : "false");
    if (busy) this.#button.setAttribute("aria-label", LABEL);
    else this.#syncSize();
  }
}

/**
 * Typed add/removeEventListener overloads so listeners get the CustomEvent
 * detail without a cast. Implementations come from HTMLElement.
 */
export interface ProofVerifyId {
  addEventListener<K extends keyof ProofVerifyIdEventMap>(
    type: K,
    listener: (this: ProofVerifyId, ev: ProofVerifyIdEventMap[K]) => unknown,
    options?: boolean | AddEventListenerOptions,
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void;
  removeEventListener<K extends keyof ProofVerifyIdEventMap>(
    type: K,
    listener: (this: ProofVerifyId, ev: ProofVerifyIdEventMap[K]) => unknown,
    options?: boolean | EventListenerOptions,
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ): void;
}
