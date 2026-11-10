import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import { Toaster } from "@/components/ui/toaster";

(globalThis as any).ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };
(globalThis as any).HTMLElement.prototype.scrollTo ??= () => {};
(globalThis as any).HTMLElement.prototype.scrollIntoView ??= () => {};

const profile = (email: string | null) => ({
  full_name: "Ada Obi", matric_number: "250303010025", level: "100", department: "Computer Science",
  email, whatsapp_number: "08011111111", gender: "Female", birthday: "2006-01-01", post: "Student",
});

let saved: any[] = [];
const run = (email: string | null) => {
  saved = [];
  localStorage.setItem("token", "t");
  localStorage.setItem("user", JSON.stringify({ id: 1, account_type: "student", matric: "250303010025", name: "Ada Obi" }));
  (globalThis as any).fetch = vi.fn(async (url: string, init?: RequestInit) => {
    const u = String(url);
    let body: unknown = {};
    if (u.endsWith("/student/dashboard")) body = { profile: profile(email), fees: { session: "2026/2027", dues: 2000, id_card_stalite: 1000 }, activities: [], idCard: null };
    else if (u.endsWith("/student/payments")) body = [];
    else if (u.endsWith("/student/profile") && init?.method === "PUT") { saved.push(JSON.parse(String(init.body))); body = { status: "success" }; }
    else if (u.endsWith("/hoc/me")) return { ok: false, status: 404, json: async () => ({ message: "no" }) };
    return { ok: true, status: 200, json: async () => body };
  });
  render(
    <MemoryRouter initialEntries={[{ pathname: "/dashboard", state: { tab: "profile" } }]}>
      <Dashboard />
      <Toaster />
    </MemoryRouter>,
  );
};

const emailBox = async () => {
  await screen.findByText("Email Address");
  return document.querySelector('input[type="email"]') as HTMLInputElement;
};

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("dashboard email field", () => {
  it("stays open while a new email is typed one letter at a time, and saves the whole address", async () => {
    run(null);
    const box = await emailBox();
    expect(box.disabled).toBe(false);
    const address = "ada.obi@gmail.com";
    for (let i = 1; i <= address.length; i++) {
      fireEvent.change(box, { target: { value: address.slice(0, i) } });
      // Not locked after the first letter, and the box shows what was typed, not a masked copy.
      expect(box.disabled).toBe(false);
      expect(box.value).toBe(address.slice(0, i));
    }
    fireEvent.click(screen.getByRole("button", { name: /update details|save all changes/i }));
    await waitFor(() => expect(saved.length).toBe(1));
    expect(saved[0].email).toBe(address);
  });

  it("refuses to save an incomplete address", async () => {
    run(null);
    const box = await emailBox();
    // The browser's own check stops a bare letter; "ada@gmail" passes it but is still not a full address.
    fireEvent.change(box, { target: { value: "a" } });
    fireEvent.click(screen.getByRole("button", { name: /update details|save all changes/i }));
    fireEvent.change(box, { target: { value: "ada@gmail" } });
    fireEvent.click(screen.getByRole("button", { name: /update details|save all changes/i }));
    await screen.findByText(/valid email address/i);
    expect(saved.length).toBe(0);
  });

  it("locks and masks a real saved email, and does not send it again on save", async () => {
    run("ada.obi@gmail.com");
    const box = await emailBox();
    await waitFor(() => expect(box.disabled).toBe(true));
    expect(box.value).toMatch(/^ada\*+@gm\*\*\*\.com$/);
    fireEvent.click(screen.getByRole("button", { name: /update details|save all changes/i }));
    await waitFor(() => expect(saved.length).toBe(1));
    expect("email" in saved[0]).toBe(false);
  });

  it("lets a student fix a broken saved email (one letter, or 0) instead of locking it in", async () => {
    run("a");
    const box = await emailBox();
    await waitFor(() => expect(box.value).toBe("a"));
    expect(box.disabled).toBe(false);
    expect(screen.getByText(/looks incomplete/i)).toBeTruthy();
    fireEvent.change(box, { target: { value: "ada.obi@gmail.com" } });
    fireEvent.click(screen.getByRole("button", { name: /update details|save all changes/i }));
    await waitFor(() => expect(saved[0]?.email).toBe("ada.obi@gmail.com"));
  });
});
