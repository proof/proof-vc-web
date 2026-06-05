export const css = `
:host {
  display: inline-flex;
}

button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  padding: 0;
  cursor: pointer;
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system,
    BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial,
    "Noto Sans", sans-serif;
  font-weight: 500;
  line-height: 1.3;
  text-decoration: none;
  transition:
    background-color 120ms ease,
    border-color 120ms ease;

  svg {
    flex-shrink: 0;
  }

  &:focus-visible {
    outline: 2px solid #0046fa;
    outline-offset: 2px;
    box-shadow: none;
  }
}

:host(:not([theme])) button,
:host([theme="primary"]) button {
  background-color: #0046fa;
  color: #ffffff;

  &:hover {
    background-color: #0037c8;
  }
}

:host([theme="dark"]) button {
  background-color: #040919;
  color: #ffffff;

  &:hover {
    background-color: #1a1e2a;
  }
}

:host([theme="gray"]) button {
  background-color: #dfdfe5;
  color: #000000;

  &:hover {
    background-color: #cdcdd2;
  }
}

:host([theme="outline"]) button {
  background-color: transparent;
  color: #000000;
  border: 1px solid #040919;

  &:hover {
    background-color: #f7f7f9;
  }
}

:host(:not([size])) button,
:host([size="medium"]) button {
  height: 40px;
  padding: 0 16px;
  font-size: 14px;
  gap: 8px;
  border-radius: 8px;

  svg {
    width: 14px;
    height: 14px;
  }
}

:host([size="small"]) button {
  height: 32px;
  padding: 0 12px;
  font-size: 12px;
  gap: 8px;
  border-radius: 8px;

  svg {
    width: 12px;
    height: 12px;
  }
}

:host([size="large"]) button {
  height: 56px;
  padding: 0 24px;
  font-size: 18px;
  gap: 12px;
  border-radius: 8px;

  svg {
    width: 20px;
    height: 20px;
  }
}

:host([size="icon"]) button {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  font-size: 14px;

  svg {
    width: 18px;
    height: 18px;
  }
}

.content {
  display: inline-grid;
}

.content > * {
  grid-area: 1 / 1;
  align-self: center;
  justify-self: center;
}

.dots {
  display: none;
  align-items: center;
  gap: 0.35em;
}

button.loading .label {
  visibility: hidden;
}

button.loading .dots {
  display: inline-flex;
}

:host([size="icon"]) button.loading svg {
  display: none;
}

.dot {
  width: 0.4em;
  height: 0.4em;
  border-radius: 50%;
  background-color: currentColor;
  animation: proof-dot-wave 1.2s ease-in-out infinite;
}

.dot:nth-child(2) {
  animation-delay: 0.15s;
}

.dot:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes proof-dot-wave {
  0%,
  100% {
    opacity: 0.3;
  }
  40% {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .dot {
    animation: none;
    opacity: 0.6;
  }
}
`;
