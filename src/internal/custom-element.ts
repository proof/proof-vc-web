/**
 * SSR-safe class decorator that registers a custom element on import.
 *
 * Lit's own `@customElement` calls `customElements.define` unconditionally,
 * which throws when the module is evaluated in a non-DOM environment (Node /
 * SSR). This guards the define so the package imports safely server-side and
 * registers in the browser; it's idempotent (safe if more than one entry pulls
 * the element in). Each component self-registers via this decorator, so there's
 * no central registration file to maintain as components are added.
 */
export function customElement(tagName: string) {
  return <T extends CustomElementConstructor>(target: T): T => {
    if (typeof customElements !== "undefined" && !customElements.get(tagName)) {
      customElements.define(tagName, target);
    }
    return target;
  };
}
