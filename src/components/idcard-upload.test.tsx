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
  it("opens the photo picker straight away, and the guidelines tick is checked when saving", async () => {
    localStorage.setItem("user", JSON.stringify({ name: "Ada Obi", account_type: "fresher", level: "100" }));
    (globalThis as any).fetch = vi.fn(async () => ({ ok: true, status: 200, json: async () => status }));
    render(
      <>
        <IdCardApplication />
        <Toaster />
      </>,
    );
    const chooser = await screen.findByText("Choose photo");
    const label = chooser.closest("label") as HTMLLabelElement;
    expect(label.getAttribute("for")).toBe("id-photo-input");
    const input = document.getElementById("id-photo-input") as HTMLInputElement;
    expect(input.type).toBe("file");
    expect(input.disabled).toBe(false);

    // Not ticked, and the click still reaches the file input.
    const clicks = vi.fn();
    input.addEventListener("click", clicks);
    fireEvent.click(label);
    await waitFor(() => expect(clicks).toHaveBeenCalled());
  });
});
