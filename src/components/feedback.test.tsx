import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent, cleanup } from "@testing-library/react";
import FeedbackForm from "@/components/FeedbackForm";

// The Radix switch measures itself with ResizeObserver, which jsdom does not have.
(globalThis as any).ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };

let sent: { headers: Record<string, string>; body: any } | null = null;
const mockFetch = () => {
  sent = null;
  (globalThis as any).fetch = vi.fn(async (_url: string, opts: any = {}) => {
    sent = { headers: opts.headers || {}, body: JSON.parse(opts.body) };
    return { ok: true, status: 200, json: async () => ({ message: "Thank you. Your suggestion has been sent to the executives." }) };
  });
};

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("FeedbackForm", () => {
  it("suggestion starts anonymous: no name or email fields, and the sign-in token is not sent", async () => {
    localStorage.setItem("token", "member-token");
    mockFetch();
    render(<FeedbackForm defaultKind="suggestion" />);
    expect(screen.queryByPlaceholderText("Your full name")).toBeNull();
    expect(screen.queryByPlaceholderText("you@example.com")).toBeNull();
    fireEvent.change(screen.getByPlaceholderText(/start, stop or improve/i), { target: { value: "Open the lab on weekends" } });
    fireEvent.click(screen.getByRole("button", { name: /send suggestion/i }));
    await waitFor(() => expect(sent).not.toBeNull());
    expect(sent!.body).toMatchObject({ kind: "suggestion", is_anonymous: true, full_name: "", email: "", message: "Open the lab on weekends" });
    expect(sent!.headers.Authorization).toBe("");
  });

  it("a normal message asks for name and email and sends them", async () => {
    mockFetch();
    render(<FeedbackForm />);
    fireEvent.change(screen.getByPlaceholderText("Your full name"), { target: { value: "Ada Obi" } });
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "ada@example.com" } });
    fireEvent.change(screen.getByPlaceholderText("How can we help?"), { target: { value: "Hello there" } });
    fireEvent.click(screen.getByRole("button", { name: /send message/i }));
    await waitFor(() => expect(sent).not.toBeNull());
    expect(sent!.body).toMatchObject({ kind: "message", is_anonymous: false, full_name: "Ada Obi", email: "ada@example.com" });
  });

  it("switching to Complaint turns anonymous on and hides the identity fields", () => {
    mockFetch();
    render(<FeedbackForm />);
    expect(screen.getByPlaceholderText("Your full name")).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: "Complaint" }));
    expect(screen.queryByPlaceholderText("Your full name")).toBeNull();
    expect(screen.getByRole("button", { name: /send complaint/i })).toBeTruthy();
  });
});
