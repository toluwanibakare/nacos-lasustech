import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent, cleanup } from "@testing-library/react";
import IdCardApplication from "@/components/IdCardApplication";
import { Toaster } from "@/components/ui/toaster";

(globalThis as any).ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };

const status = {
  status: "Not Registered",
  request: null,
  fee: 1000,
  photo: { image_path: null, zoom: null, cx: null, cy: null },
  card_issuable: false,
  card_note: null,
  editable: true,
  dues_cleared: false,
  dues_exempt: false,
  dues_fee: 2000,
};

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("ID card photo upload button", () => {
  it("needs the guidelines ticked first, then the tap lands on the real file input", async () => {
    localStorage.setItem("user", JSON.stringify({ name: "Ada Obi", account_type: "fresher", level: "100" }));
    (globalThis as any).fetch = vi.fn(async () => ({ ok: true, status: 200, json: async () => status }));
    render(
      <>
        <IdCardApplication />
        <Toaster />
      </>,
    );
    await screen.findByText("Choose photo");

    // Not ticked: tapping explains why and there is no file input to open yet.
    expect(document.querySelector('input[type="file"]')).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Choose photo" }));
    await waitFor(() => expect(screen.getByText("Tick the box first")).toBeTruthy());

    // Ticked: the invisible real file input covers the button.
    fireEvent.click(screen.getByRole("checkbox"));
    const input = (await waitFor(() => {
      const el = document.querySelector('input[type="file"]');
      expect(el).not.toBeNull();
      return el;
    })) as HTMLInputElement;
    expect(input.disabled).toBe(false);
    expect(input.accept).toContain("image/png");
    expect(input.className).toContain("absolute");
    expect(input.className).toContain("opacity-0");
  });
});
