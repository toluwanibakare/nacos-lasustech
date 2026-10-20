import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent, cleanup, within } from "@testing-library/react";
import Messages from "@/components/admin/Messages";
import { Toaster } from "@/components/ui/toaster";

const messages = [
  { id: 1, kind: "message", is_anonymous: 0, full_name: "Ada Obi", email: "ada@example.com", subject: "Contact", message: "When is the next meeting?", is_read: 0, replied_at: null, created_at: "2026-10-19 10:00:00", has_reply_email: 0, replies: [] },
  { id: 2, kind: "suggestion", is_anonymous: 1, full_name: "Anonymous", email: "", subject: "Suggestion", message: "Open the lab on weekends", is_read: 0, replied_at: null, created_at: "2026-10-19 11:00:00", has_reply_email: 1, replies: [] },
  { id: 3, kind: "complaint", is_anonymous: 1, full_name: "Anonymous", email: "", subject: "Complaint", message: "The fan is broken", is_read: 0, replied_at: null, created_at: "2026-10-19 12:00:00", has_reply_email: 0, replies: [] },
  { id: 4, kind: "message", is_anonymous: 0, full_name: "Tunde B", email: "tunde@example.com", subject: "Contact", message: "Question about dues", is_read: 1, replied_at: "2026-10-19 13:00:00", created_at: "2026-10-19 09:00:00", has_reply_email: 0, replies: [{ id: 9, message_id: 4, reply_text: "Dues are N2,000.", sent_by: "Super admin", created_at: "2026-10-19 13:00:00" }] },
];

type Call = { url: string; method: string; body: any };
let calls: Call[] = [];
const mockApi = () => {
  calls = [];
  localStorage.setItem("adminToken", "t");
  (globalThis as any).fetch = vi.fn(async (url: string, opts: any = {}) => {
    const path = String(url).replace(/^https?:\/\/[^/]+\/api/, "");
    calls.push({ url: path, method: opts.method || "GET", body: opts.body ? JSON.parse(opts.body) : null });
    if (path.endsWith("/messages") && (opts.method || "GET") === "GET") return { ok: true, status: 200, json: async () => messages };
    if (path.includes("/reply")) return { ok: true, status: 200, json: async () => ({ status: "success" }) };
    return { ok: true, status: 200, json: async () => ({}) };
  });
};

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("admin Messages replies", () => {
  it("offers a reply on named and on anonymous-with-email, but not when there is nowhere to send it", async () => {
    mockApi();
    render(<Messages />);
    await screen.findByText("When is the next meeting?");
    const card = (text: string) => screen.getByText(text).closest("div.rounded-2xl") as HTMLElement;

    expect(within(card("When is the next meeting?")).getByRole("button", { name: /get response/i })).not.toBeDisabled();
    expect(within(card("Open the lab on weekends")).getByRole("button", { name: /get response/i })).not.toBeDisabled();
    const noAddress = within(card("The fan is broken"));
    expect(noAddress.getByRole("button", { name: /get response/i })).toBeDisabled();
    expect(noAddress.getByText(/nowhere to send a reply/i)).toBeTruthy();
    // an answered message says so, shows the reply, and offers another
    const answered = within(card("Question about dues"));
    expect(answered.getByText("Replied")).toBeTruthy();
    expect(answered.getByText("Dues are N2,000.")).toBeTruthy();
    expect(answered.getByRole("button", { name: /reply again/i })).toBeTruthy();
  });

  it("states that an anonymous sender's email is encrypted and never shows it", async () => {
    mockApi();
    render(<Messages />);
    await screen.findByText("Open the lab on weekends");
    expect(screen.getByText(/stored encrypted/i)).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/enc:v1/);
    fireEvent.click(within(screen.getByText("Open the lab on weekends").closest("div.rounded-2xl") as HTMLElement).getByRole("button", { name: /get response/i }));
    expect(await screen.findByText(/stored encrypted, so you cannot see it/i)).toBeTruthy();
  });

  it("sends a reply to the right message and refreshes", async () => {
    mockApi();
    render(
      <>
        <Messages />
        <Toaster />
      </>,
    );
    await screen.findByText("When is the next meeting?");
    fireEvent.click(within(screen.getByText("When is the next meeting?").closest("div.rounded-2xl") as HTMLElement).getByRole("button", { name: /get response/i }));
    expect(await screen.findByText(/emailed to ada@example.com/i)).toBeTruthy();

    const send = screen.getByRole("button", { name: /send reply/i });
    expect(send).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText("Write your reply..."), { target: { value: "It is on Friday." } });
    expect(send).not.toBeDisabled();
    fireEvent.click(send);

    await waitFor(() => expect(calls.some((c) => c.method === "POST" && c.url === "/admin/messages/1/reply")).toBe(true));
    expect(calls.find((c) => c.method === "POST")!.body).toEqual({ reply: "It is on Friday." });
    await waitFor(() => expect(screen.getByText("Reply sent.")).toBeTruthy());
    // the list is reloaded after sending
    await waitFor(() => expect(calls.filter((c) => c.method === "GET" && c.url.endsWith("/messages")).length).toBeGreaterThan(1));
  });
});
