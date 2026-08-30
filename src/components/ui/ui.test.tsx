// @vitest-environment jsdom

import { act, createElement, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { Button } from "./Button";
import { Checkbox } from "./Checkbox";
import { Dialog } from "./Dialog";
import { TextField } from "./TextField";

let container: HTMLDivElement;
let root: Root;

beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

  HTMLDialogElement.prototype.showModal ??= function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close ??= function close() {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
});

afterEach(async () => {
  await act(() => root?.unmount());
  container?.remove();
});

async function render(element: ReactElement) {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(() => root.render(element));
  return container;
}

describe("UI primitives", () => {
  it("connects TextField label, helper, and error semantics", async () => {
    const view = await render(
      createElement(TextField, {
        id: "email",
        label: "Email",
        helperText: "Gunakan email aktif.",
        error: "Email tidak valid.",
      }),
    );
    const input = view.querySelector("input")!;

    expect(view.querySelector("label")?.htmlFor).toBe("email");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toBe(
      "email-helper email-error",
    );
    expect(view.querySelector('[role="alert"]')?.textContent).toBe(
      "Email tidak valid.",
    );
  });

  it("disables a loading Button and exposes its busy state", async () => {
    const view = await render(
      createElement(Button, { loading: true, children: "Simpan" }),
    );
    const button = view.querySelector("button")!;

    expect(button.disabled).toBe(true);
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect(button.textContent).toContain("Memproses");
  });

  it("keeps Checkbox keyboard-native and labelled", async () => {
    const view = await render(
      createElement(Checkbox, { id: "consent", label: "Saya setuju" }),
    );
    const checkbox = view.querySelector("input")!;

    expect(checkbox.type).toBe("checkbox");
    expect(view.querySelector("label")?.htmlFor).toBe("consent");
  });

  it("opens a modal Dialog and handles Escape cancellation", async () => {
    const onClose = vi.fn();
    const view = await render(
      createElement(Dialog, {
        open: true,
        title: "Batalkan perubahan?",
        description: "Perubahan yang belum disimpan akan hilang.",
        onClose,
      }),
    );
    const dialog = view.querySelector("dialog")!;

    expect(dialog.open).toBe(true);
    expect(document.activeElement).toBe(dialog);
    const cancelEvent = new Event("cancel", { cancelable: true });
    await act(() => dialog.dispatchEvent(cancelEvent));

    expect(cancelEvent.defaultPrevented).toBe(true);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("restores focus after Dialog closes", async () => {
    const trigger = document.createElement("button");
    document.body.append(trigger);
    trigger.focus();
    const props = {
      title: "Konfirmasi",
      onClose: vi.fn(),
    };
    const view = await render(createElement(Dialog, { ...props, open: true }));

    expect(document.activeElement).toBe(view.querySelector("dialog"));
    await act(() =>
      root.render(createElement(Dialog, { ...props, open: false })),
    );

    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });
});
