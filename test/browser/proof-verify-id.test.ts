import {
  fixture,
  expect,
  html,
  oneEvent,
  oneDefaultPreventedEvent,
  aTimeout,
} from "@open-wc/testing";
import { init } from "../../src";
import type { ProofVerifyId } from "../../src/proof-verify-id";

const tag = "proof-verify-id";

/* Non-production env so init()'s singleton guard never trips; the URL builder
   runs with no network. */
before(() => {
  init({
    environment: "sandbox",
    clientId: "test-client",
    callbackUri: "https://example.com/callback",
  });
});

describe(tag, () => {
  it("registers and renders a button in the shadow root", async () => {
    const el = await fixture<ProofVerifyId>(
      html`<proof-verify-id></proof-verify-id>`,
    );
    expect(customElements.get(tag)).to.exist;
    expect(el.shadowRoot?.querySelector("button")).to.exist;
  });

  describe("property ↔ attribute reflection", () => {
    it("reflects properties to attributes", async () => {
      const el = await fixture<ProofVerifyId>(
        html`<proof-verify-id></proof-verify-id>`,
      );
      el.theme = "dark";
      el.size = "large";
      el.state = "abc";
      el.loginHint = "user@example.com";
      expect(el.getAttribute("theme")).to.equal("dark");
      expect(el.getAttribute("size")).to.equal("large");
      expect(el.getAttribute("state")).to.equal("abc");
      expect(el.getAttribute("login-hint")).to.equal("user@example.com");
    });

    it("reads attributes back through the property getters", async () => {
      const el = await fixture<ProofVerifyId>(
        html`<proof-verify-id
          theme="gray"
          size="small"
          state="s"
          login-hint="h"
        ></proof-verify-id>`,
      );
      expect(el.theme).to.equal("gray");
      expect(el.size).to.equal("small");
      expect(el.state).to.equal("s");
      expect(el.loginHint).to.equal("h");
    });

    it("removes the attribute when a property is set to null", async () => {
      const el = await fixture<ProofVerifyId>(
        html`<proof-verify-id theme="dark"></proof-verify-id>`,
      );
      el.theme = null;
      expect(el.hasAttribute("theme")).to.be.false;
    });
  });

  describe('size="icon"', () => {
    it("hides the label and applies an aria-label", async () => {
      const el = await fixture<ProofVerifyId>(
        html`<proof-verify-id size="icon"></proof-verify-id>`,
      );
      const label = el.shadowRoot!.querySelector<HTMLElement>(".label")!;
      const button = el.shadowRoot!.querySelector("button")!;
      expect(label.hidden).to.be.true;
      expect(button.getAttribute("aria-label")).to.equal("Continue with Proof");
    });
  });

  describe("error handling", () => {
    it("dispatches proof-error when nonce is missing", async () => {
      const el = await fixture<ProofVerifyId>(
        html`<proof-verify-id></proof-verify-id>`,
      );
      setTimeout(() => el.click());
      const ev = (await oneEvent(el, "proof-error")) as CustomEvent;
      expect(ev.detail.error).to.be.instanceOf(Error);
      expect((ev.detail.error as Error).message).to.contain("nonce");
    });

    it("dispatches proof-error when the resolver throws", async () => {
      const el = await fixture<ProofVerifyId>(
        html`<proof-verify-id></proof-verify-id>`,
      );
      el.resolveAuthorizationUrl = () => {
        throw new Error("boom");
      };
      setTimeout(() => el.click());
      const ev = (await oneEvent(el, "proof-error")) as CustomEvent;
      expect((ev.detail.error as Error).message).to.equal("boom");
    });

    it("re-enables the button after a failure", async () => {
      const el = await fixture<ProofVerifyId>(
        html`<proof-verify-id></proof-verify-id>`,
      );
      setTimeout(() => el.click());
      await oneEvent(el, "proof-error");
      expect(el.shadowRoot!.querySelector("button")!.disabled).to.be.false;
    });
  });

  describe("resolveAuthorizationUrl", () => {
    it("aborts without error or navigation when the resolver returns null", async () => {
      const el = await fixture<ProofVerifyId>(
        html`<proof-verify-id></proof-verify-id>`,
      );
      let errored = false;
      el.addEventListener("proof-error", () => (errored = true));
      el.resolveAuthorizationUrl = () => null;
      el.click();
      await aTimeout(50);
      expect(errored).to.be.false;
      expect(el.shadowRoot!.querySelector("button")!.disabled).to.be.false;
    });
  });

  describe("accessibility (axe)", () => {
    it("has no axe violations in the default state", async () => {
      const el = await fixture<ProofVerifyId>(
        html`<proof-verify-id nonce="n"></proof-verify-id>`,
      );
      await expect(el).to.be.accessible();
    });

    it("has no axe violations as an icon-only button", async () => {
      const el = await fixture<ProofVerifyId>(
        html`<proof-verify-id size="icon" nonce="n"></proof-verify-id>`,
      );
      await expect(el).to.be.accessible();
    });

    it("has no axe violations while busy/disabled", async () => {
      const el = await fixture<ProofVerifyId>(
        html`<proof-verify-id></proof-verify-id>`,
      );
      /* Hold the resolver open so the button stays in its busy state. */
      el.resolveAuthorizationUrl = () => new Promise(() => {});
      el.click();
      await aTimeout(0);
      expect(el.getAttribute("aria-busy")).to.equal("true");
      await expect(el).to.be.accessible();
    });
  });

  describe("navigation (proof-navigate seam)", () => {
    /* oneDefaultPreventedEvent preventDefaults the redirect and resolves with the
       event, so the test page never actually navigates. */
    it("fires a cancelable proof-navigate with the resolved URL", async () => {
      const el = await fixture<ProofVerifyId>(
        html`<proof-verify-id></proof-verify-id>`,
      );
      el.resolveAuthorizationUrl = () => "https://example.com/auth?x=1";
      setTimeout(() => el.click());
      const ev = (await oneDefaultPreventedEvent(
        el,
        "proof-navigate",
      )) as CustomEvent;
      expect(ev.cancelable).to.be.true;
      expect(ev.detail.url).to.equal("https://example.com/auth?x=1");
    });

    it("re-enables the button when proof-navigate is canceled", async () => {
      const el = await fixture<ProofVerifyId>(
        html`<proof-verify-id></proof-verify-id>`,
      );
      el.resolveAuthorizationUrl = () => "https://example.com/auth";
      setTimeout(() => el.click());
      await oneDefaultPreventedEvent(el, "proof-navigate");
      expect(el.shadowRoot!.querySelector("button")!.disabled).to.be.false;
    });

    it("builds the authorization URL from the nonce attribute", async () => {
      const el = await fixture<ProofVerifyId>(
        html`<proof-verify-id nonce="abc123" state="s1"></proof-verify-id>`,
      );
      setTimeout(() => el.click());
      const ev = (await oneDefaultPreventedEvent(
        el,
        "proof-navigate",
      )) as CustomEvent;
      const url = new URL(ev.detail.url);
      expect(url.searchParams.get("nonce")).to.equal("abc123");
      expect(url.searchParams.get("state")).to.equal("s1");
      expect(url.searchParams.get("scope")).to.contain(
        "verifiable-credentials",
      );
    });

    it("prefers the nonce property over the attribute", async () => {
      const el = await fixture<ProofVerifyId>(
        html`<proof-verify-id></proof-verify-id>`,
      );
      el.setAttribute("nonce", "from-attr");
      el.nonce = "from-prop";
      setTimeout(() => el.click());
      const ev = (await oneDefaultPreventedEvent(
        el,
        "proof-navigate",
      )) as CustomEvent;
      expect(new URL(ev.detail.url).searchParams.get("nonce")).to.equal(
        "from-prop",
      );
    });

    it("toggles aria-busy on the host across the flow", async () => {
      const el = await fixture<ProofVerifyId>(
        html`<proof-verify-id></proof-verify-id>`,
      );
      let release: (url: string | null) => void = () => {};
      el.resolveAuthorizationUrl = () =>
        new Promise<string | null>((resolve) => {
          release = resolve;
        });
      el.click();
      /* #navigate runs synchronously up to the awaited resolver. */
      expect(el.getAttribute("aria-busy"), "busy while pending").to.equal(
        "true",
      );
      expect(el.shadowRoot!.querySelector("button")!.disabled).to.be.true;
      release(null); /* null aborts the redirect and restores the button */
      await aTimeout(0);
      expect(el.getAttribute("aria-busy"), "cleared after abort").to.equal(
        "false",
      );
    });
  });
});
