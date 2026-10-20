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
    // The only email box left is the optional reply address, not the sender's own email.
    expect(screen.queryByText("Email Address")).toBeNull();
    expect(screen.getByText(/Want a reply\? Leave an email \(optional\)/i)).toBeTruthy();
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

describe("FeedbackForm reply email", () => {
  it("a message has no anonymous switch; suggestions and complaints can leave an encrypted reply email", async () => {
    mockFetch();
    render(<FeedbackForm />);
    // Message tab: name and email, no anonymity.
    expect(screen.queryByLabelText("Send anonymously")).toBeNull();
    expect(screen.getByPlaceholderText("Your full name")).toBeTruthy();

    fireEvent.click(screen.getByRole("tab", { name: "Suggestion" }));
    expect(screen.getByLabelText("Send anonymously")).toBeTruthy();
    expect(screen.getByText(/encrypted before it is stored/i)).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText(/start, stop or improve/i), { target: { value: "Open the lab on weekends" } });
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: " me@example.com " } });
    fireEvent.click(screen.getByRole("button", { name: /send suggestion/i }));
    await waitFor(() => expect(sent).not.toBeNull());
    expect(sent!.body).toMatchObject({ kind: "suggestion", is_anonymous: true, full_name: "", email: "", reply_email: "me@example.com" });
  });

  it("a named sender never sends a separate reply email", async () => {
    mockFetch();
    render(<FeedbackForm defaultKind="complaint" />);
    fireEvent.click(screen.getByLabelText("Send anonymously"));
    fireEvent.change(screen.getByPlaceholderText("Your full name"), { target: { value: "Ada Obi" } });
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "ada@example.com" } });
    fireEvent.change(screen.getByPlaceholderText(/What went wrong/i), { target: { value: "The hall fan is broken" } });
    fireEvent.click(screen.getByRole("button", { name: /send complaint/i }));
    await waitFor(() => expect(sent).not.toBeNull());
    expect(sent!.body).toMatchObject({ is_anonymous: false, full_name: "Ada Obi", email: "ada@example.com", reply_email: "" });
  });
});
