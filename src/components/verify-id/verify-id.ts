import { LitElement, html, nothing, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import {
  getAuthorizationRequestURL,
  type TransactionData,
} from "@proof.com/proof-vc-common";
import { customElement } from "../../internal/custom-element";
import { styles } from "./verify-id.styles";

const LABEL = "Continue with Proof";

const SEAL = html`<svg
  viewBox="0 0 155 158"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  aria-hidden="true"
>
  <g clip-path="url(#proof-seal-clip)" fill="currentColor">
    <path
      d="M78.6 23.5V0C35.2 0 0 35.2 0 78.6c0 43.4 35.2 78.6 78.6 78.6v-23.4c-30.5 0-55.2-24.7-55.2-55.2 0-30.5 24.8-55.1 55.2-55.1Zm55.2 55.1c0 30.5-24.7 55.2-55.2 55.2v-23.4c17.5 0 31.7-14.2 31.7-31.7S96.1 46.9 78.6 46.9V23.5c30.5 0 55.2 24.7 55.2 55.1Z"
    />
    <path
      d="M78.6 46.9v63.5c-17.5 0-31.7-14.2-31.7-31.7s14.2-31.8 31.7-31.8Zm61.6 78.5c-.1-.6-.3-1-.8-1.3-.5-.3-1.1-.5-1.7-.5-.5 0-.9.1-1.3.2-.4.2-.7.4-.8.7-.2.2-.3.6-.3 1 0 .3.1.6.2.7.2.2.3.4.6.5.2.2.5.2.7.3.2.1.5.2.7.2l1.1.3c.3.1.7.2 1 .3.3.2.7.3 1 .6.3.2.6.5.8.9.2.4.3.8.3 1.3 0 .6-.2 1.1-.5 1.6s-.7.9-1.4 1.1c-.7.2-1.3.4-2.2.4-.8 0-1.5-.2-2.1-.4-.6-.2-1.1-.7-1.4-1.1-.3-.4-.5-1-.6-1.6h1.4c0 .4.2.7.4 1.1.2.3.6.5.9.6.3.1.8.2 1.2.2.5 0 1-.1 1.4-.2.4-.2.7-.4 1-.7.3-.3.3-.7.3-1.1 0-.3-.1-.7-.3-.9-.2-.2-.5-.4-.8-.6-.3-.2-.7-.2-1.1-.4l-1.4-.4c-.9-.2-1.6-.6-2.1-1.1-.5-.5-.7-1.1-.7-1.8s.2-1.1.5-1.6.8-.8 1.4-1.1c.6-.3 1.2-.4 2-.4.7 0 1.3.2 1.9.4.6.2 1 .6 1.3 1.1.3.5.5 1 .5 1.5l-1.1.2Zm3.7-2.8h1.6l3.8 9.3h.2l3.8-9.3h1.6v11.2h-1.2v-8.5h-.1l-3.4 8.5H149l-3.4-8.5h-.1v8.5h-1.2l-.4-11.2Z"
    />
  </g>
  <defs>
    <clipPath id="proof-seal-clip">
      <path fill="#fff" d="M0 0h154.9v157.2H0z" />
    </clipPath>
  </defs>
</svg>`;

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

/** Typed add/removeEventListener overloads keyed by `ProofVerifyIdEventMap`. */
interface TypedEventListener<O> {
  <K extends keyof ProofVerifyIdEventMap>(
    type: K,
    listener: (this: ProofVerifyId, ev: ProofVerifyIdEventMap[K]) => unknown,
    options?: boolean | O,
  ): void;
  (
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | O,
  ): void;
}

/**
 * A branded "Continue with Proof" button that starts a Proof verifiable-
 * credentials flow on click.
 *
 * @element proof-verify-id
 *
 * @attr {string} nonce - Verification nonce. Required unless `resolveAuthorizationUrl` is set.
 * @attr {string} transaction-data - Pre-encoded transaction-data string (HTML-only consumers).
 *
 * @fires {CustomEvent<ProofNavigateEventDetail>} proof-navigate - Cancelable; before the redirect. `preventDefault()` to take over navigation.
 * @fires {CustomEvent<ProofErrorEventDetail>} proof-error - When starting the flow fails (missing nonce, throwing resolver).
 */
@customElement("proof-verify-id")
export class ProofVerifyId extends LitElement {
  static styles = styles;

  declare addEventListener: TypedEventListener<AddEventListenerOptions>;
  declare removeEventListener: TypedEventListener<EventListenerOptions>;

  /** Visual theme; defaults to `primary` via CSS when unset. */
  @property({ reflect: true }) theme: ProofVerifyIdTheme | null = null;

  /** Button size; defaults to `medium`. `icon` hides the label. */
  @property({ reflect: true }) size: ProofVerifyIdSize | null = null;

  /** OAuth `state` echoed back on the redirect. */
  @property({ reflect: true }) state: string | null = null;

  /** Pre-fills the authorization login hint. */
  @property({ reflect: true, attribute: "login-hint" })
  loginHint: string | null = null;

  /** Structured transaction data from the proof-vc-common factories. */
  @property({ attribute: false }) transactionData: TransactionData | undefined;

  /** Escape hatch returning the redirect URL; bypasses the built-in builder. */
  @property({ attribute: false })
  resolveAuthorizationUrl: AuthorizationUrlResolver | undefined;

  @state() private _pending = false;

  constructor() {
    super();
    /* Listen on the host so host.click() (e.g. a form submit) triggers the flow;
       a real button click bubbles up to the host anyway. */
    this.addEventListener("click", () => {
      void this.#navigate();
    });
  }

  protected override updated(): void {
    /* aria-busy belongs on the host, where the light DOM can observe it. */
    this.setAttribute("aria-busy", this._pending ? "true" : "false");
  }

  protected override render(): TemplateResult {
    const iconOnly = this.size === "icon";
    /* While loading the visible label is hidden (and leaves the a11y tree), so
       name the button via aria-label when it's icon-only or busy. */
    return html`
      <button
        type="button"
        class=${this._pending ? "loading" : nothing}
        ?disabled=${this._pending}
        aria-label=${iconOnly || this._pending ? LABEL : nothing}
      >
        ${SEAL}
        <span class="content">
          <span class="label" ?hidden=${iconOnly}>${LABEL}</span>
          <span class="dots" aria-hidden="true">
            <span class="dot"></span><span class="dot"></span
            ><span class="dot"></span>
          </span>
        </span>
      </button>
    `;
  }

  /**
   * Resolve the URL, dispatch a cancelable `proof-navigate`, then redirect.
   * A nullish URL or a prevented event aborts; failures fire `proof-error`.
   * Stays busy while the page unloads, restoring only if navigation didn't happen.
   */
  async #navigate() {
    if (this._pending) return;
    this._pending = true;
    let navigating = false;
    try {
      const url = this.resolveAuthorizationUrl
        ? await this.resolveAuthorizationUrl()
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
      if (!navigating) this._pending = false;
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
      this.transactionData ?? this.getAttribute("transaction-data") ?? null;

    return getAuthorizationRequestURL({
      nonce,
      scope: "urn:proof:params:scope:verifiable-credentials:basic",
      ...(state !== null && { state }),
      ...(login_hint !== null && { loginHint: login_hint }),
      ...(transaction_data && { transactionData: transaction_data }),
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "proof-verify-id": ProofVerifyId;
  }
}
